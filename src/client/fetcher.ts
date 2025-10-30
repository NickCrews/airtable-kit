import process from "node:process";

export type FetchArgs = {
    /** e.g. '/app123/tblABC' */
    path: string;
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    /** Data to send as the request body */
    data?: unknown;
}

/**
 * A function that performs a fetch operation.
 * @param args - The arguments for the fetch operation.
 * @returns A promise that resolves to the fetched data.
 */
export type FetchFunction = <T = unknown>(args: FetchArgs) => Promise<T>;

/**
 * A Fetcher is an object with a `fetch` matching the {@link FetchFunction} type.
 */
export type Fetcher = {
    fetch: FetchFunction;
};

export type FetcherArgs = {
    apiKey?: string;
    /** Defaults to https://api.airtable.com/v0 */
    baseUrl?: string;
};

/**
 * Types that can be converted into a {@link Fetcher} instance.
 * 
 * Options include:
 * - An API key string
 * - `undefined`, which will use environment variable `AIRTABLE_API_KEY` and default base URL
 * - An already constructed {@link Fetcher}
 * - An object matching {@link FetcherArgs}
 */
export type IntoFetcher = Fetcher | string | FetcherArgs | undefined;

/**
 * Create a {@link Fetcher} from various input types.
 * 
 * @param args - Something of type {@link IntoFetcher}.
 *               The simplest form is to provide just an API key string.
 * @returns A Fetcher instance.
 */
export function makeFetcher(args?: IntoFetcher): Fetcher {
    if (typeof args === "string") {
        return makeFetcher({ apiKey: args });
    }
    if (args && "fetch" in args) {
        return args;
    }
    const baseUrl = args?.baseUrl ?? "https://api.airtable.com/v0";
    let apiKey = args?.apiKey;
    if (!apiKey) {
        apiKey = process.env.AIRTABLE_API_KEY;
    }
    return {
        fetch: async <T = unknown>({ path, method = "GET", data }: FetchArgs) => {
            path = path.startsWith("/") ? path.slice(1) : path;
            const response = await globalThis.fetch(`${baseUrl}/${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            return response.json() as Promise<T>;
        },
    };
}

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
