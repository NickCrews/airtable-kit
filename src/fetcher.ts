import process from "node:process";

/**
 * Arguments for performing a fetch operation against the Airtable API.
 */
export type FetchArgs = {
    /** e.g. '/app123/tblABC' */
    path: string;
    /** HTTP method, defaults to GET */
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    /** Data to send as the request body */
    data?: unknown;
    /** Optional configuration for this specific fetch operation, such as API key or base URL overrides.
     * 
     * If not provided, the fetcher will use its own configuration or fall back to defaults,
     * eg from {@link getDefaultConfig}
    */
    config?: FetchConfig;
}

const DEFAULT_BASE_URL = "https://api.airtable.com/v0";
const DEFAULT_API_KEY_ENV_VAR = "AIRTABLE_API_KEY";

/**
 * Configuration options for fetching data from the Airtable API.
 */
export type FetchConfig = {
    /** Base URL for the Airtable API, defaults to https://api.airtable.com/v0 */
    baseUrl?: string;
    /** Environment variable name to read the API key from, defaults to AIRTABLE_API_KEY */
    apiKeyEnvVar?: string;
    /** API key string, if not provided will read from environment variable specified by `apiKeyEnvVar` */
    apiKey?: string;
}

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
 * You can update the default config using {@link setDefaultConfig}.
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
}

/**
 * A function that performs a fetch operation.
 * @param args - The arguments for the fetch operation.
 * @returns A promise that resolves to the fetched data.
 */
export type FetchFunction = <T = unknown>(args: FetchArgs) => Promise<T>;

/**
 * A Fetcher is an interface for actually making calls to the Airtable web API.
 *
 * This is provided for injecting custom fetch behavior, and for mocking in tests.
 *
 * This is simply an object with a `fetch` matching the {@link FetchFunction} type.
 */
export type Fetcher = {
    fetch: FetchFunction;
};

/**
 * Types that can be converted into a {@link Fetcher} instance.
 * 
 * Options include:
 * - An API key string
 * - `undefined`, which will use environment variable `AIRTABLE_API_KEY` and default base URL
 * - An already constructed {@link Fetcher}
 * - An object matching {@link FetchConfig}
 */
export type IntoFetcher = Fetcher | string | FetchConfig | undefined;

/**
 * Create a {@link Fetcher} from various input types.
 * 
 * This uses the standard `fetch` API under the hood.
 * 
 * The returned {@link Fetcher} instance will use the provided configuration or defaults for all fetch operations.
 * 
 * @param args - Something of type {@link IntoFetcher}.
 *               The simplest form is to provide just an API key string.
 * @returns A {@link Fetcher} instance that can be used to perform fetch operations.
 */
export function makeFetcher(args?: IntoFetcher): Fetcher {
    if (typeof args === "string") {
        return makeFetcher({ apiKey: args });
    }
    if (args && "fetch" in args) {
        return args;
    }

    // This is used as the defaults for the lifetime of the fetcher.
    const fetcherConfig: FetchConfig = args || {};

    const join = (base: string, path: string) => {
        base = base.endsWith("/") ? base.slice(0, -1) : base;
        path = path.startsWith("/") ? path.slice(1) : path;
        return `${base}/${path}`;
    }
    return {
        fetch: async <T = unknown>({ path, method = "GET", data, config }: FetchArgs) => {
            const perFetchConfig = config || {};
            const defaultConfig = getDefaultConfig();
            const resolvedBaseUrl = perFetchConfig.baseUrl ?? fetcherConfig.baseUrl ?? defaultConfig.baseUrl ?? DEFAULT_BASE_URL;
            const resolvedApiKeyEnvVar = perFetchConfig.apiKeyEnvVar ?? fetcherConfig.apiKeyEnvVar ?? defaultConfig.apiKeyEnvVar ?? DEFAULT_API_KEY_ENV_VAR;
            const resolvedApiKey = ensureApiKey(perFetchConfig.apiKey ?? fetcherConfig.apiKey ?? defaultConfig.apiKey, resolvedApiKeyEnvVar);
            const url = join(resolvedBaseUrl, path);
            // format as a CURL command for easier debugging
            // console.log(`curl -X ${method} '${url}' -H 'Authorization: Bearer ${resolvedApiKey}' -H 'Content-Type: application/json' -d '${JSON.stringify(data)}'`);
            const response = await globalThis.fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${resolvedApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await response.json() as T;
            if (!response.ok) {
                throw new Error(
                    `Fetch error: ${response.status} ${response.statusText} - ${JSON.stringify(result)}`,
                );
            }
            return result;
        },
    };
}

/**
 * Ensure an API key is available, either from the provided value or from an environment variable.
 * @param apiKey - An explicit API key, or undefined to read from environment.
 * @param apiKeyEnvVar - The environment variable name to read the API key from.
 * @returns The resolved API key.
 * @throws Error if no API key can be found.
 */
function ensureApiKey(apiKey: string | undefined, apiKeyEnvVar: string): string {
    if (apiKey) {
        return apiKey;
    }
    apiKey = process.env[apiKeyEnvVar];
    if (!apiKey) {
        throw new Error(
            `No API key provided for Fetcher. Provide an API key string, or set the ${apiKeyEnvVar} environment variable.`,
        );
    }
    return apiKey;
}

/**
 * Create a mock Fetcher for testing purposes.
 * @returns A Fetcher with additional methods for setting return values and inspecting call history.
 */
export function createMockFetcher(): Fetcher & {
    setReturnValue: (value: unknown) => void;
    getCallHistory: () => unknown[];
    reset: () => void;
} {
    let returnValue: unknown = undefined;
    let callHistory: unknown[] = [];
    function mockFetch<T = unknown>(args: FetchArgs) {
        callHistory.push(args);
        return Promise.resolve(returnValue as T);
    }
    return {
        fetch: mockFetch,
        setReturnValue: (value: unknown) => {
            returnValue = value;
        },
        getCallHistory: () => callHistory,
        reset: () => {
            callHistory = [];
        },
    };
}

/**
 * Perform a fetch operation using a Fetcher.
 * @param args - The fetch arguments including an optional fetcher instance.
 * @returns A promise that resolves to the fetched data.
 */
export function doFetch<T = unknown>(args: FetchArgs & { fetcher?: IntoFetcher }): Promise<T> {
    return makeFetcher(args.fetcher).fetch<T>(args);
}
