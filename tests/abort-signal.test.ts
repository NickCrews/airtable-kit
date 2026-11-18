import { describe, expect, it, vi } from "vitest";
import { type Fetcher, createAirtable } from "airtable-kit";
import { createBaseClient, createTableClient } from "airtable-kit/typed";
import { makeListTool } from "airtable-kit/mcp";
import { MULTIPLE_ATTACHMENTS, NUMBER } from "./_example-fields.ts";

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
        await expect(
            createAirtable({ apiKey: "key", fetch: fetchMock }).request({ path: "/app1/tbl1", signal: controller.signal }),
        ).rejects.toBe(reason);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("aborting partway through a multi-request call", () => {
    it("records.list sends no more pages", async () => {
        const controller = new AbortController();
        const reason = new Error("stop");
        const { fetch, calls } = recordingFetch((_url, _init, i) => {
            controller.abort(reason);
            return { records: [], ...(i === 0 ? { offset: "next" } : {}) };
        });
        await expect(
            createAirtable({ apiKey: "key", fetch }).records.list({ baseId: "app1", tableId: "tbl1", signal: controller.signal }),
        ).rejects.toBe(reason);
        expect(calls).toHaveLength(1);
    });

    it("records.delete sends no more batches", async () => {
        const controller = new AbortController();
        const reason = new Error("stop");
        const { fetch, calls } = recordingFetch(() => {
            controller.abort(reason);
            return { records: [] };
        });
        const recordIds = Array.from({ length: 15 }, (_, i) => `rec${i}` as const);
        await expect(
            createAirtable({ apiKey: "key", fetch }).records.delete({ baseId: "app1", tableId: "tbl1", recordIds, signal: controller.signal }),
        ).rejects.toBe(reason);
        expect(calls).toHaveLength(1);
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

    it("bases.get with a BaseSummary", async () => {
        const { fetch, calls } = recordingFetch(() => ({ tables: [] }));
        const { signal } = new AbortController();
        const schema = await createAirtable({ apiKey: "key", fetch }).bases.get(
            { id: "app1", name: "Base", permissionLevel: "create" },
            { signal },
        );
        expect(schema).toEqual({ id: "app1", name: "Base", tables: [] });
        expect(calls).toHaveLength(1);
        expect(calls[0].init.signal).toBe(signal);
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

describe("typed clients pass the signal", () => {
    const CREATED_TIME = "2024-01-01T00:00:00.000Z";
    const schema = {
        id: "tbl1",
        name: "Table",
        primaryFieldId: NUMBER.id,
        fields: [NUMBER, MULTIPLE_ATTACHMENTS],
    } as const;
    const fieldResponse = { id: "fld1", name: "f", type: "number", options: { precision: 0 } };

    /** Answers each request like Airtable would, and records the signal it was sent with. */
    function setup() {
        const { fetch, calls } = recordingFetch((url, init) => {
            const path = new URL(url).pathname;
            const method = init.method ?? "GET";
            if (path.includes("/fields")) return fieldResponse;
            if (path.includes("/meta/")) return { id: "tbl1", name: "t", fields: [] };
            if (path.endsWith("/uploadAttachment")) return { id: "rec1", createdTime: CREATED_TIME, fields: {} };
            if (method === "DELETE") return { records: [{ id: "rec1", deleted: true }] };
            if (method !== "GET") {
                const records = (JSON.parse(init.body as string) as { records: Array<{ id?: string; fields: object }> }).records;
                return { records: records.map((r, i) => ({ id: r.id ?? `rec${i}`, createdTime: CREATED_TIME, fields: r.fields })) };
            }
            if (/\/rec[^/]+$/.test(path)) return { id: "rec1", createdTime: CREATED_TIME, fields: {} };
            return { records: [] };
        });
        const airtable = createAirtable({ apiKey: "key", fetch });
        const table = createTableClient("app1", schema, airtable);
        const base = createBaseClient({ id: "app1", name: "Base", tables: [{ ...schema, description: undefined, views: [] }] } as any, airtable);
        const { signal } = new AbortController();
        return { table, base, calls, signal };
    }

    type Setup = ReturnType<typeof setup>;
    const cases: Array<[string, (s: Setup) => Promise<unknown>]> = [
        ["createField", ({ table, signal }) => table.createField({ name: "n", type: "number", options: { precision: 0 } }, { signal })],
        ["updateField", ({ table, signal }) => table.updateField({ id: NUMBER.id, name: "n" }, { signal })],
        ["TableClient.updateTable", ({ table, signal }) => table.updateTable({ name: "n" }, { signal })],
        ["createRecord", ({ table, signal }) => table.createRecord({ [NUMBER.name]: 1 }, { signal })],
        ["createRecords", ({ table, signal }) => table.createRecords([{ [NUMBER.name]: 1 }], { signal })],
        ["listRecords", ({ table, signal }) => table.listRecords({ maxRecords: 1, signal })],
        ["listRecordsPage", ({ table, signal }) => table.listRecordsPage({ pageSize: 1, signal })],
        ["getRecord", ({ table, signal }) => table.getRecord("rec1", { cellFormat: "json", signal })],
        ["updateRecords", ({ table, signal }) => table.updateRecords([{ id: "rec1", fields: { [NUMBER.name]: 2 } }], { typecast: true, signal })],
        ["deleteRecords", ({ table, signal }) => table.deleteRecords(["rec1"], { signal })],
        ["uploadAttachment", ({ table, signal }) =>
            table.uploadAttachment("rec1", MULTIPLE_ATTACHMENTS.name, { contentType: "text/plain", file: "eA==", filename: "x.txt", signal })],
        ["BaseClient.createTable", ({ base, signal }) => base.createTable({ name: "t", fields: [] } as any, { signal })],
        ["BaseClient.updateTable", ({ base, signal }) => base.updateTable({ id: "tbl1", name: "n" }, { signal })],
        ["MCP list tool execute", ({ table, signal }) => makeListTool(table).execute({}, { signal })],
    ];

    it.each(cases)("%s", async (_name, call) => {
        const s = setup();
        await call(s);
        expect(s.calls).toHaveLength(1);
        expect(s.calls[0].init.signal).toBe(s.signal);
    });

    it("updateRecords still sends its options alongside the signal", async () => {
        const s = setup();
        await s.table.updateRecords([{ id: "rec1", fields: { [NUMBER.name]: 2 } }], { destructive: true, typecast: true, signal: s.signal });
        expect(s.calls[0].init.method).toBe("PUT");
        expect(JSON.parse(s.calls[0].init.body as string)).toMatchObject({ typecast: true });
    });
});
