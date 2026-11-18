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
    /**
     * Function used to wait between attempts. Defaults to a `setTimeout`-based sleep.
     * Receives the request's `signal`, if any, and should reject with its `reason` when it aborts.
     */
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/** Options for {@link withThrottle}. */
export interface ThrottleOptions {
    /** Maximum requests per second for each key. Defaults to {@link AIRTABLE_REQUESTS_PER_SECOND}. */
    requestsPerSecond?: number;
    /**
     * Group requests that share a rate limit. Defaults to the base ID at the start of the
     * URL path (eg `app123` for `/v0/app123/tbl456`), or `""` if there is none.
     */
    key?: (url: string) => string;
    /**
     * Function used to wait for a free slot. Defaults to a `setTimeout`-based sleep.
     * Receives the request's `signal`, if any, and should reject with its `reason` when it aborts.
     */
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/** Resolve after `ms` milliseconds, or reject with the signal's `reason` as soon as it aborts. */
function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
            reject(signal.reason);
            return;
        }
        const onAbort = () => {
            clearTimeout(timer);
            reject(signal!.reason);
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        signal?.addEventListener("abort", onAbort, { once: true });
    });
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
    if (outcome instanceof Response) {
        if (outcome.status === 429) {
            return true;
        }
        return outcome.status >= 500 && IDEMPOTENT_METHODS.has(method);
    }
    return outcome instanceof TypeError && IDEMPOTENT_METHODS.has(method);
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
 *
 * If `init.signal` aborts, the wait stops and no more attempts are made: the call rejects with the signal's `reason`.
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
        if (outcome instanceof Response) {
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
                outcome = response;
            } catch (error) {
                if (init.signal?.aborted || attempt >= maxRetries || !shouldRetry(error, attempt, method)) {
                    throw error;
                }
                outcome = error;
            }
            const delayMs = delayFor(outcome, attempt);
            onRetry?.({ outcome, attempt, delayMs });
            await sleep(delayMs, init.signal ?? undefined);
            init.signal?.throwIfAborted();
        }
    };
}

/**
 * Wrap a {@link Fetcher} so that requests with the same key start at least
 * `1000 / requestsPerSecond` milliseconds apart. Each call has its own limit.
 *
 * If `init.signal` aborts while waiting for a slot, the call rejects with the signal's `reason` without sending.
 */
export function withThrottle(fetcher: Fetcher, options: ThrottleOptions = {}): Fetcher {
    const {
        requestsPerSecond = AIRTABLE_REQUESTS_PER_SECOND,
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
            await sleep(start - now, init.signal ?? undefined);
            init.signal?.throwIfAborted();
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
const defaultThrottle = { current: undefined as Fetcher | undefined };

/**
 * The default fetcher used by `createAirtable`: `globalThis.fetch`, throttled to
 * {@link AIRTABLE_REQUESTS_PER_SECOND} per base, and retried on rate limits and transient errors.
 */
export function makeDefaultFetcher(): Fetcher {
    defaultThrottle.current ??= withRetry(withThrottle((url, init) => globalThis.fetch(url, init)));
    return defaultThrottle.current;
}
