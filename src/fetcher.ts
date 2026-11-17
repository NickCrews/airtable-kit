/**
 * A function with the shape of the standard `fetch`, narrowed to the call signature airtable-kit uses.
 *
 * `globalThis.fetch` satisfies this type, as do most fetch wrappers (retrying, logging, rate limiting, etc).
 * airtable-kit builds the full URL, sets the method, headers (including `Authorization`), and JSON body,
 * and parses the JSON response.
 *
 * This is provided for injecting custom fetch behavior, and for mocking in tests.
 */
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Configuration options for making requests to the Airtable API.
 */
export type FetchConfig = {
    /** Base URL for the Airtable API, defaults to https://api.airtable.com/v0 */
    baseUrl?: string;
    /** Environment variable name to read the API key from, defaults to AIRTABLE_API_KEY */
    apiKeyEnvVar?: string;
    /** API key string, if not provided will read from environment variable specified by `apiKeyEnvVar` */
    apiKey?: string;
    /**
     * The {@link Fetcher} used to send requests, defaults to `globalThis.fetch`.
     *
     * When a custom fetch is given and no API key can be found, requests are sent without
     * an `Authorization` header, so the custom fetch can add its own (eg an OAuth token).
     */
    fetch?: Fetcher;
}

/**
 * Types that can be converted into a resolved {@link FetchConfig}.
 *
 * Options include:
 * - An API key string
 * - `undefined`, which will use environment variable `AIRTABLE_API_KEY` and default base URL
 * - A {@link Fetcher}, eg a wrapped `fetch`
 * - An object matching {@link FetchConfig}
 */
export type IntoFetcher = Fetcher | string | FetchConfig | undefined;

/**
 * Arguments for performing a request against the Airtable API.
 */
export type FetchArgs = {
    /** e.g. '/app123/tblABC' */
    path: string;
    /** HTTP method, defaults to GET */
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    /** Data to send as the JSON request body */
    data?: unknown;
    /** Configuration for this request, taking precedence over the fetcher's configuration and {@link getDefaultConfig} */
    config?: FetchConfig;
}

/** Default base URL for the Airtable API: "https://api.airtable.com/v0" */
export const DEFAULT_BASE_URL = "https://api.airtable.com/v0";
/** Default environment variable name for the Airtable API key: "AIRTABLE_API_KEY" */
export const DEFAULT_API_KEY_ENV_VAR = "AIRTABLE_API_KEY";

const _defaultConfig: FetchConfig = {
    baseUrl: DEFAULT_BASE_URL,
    apiKeyEnvVar: DEFAULT_API_KEY_ENV_VAR,
};

/**
 * Get the current default {@link FetchConfig}.
 * 
 * This default config is used as a fallback for any fetch operations that don't provide specific configuration.
 * You can update the default config using {@link setDefaultConfig}.
 * 
 * @returns The current default {@link FetchConfig}.
 */
export function getDefaultConfig(): FetchConfig {
    return _defaultConfig;
}

/**
 * Set the default {@link FetchConfig}.
 * 
 * This will be used as a fallback for any fetch operations that don't provide specific configuration.
 * 
 * @param config - The {@link FetchConfig} to set as default.
 */
export function setDefaultConfig(config: FetchConfig): void {
    if (config.baseUrl) {
        _defaultConfig.baseUrl = config.baseUrl;
    }
    if (config.apiKey) {
        _defaultConfig.apiKey = config.apiKey;
    }
    if (config.apiKeyEnvVar) {
        _defaultConfig.apiKeyEnvVar = config.apiKeyEnvVar;
    }
    if (config.fetch) {
        _defaultConfig.fetch = config.fetch;
    }
}

function toFetchConfig(fetcher: IntoFetcher): FetchConfig {
    if (typeof fetcher === "string") {
        return { apiKey: fetcher };
    }
    if (typeof fetcher === "function") {
        return { fetch: fetcher };
    }
    return fetcher ?? {};
}

/**
 * Perform a request against the Airtable API, and parse the JSON response.
 *
 * Configuration is resolved from, in order of precedence:
 * `args.config`, `args.fetcher`, and {@link getDefaultConfig}.
 *
 * @param args - The request arguments, plus an optional {@link IntoFetcher}.
 * @returns A promise that resolves to the parsed JSON response.
 * @throws Error if the response status is not ok.
 */
export async function doFetch<T = unknown>(args: FetchArgs & { fetcher?: IntoFetcher }): Promise<T> {
    const { path, method = "GET", data } = args;
    const perFetchConfig = args.config ?? {};
    const fetcherConfig = toFetchConfig(args.fetcher);
    const defaultConfig = getDefaultConfig();
    const pick = <K extends keyof FetchConfig>(key: K): FetchConfig[K] =>
        perFetchConfig[key] ?? fetcherConfig[key] ?? defaultConfig[key];

    const baseUrl = pick("baseUrl") ?? DEFAULT_BASE_URL;
    const apiKeyEnvVar = pick("apiKeyEnvVar") ?? DEFAULT_API_KEY_ENV_VAR;
    const customFetch = pick("fetch");
    const apiKey = pick("apiKey") ?? readEnvVar(apiKeyEnvVar);
    if (!apiKey && !customFetch) {
        throw new Error(
            `No API key provided. Provide an API key string, or set the ${apiKeyEnvVar} environment variable.`,
        );
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }
    const fetch = customFetch ?? globalThis.fetch;
    const response = await fetch(joinUrl(baseUrl, path), {
        method,
        headers,
        body: JSON.stringify(data),
    });
    const result = await response.json() as T;
    if (!response.ok) {
        throw new Error(
            `Fetch error: ${response.status} ${response.statusText} - ${JSON.stringify(result)}`,
        );
    }
    return result;
}

function joinUrl(base: string, path: string): string {
    base = base.endsWith("/") ? base.slice(0, -1) : base;
    path = path.startsWith("/") ? path.slice(1) : path;
    return `${base}/${path}`;
}

function readEnvVar(name: string): string | undefined {
    return typeof process !== "undefined" ? process.env[name] : undefined;
}

/** A request received by a mock {@link Fetcher}. */
export type MockFetcherCall = {
    url: string;
    method: string;
    /** The parsed JSON body, or undefined if there was none */
    data: unknown;
};

/**
 * Create a mock {@link Fetcher} for testing purposes.
 *
 * Every request receives a 200 response whose JSON body is the value set with `setReturnValue` (default `null`).
 * @returns A Fetcher with additional methods for setting the response body and inspecting call history.
 */
export function createMockFetcher(): Fetcher & {
    setReturnValue: (value: unknown) => void;
    getCallHistory: () => MockFetcherCall[];
    reset: () => void;
} {
    let returnValue: unknown = null;
    let callHistory: MockFetcherCall[] = [];
    const mockFetch: Fetcher = async (url, init) => {
        callHistory.push({
            url,
            method: init.method ?? "GET",
            data: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
        });
        return new Response(JSON.stringify(returnValue));
    };
    return Object.assign(mockFetch, {
        setReturnValue: (value: unknown) => {
            returnValue = value;
        },
        getCallHistory: () => callHistory,
        reset: () => {
            callHistory = [];
        },
    });
}
