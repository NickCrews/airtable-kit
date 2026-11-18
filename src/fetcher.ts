import type { Fetcher } from "./request.ts";

/** The per-base request rate limit of the Airtable API. */
export const AIRTABLE_REQUESTS_PER_SECOND = 5;

/** Options for {@link withRetry}. */
export interface RetryOptions {
    /** Maximum number of retries after the first attempt. Defaults to 5. */
    maxRetries?: number;
    /** Base delay of the exponential backoff, in milliseconds. Defaults to 500. */
    initialDelayMs?: number;
    /** Upper bound on the exponential backoff delay, in milliseconds. Defaults to 10000. */
    maxDelayMs?: number;
    /**
     * Delay after an HTTP 429 response without a `Retry-After` header, in milliseconds.
     * Defaults to 30000, the wait Airtable documents for exceeding its rate limit.
     */
    rateLimitDelayMs?: number;
    /**
     * Decide whether to retry. Receives the response, or the error thrown by `fetch`.
     * Defaults to {@link defaultShouldRetry}. `maxRetries` applies regardless.
     */
    shouldRetry?: (outcome: Response | unknown, attempt: number, method: string) => boolean;
    /** Called before waiting to retry. Useful for logging. */
    onRetry?: (info: { outcome: Response | unknown; attempt: number; delayMs: number }) => void;
    /** Function used to wait between attempts. Defaults to a `setTimeout`-based sleep. */
    sleep?: (ms: number) => Promise<void>;
}

/**
 * Default rate of {@link withThrottle}: below {@link AIRTABLE_REQUESTS_PER_SECOND}, since requests
 * that start evenly spaced can reach Airtable closer together because of network jitter.
 */
const DEFAULT_THROTTLE_REQUESTS_PER_SECOND = 4.5;

/** Options for {@link withThrottle}. */
export interface ThrottleOptions {
    /**
     * Maximum requests per second for each key. Defaults to 4.5, below Airtable's limit of
     * {@link AIRTABLE_REQUESTS_PER_SECOND}, to leave room for network jitter.
     */
    requestsPerSecond?: number;
    /**
     * Group requests that share a rate limit. Defaults to the base ID at the start of the
     * URL path (eg `app123` for `/v0/app123/tbl456`), or `""` if there is none.
     */
    key?: (url: string) => string;
    /** Function used to wait for a free slot. Defaults to a `setTimeout`-based sleep. */
    sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Whether `value` is a fetch `Response`. Checks its shape rather than `instanceof Response`,
 * so responses from other fetch implementations (eg node-fetch, polyfills) are recognized.
 */
function isResponse(value: unknown): value is Response {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as Response).status === "number" &&
        typeof (value as Response).headers?.get === "function"
    );
}

/** Whether `value` is the error `fetch` throws for a network failure: a `TypeError`, possibly from another realm. */
function isNetworkError(value: unknown): boolean {
    return value instanceof Error && value.name === "TypeError";
}

/**
 * Release the connection held by a response that will not be read.
 * The cancellation is not awaited, since it does not settle for a stream that was teed by
 * `response.clone()` until every branch is cancelled. Errors are ignored, eg from a body
 * that is not a web `ReadableStream`.
 */
function discardBody(response: Response): void {
    try {
        response.body?.cancel().catch(() => {});
    } catch {
        // nothing to release
    }
}

/** HTTP methods that are retried after server errors and network errors by {@link defaultShouldRetry}. */
const IDEMPOTENT_METHODS = new Set(["GET", "PUT", "PATCH", "DELETE"]);

/**
 * The default retry policy used by {@link withRetry}:
 * - HTTP 429: always retried, since Airtable rejected the request without processing it.
 * - HTTP 5xx and network errors (a `TypeError` thrown by `fetch`): retried for GET, PUT, PATCH and DELETE.
 *   POST is not retried, since creates and uploads may have been processed.
 * - Anything else (eg 401, 422): not retried.
 */
export function defaultShouldRetry(outcome: Response | unknown, _attempt: number, method: string): boolean {
    if (isResponse(outcome)) {
        if (outcome.status === 429) {
            return true;
        }
        return outcome.status >= 500 && IDEMPOTENT_METHODS.has(method);
    }
    return isNetworkError(outcome) && IDEMPOTENT_METHODS.has(method);
}

/**
 * Parse a `Retry-After` header (delay-seconds or an HTTP date) into milliseconds.
 * Returns `undefined` if the header is missing or unparseable.
 */
export function parseRetryAfter(value: string | null): number | undefined {
    if (value === null || value.trim() === "") {
        return undefined;
    }
    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
        return Math.max(0, seconds * 1000);
    }
    const date = Date.parse(value);
    if (Number.isFinite(date)) {
        return Math.max(0, date - Date.now());
    }
    return undefined;
}

/**
 * Wrap a {@link Fetcher} so that failed requests are retried.
 *
 * The delay before each retry is, in order of precedence:
 * 1. The `Retry-After` header of the response, if present.
 * 2. `rateLimitDelayMs` for HTTP 429 responses.
 * 3. Exponential backoff with jitter: a random value between half and all of
 *    `min(maxDelayMs, initialDelayMs * 2 ** attempt)`.
 *
 * After `maxRetries` retries, the last response is returned, or the last error thrown.
 * The body of each response that is retried is cancelled, to release its connection.
 */
export function withRetry(fetcher: Fetcher, options: RetryOptions = {}): Fetcher {
    const {
        maxRetries = 5,
        initialDelayMs = 500,
        maxDelayMs = 10_000,
        rateLimitDelayMs = 30_000,
        shouldRetry = defaultShouldRetry,
        onRetry,
        sleep = defaultSleep,
    } = options;
    const delayFor = (outcome: Response | unknown, attempt: number): number => {
        if (isResponse(outcome)) {
            const retryAfter = parseRetryAfter(outcome.headers.get("retry-after"));
            if (retryAfter !== undefined) {
                return retryAfter;
            }
            if (outcome.status === 429) {
                return rateLimitDelayMs;
            }
        }
        const cap = Math.min(maxDelayMs, initialDelayMs * 2 ** attempt);
        return cap / 2 + Math.random() * (cap / 2);
    };
    return async (url, init) => {
        const method = init.method ?? "GET";
        for (let attempt = 0; ; attempt++) {
            let outcome: Response | unknown;
            try {
                const response = await fetcher(url, init);
                if (!shouldRetry(response, attempt, method) || attempt >= maxRetries) {
                    return response;
                }
                discardBody(response);
                outcome = response;
            } catch (error) {
                if (attempt >= maxRetries || !shouldRetry(error, attempt, method)) {
                    throw error;
                }
                outcome = error;
            }
            const delayMs = delayFor(outcome, attempt);
            onRetry?.({ outcome, attempt, delayMs });
            await sleep(delayMs);
        }
    };
}

/**
 * Wrap a {@link Fetcher} so that requests with the same key start at least
 * `1000 / requestsPerSecond` milliseconds apart. Each call has its own limit.
 */
export function withThrottle(fetcher: Fetcher, options: ThrottleOptions = {}): Fetcher {
    const {
        requestsPerSecond = DEFAULT_THROTTLE_REQUESTS_PER_SECOND,
        key = baseIdKey,
        sleep = defaultSleep,
    } = options;
    if (!(requestsPerSecond > 0)) {
        throw new Error(`requestsPerSecond must be positive, got ${requestsPerSecond}`);
    }
    const intervalMs = 1000 / requestsPerSecond;
    // The earliest time the next request for each key may start.
    const nextSlot = new Map<string, number>();
    return async (url, init) => {
        const k = key(url);
        const now = Date.now();
        const start = Math.max(now, nextSlot.get(k) ?? now);
        nextSlot.set(k, start + intervalMs);
        if (start > now) {
            await sleep(start - now);
        }
        return fetcher(url, init);
    };
}

/** Group key for {@link withThrottle}: the base ID in the URL path, or `""` if there is none. */
export function baseIdKey(url: string): string {
    const match = /\/(app[A-Za-z0-9]+)(?:\/|$|\?)/.exec(new URL(url).pathname);
    return match ? match[1] : "";
}

/** Shared by every client created without a custom `fetch`, so clients in one process share the limit. */
let defaultFetcher: Fetcher | undefined;

/**
 * The default fetcher used by `createAirtable`: `globalThis.fetch` wrapped with {@link withThrottle}
 * and {@link withRetry}, both with their default options.
 */
export function makeDefaultFetcher(): Fetcher {
    defaultFetcher ??= withRetry(withThrottle((url, init) => globalThis.fetch(url, init)));
    return defaultFetcher;
}
