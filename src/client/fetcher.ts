import process from "node:process";

type FetchArgs = {
    path: string;
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    data?: unknown;
}

export type Fetcher = {
    fetch: <T = unknown>(args: FetchArgs) => Promise<T>;
};

export type FetcherArgs = {
    apiKey?: string;
    baseUrl?: string;
};

/**
 * Types that can be converted into a {@link Fetcher} instance.
 * 
 * Options include:
 * - An already constructed {@link Fetcher}
 * - An API key string
 * - An object matching {@link FetcherArgs}
 * - `undefined`, which will use environment variable `AIRTABLE_API_KEY` and default base URL
 */
export type IntoFetcher = Fetcher | string | FetcherArgs | undefined;

/**
 * Create a Fetcher from various input types.
 * 
 * @param args - The input to create a Fetcher from.
 * @returns A Fetcher instance.
 */
export function createFetcher(args?: IntoFetcher): Fetcher {
    if (typeof args === "string") {
        return createFetcher({ apiKey: args });
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
            const response = await fetch(`${baseUrl}/${path}`, {
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
