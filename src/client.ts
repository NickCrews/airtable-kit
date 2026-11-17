import { type ApiKey, type Fetcher, type Requester, DEFAULT_BASE_URL, makeRequester } from "./request.ts";
import { type BasesApi, makeBasesApi } from "./bases/api.ts";
import { type TablesApi, makeTablesApi } from "./tables/api.ts";
import { type FieldsApi, makeFieldsApi } from "./fields/api.ts";
import { type RecordsApi, makeRecordsApi } from "./records/api.ts";

/** Environment variable the API key is read from when none is given: "AIRTABLE_API_KEY" */
export const DEFAULT_API_KEY_ENV_VAR = "AIRTABLE_API_KEY";

/** Options for {@link createAirtable}. */
export interface AirtableOptions {
    /**
     * Airtable API key or OAuth access token, or a function returning one, called before every request.
     *
     * Defaults to the `AIRTABLE_API_KEY` environment variable.
     * If a custom `fetch` is given and no key is found, requests are sent without an
     * `Authorization` header, so the custom fetch can add its own.
     */
    apiKey?: ApiKey;
    /** Base URL for the Airtable API, defaults to https://api.airtable.com/v0 */
    baseUrl?: string;
    /** The {@link Fetcher} used to send requests, defaults to `globalThis.fetch` */
    fetch?: Fetcher;
}

/**
 * A client for the Airtable REST API, created with {@link createAirtable}.
 *
 * Reads and writes raw records: Airtable's JSON, without conversion.
 * For typed records, pass this client to a typed client, eg `createBaseClient` from `airtable-kit/typed`.
 */
export interface Airtable {
    /** Bases: list, get schemas, create */
    bases: BasesApi;
    /** Tables: create, update */
    tables: TablesApi;
    /** Fields: create, update */
    fields: FieldsApi;
    /** Records: list, get, create, update, delete, upload attachments */
    records: RecordsApi;
    /** Send a request to any Airtable API endpoint, using this client's credentials and fetch. */
    request: Requester;
}

/** An {@link Airtable} client, or the {@link AirtableOptions} to create one with. */
export type IntoAirtable = Airtable | AirtableOptions;

/**
 * Create an {@link Airtable} client.
 *
 * ```typescript
 * const airtable = createAirtable(); // reads AIRTABLE_API_KEY
 * const airtable = createAirtable({ apiKey: "patXXX" });
 * const bases = await airtable.bases.list();
 * ```
 *
 * Given an existing {@link Airtable} client, returns it unchanged, so
 * `createAirtable(createAirtable(options))` is the same client as `createAirtable(options)`.
 *
 * @throws Error if no API key is given or found in the environment, and no custom `fetch` is given.
 */
export function createAirtable(options: IntoAirtable = {}): Airtable {
    if (isAirtable(options)) {
        return options;
    }
    const apiKey = options.apiKey ?? readEnvVar(DEFAULT_API_KEY_ENV_VAR);
    if (!apiKey && !options.fetch) {
        throw new Error(
            `No Airtable API key found. Pass \`apiKey\` to createAirtable(), or set the ${DEFAULT_API_KEY_ENV_VAR} environment variable.`,
        );
    }
    const request = makeRequester({
        apiKey,
        baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
        // Look up globalThis.fetch per call, so it is never called as a method of another object,
        // and so replacing it (eg in tests) takes effect.
        fetch: options.fetch ?? ((url, init) => globalThis.fetch(url, init)),
    });
    return {
        bases: makeBasesApi(request),
        tables: makeTablesApi(request),
        fields: makeFieldsApi(request),
        records: makeRecordsApi(request),
        request,
    };
}

function isAirtable(value: IntoAirtable): value is Airtable {
    return typeof (value as Airtable).request === "function";
}

function readEnvVar(name: string): string | undefined {
    return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

/** A request received by a mock fetch from {@link createMockFetch}. */
export type MockFetchCall = {
    url: string;
    method: string;
    /** The parsed JSON body, or undefined if there was none */
    data: unknown;
};

/**
 * Create a mock {@link Fetcher} for testing.
 *
 * Every request receives a 200 response whose JSON body is the value set with `setReturnValue` (default `null`).
 *
 * ```typescript
 * const fetch = createMockFetch();
 * fetch.setReturnValue({ records: [] });
 * const airtable = createAirtable({ fetch });
 * await airtable.records.list({ baseId: "appX", tableId: "tblX" });
 * fetch.getCallHistory(); // [{ url: "https://api.airtable.com/v0/appX/tblX", method: "GET", data: undefined }]
 * ```
 */
export function createMockFetch(): Fetcher & {
    setReturnValue: (value: unknown) => void;
    getCallHistory: () => MockFetchCall[];
    reset: () => void;
} {
    let returnValue: unknown = null;
    let callHistory: MockFetchCall[] = [];
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
