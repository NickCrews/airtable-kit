import console from "node:console";
import process from "node:process";
export type Fetcher = {
    fetch: (args: {
        path: string;
        method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
        data?: unknown;
    }) => Promise<unknown>;
};

export type FetcherArgs = {
    apiKey?: string;
    baseUrl?: string;
};

export type IntoFetcher = Fetcher | string | FetcherArgs | undefined;

export function createRealFetcher(args?: IntoFetcher): Fetcher {
    if (typeof args === "string") {
        return createRealFetcher({ apiKey: args });
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
        fetch: async ({ path, method = "GET", data }) => {
            path = path.startsWith("/") ? path.slice(1) : path;
            const response = await fetch(`${baseUrl}/${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            return response.json();
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
    function mockFetch(
        args: { path: string; method?: string; data?: unknown },
    ): Promise<unknown> {
        console.log(
            "Mock fetch called with args:",
            args,
        );
        callHistory.push(args);
        return Promise.resolve(returnValue);
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
