import { AirtableKitApiError } from "./exceptions.ts";

/**
 * A function with the shape of the standard `fetch`, narrowed to the call signature airtable-kit uses.
 *
 * `globalThis.fetch` satisfies this type, as do most fetch wrappers (retrying, logging, rate limiting, etc).
 * airtable-kit builds the full URL, sets the method, headers (including `Authorization`), and JSON body,
 * and parses the JSON response.
 */
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/**
 * An Airtable API key or OAuth access token, or a function returning one.
 *
 * A function is called before every request, eg to return a refreshed OAuth token.
 */
export type ApiKey = string | (() => string | Promise<string>);

/** Arguments for a single request to the Airtable API. */
export interface RequestArgs {
    /** Path relative to the base URL, eg '/appXXX/tblXXX' */
    path: string;
    /** HTTP method, defaults to GET */
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    /** Data to send as the JSON request body */
    data?: unknown;
    /** Overrides the client's base URL for this request */
    baseUrl?: string;
}

/**
 * Send a request to the Airtable API and return the parsed JSON response.
 *
 * @throws {@link AirtableKitApiError} if the response status is not ok.
 */
export type Requester = <T = unknown>(args: RequestArgs) => Promise<T>;

/** Default base URL for the Airtable API: "https://api.airtable.com/v0" */
export const DEFAULT_BASE_URL = "https://api.airtable.com/v0";

/** Default base URL for attachment uploads: "https://content.airtable.com/v0" */
export const DEFAULT_CONTENT_BASE_URL = "https://content.airtable.com/v0";

export function makeRequester(
    { getToken, baseUrl, fetch }: {
        /** Returns the token for the `Authorization` header, or undefined to omit the header */
        getToken: () => Promise<string | undefined>;
        baseUrl: string;
        fetch: Fetcher;
    },
): Requester {
    return async <T = unknown>({ path, method = "GET", data, baseUrl: baseUrlOverride }: RequestArgs): Promise<T> => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const token = await getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(joinUrl(baseUrlOverride ?? baseUrl, path), {
            method,
            headers,
            body: JSON.stringify(data),
        });
        const text = await response.text();
        let body: unknown = text;
        try {
            body = JSON.parse(text);
        } catch {
            // keep the text
        }
        if (!response.ok) {
            const { type, message: airtableMessage } = parseAirtableError(body);
            const detail = type
                ? (airtableMessage ? `${type}: ${airtableMessage}` : type)
                : truncate(typeof body === "string" ? body : JSON.stringify(body), 500);
            throw new AirtableKitApiError({
                message: `${method} ${path} failed: ${response.status} ${response.statusText}${detail ? ` - ${detail}` : ""}`,
                status: response.status,
                type,
                airtableMessage,
                rawResponse: body,
                method,
                path,
            });
        }
        return body as T;
    };
}

/**
 * Read the error type and message from an Airtable error body. Airtable uses these formats:
 * - `{ "error": { "type": "INVALID_FILTER_BY_FORMULA", "message": "..." } }`
 * - `{ "error": "NOT_FOUND" }`
 * - `{ "errors": [{ "error": "RATE_LIMIT_REACHED", "message": "..." }] }`
 */
function parseAirtableError(body: unknown): { type?: string; message?: string } {
    if (typeof body !== "object" || body === null) {
        return {};
    }
    const { error, errors } = body as { error?: unknown; errors?: unknown };
    if (typeof error === "string") {
        return { type: error };
    }
    if (typeof error === "object" && error !== null) {
        const { type, message } = error as { type?: unknown; message?: unknown };
        return {
            type: typeof type === "string" ? type : undefined,
            message: typeof message === "string" ? message : undefined,
        };
    }
    if (Array.isArray(errors) && typeof errors[0] === "object" && errors[0] !== null) {
        const { error: type, message } = errors[0] as { error?: unknown; message?: unknown };
        return {
            type: typeof type === "string" ? type : undefined,
            message: typeof message === "string" ? message : undefined,
        };
    }
    return {};
}

function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function joinUrl(base: string, path: string): string {
    base = base.endsWith("/") ? base.slice(0, -1) : base;
    path = path.startsWith("/") ? path.slice(1) : path;
    return `${base}/${path}`;
}
