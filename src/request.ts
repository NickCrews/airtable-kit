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

export function makeRequester(
    { apiKey, baseUrl, fetch }: { apiKey: ApiKey | undefined; baseUrl: string; fetch: Fetcher },
): Requester {
    return async <T = unknown>({ path, method = "GET", data, baseUrl: baseUrlOverride }: RequestArgs): Promise<T> => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const token = typeof apiKey === "function" ? await apiKey() : apiKey;
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
            throw new AirtableKitApiError(
                `${method} ${path} failed: ${response.status} ${response.statusText} - ${typeof body === "string" ? body : JSON.stringify(body)}`,
                body,
                response.status,
            );
        }
        return body as T;
    };
}

function joinUrl(base: string, path: string): string {
    base = base.endsWith("/") ? base.slice(0, -1) : base;
    path = path.startsWith("/") ? path.slice(1) : path;
    return `${base}/${path}`;
}
