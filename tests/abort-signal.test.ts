import { describe, expect, it, vi } from "vitest";
import { type Fetcher, createAirtable } from "airtable-kit";
import { createTableClient } from "airtable-kit/typed";
import { makeListTool } from "airtable-kit/mcp";
import { NUMBER } from "./_example-fields.ts";

type Call = { url: string; init: RequestInit };

/** A fetcher that records each request and answers with `respond(url, init, callIndex)`. */
function recordingFetch(respond: (url: string, init: RequestInit, callIndex: number) => unknown = () => ({ records: [] })) {
    const calls: Call[] = [];
    const fetch: Fetcher = async (url, init) => {
        calls.push({ url, init });
        return Response.json(respond(url, init, calls.length - 1));
    };
    return { fetch, calls };
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
    return promise.then(
        () => {
            throw new Error("expected the promise to reject");
        },
        (e: unknown) => e,
    );
}

const tableSchema = {
    id: "tbl1",
    name: "Table",
    primaryFieldId: NUMBER.id,
    fields: [NUMBER],
} as const;

describe("request", () => {
    it("passes the signal to fetch", async () => {
        const { fetch, calls } = recordingFetch();
        const { signal } = new AbortController();
        await createAirtable({ apiKey: "key", fetch }).request({ path: "/app1/tbl1", signal });
        expect(calls).toHaveLength(1);
        expect(calls[0].init.signal).toBe(signal);
    });

    it("does not send a request when the signal is already aborted", async () => {
        const fetchMock = vi.fn(async () => Response.json({}));
        const controller = new AbortController();
        const reason = new Error("stop");
        controller.abort(reason);
        const error = await rejectionOf(
            createAirtable({ apiKey: "key", fetch: fetchMock }).request({ path: "/app1/tbl1", signal: controller.signal }),
        );
        expect(error).toBe(reason);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("API methods pass the signal to every request", () => {
    it("records.list, on every page", async () => {
        const { fetch, calls } = recordingFetch((_url, _init, i) => ({
            records: [],
            ...(i < 2 ? { offset: `page${i + 1}` } : {}),
        }));
        const { signal } = new AbortController();
        await createAirtable({ apiKey: "key", fetch }).records.list({ baseId: "app1", tableId: "tbl1", signal });
        expect(calls).toHaveLength(3);
        expect(calls.every((c) => c.init.signal === signal)).toBe(true);
    });

    it("records.create, on every batch", async () => {
        const { fetch, calls } = recordingFetch((_url, init) => ({
            records: (JSON.parse(init.body as string) as { records: unknown[] }).records.map((_, j) => ({
                id: `rec${j}`,
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: {},
            })),
        }));
        const { signal } = new AbortController();
        const records = Array.from({ length: 30 }, (_, i) => ({ fields: { [NUMBER.name]: i } }));
        await createAirtable({ apiKey: "key", fetch }).records.create({ baseId: "app1", tableId: "tbl1", records, signal });
        expect(calls).toHaveLength(2);
        expect(calls.every((c) => c.init.signal === signal)).toBe(true);
    });

    it("bases.get, on both requests", async () => {
        const { fetch, calls } = recordingFetch((url) =>
            url.includes("/meta/bases/")
                ? { tables: [] }
                : { bases: [{ id: "app1", name: "Base", permissionLevel: "create" }] },
        );
        const { signal } = new AbortController();
        await createAirtable({ apiKey: "key", fetch }).bases.get("app1", { signal });
        expect(calls).toHaveLength(2);
        expect(calls.every((c) => c.init.signal === signal)).toBe(true);
    });
});

describe("typed clients pass the signal from requestOptions", () => {
    it("TableClient.listRecords", async () => {
        const { fetch, calls } = recordingFetch();
        const client = createTableClient("app1", tableSchema, { apiKey: "key", fetch });
        const { signal } = new AbortController();
        await client.listRecords(undefined, { signal });
        expect(calls).toHaveLength(1);
        expect(calls[0].init.signal).toBe(signal);
    });

    it("MCP list tool execute", async () => {
        const { fetch, calls } = recordingFetch();
        const client = createTableClient("app1", tableSchema, { apiKey: "key", fetch });
        const { signal } = new AbortController();
        await makeListTool(client).execute({}, { signal });
        expect(calls).toHaveLength(1);
        expect(calls[0].init.signal).toBe(signal);
    });
});
