import { describe, expect, it } from "vitest";
import type { Fetcher } from "airtable-kit";
import { createBaseClient, createTableClient } from "airtable-kit/typed";
import { MULTIPLE_ATTACHMENTS, NUMBER } from "./_example-fields.ts";

type Call = { url: string; method: string; body: unknown; signal: AbortSignal | null | undefined };

const CREATED_TIME = "2024-01-01T00:00:00.000Z";

/** A fetcher that records each request and answers like Airtable would for the records endpoints. */
function fakeAirtable() {
    const calls: Call[] = [];
    const fetch: Fetcher = async (url, init) => {
        const method = init.method ?? "GET";
        const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
        calls.push({ url, method, body, signal: init.signal });
        const path = new URL(url).pathname;
        if (path.includes("/meta/")) {
            return Response.json({ id: "tblNew", name: "t", fields: [] });
        }
        if (path.endsWith("/uploadAttachment")) {
            return Response.json({ id: "rec1", createdTime: CREATED_TIME, fields: {} });
        }
        if (method === "DELETE") {
            const ids = new URL(url).searchParams.getAll("records[]");
            return Response.json({ records: ids.map((id) => ({ id, deleted: true })) });
        }
        if (method === "POST" || method === "PATCH" || method === "PUT") {
            const records = (body as { records: Array<{ id?: string; fields: object }> }).records;
            return Response.json({
                records: records.map((r, i) => ({ id: r.id ?? `recNew${i}`, createdTime: CREATED_TIME, fields: r.fields })),
            });
        }
        if (/\/rec[^/]+$/.test(path)) {
            return Response.json({ id: path.split("/").pop(), createdTime: CREATED_TIME, fields: {} });
        }
        return Response.json({ records: [] });
    };
    return { fetch, calls };
}

const tableSchema = {
    id: "tbl1",
    name: "Table",
    primaryFieldId: NUMBER.id,
    fields: [NUMBER, MULTIPLE_ATTACHMENTS],
} as const;

function setup() {
    const { fetch, calls } = fakeAirtable();
    const table = createTableClient("app1", tableSchema, { apiKey: "key", fetch });
    const { signal } = new AbortController();
    return { table, calls, signal, fetch };
}

describe("TableClient methods that take an array also take a params object", () => {
    it("createRecords", async () => {
        const bare = setup();
        await bare.table.createRecords([{ [NUMBER.name]: 1 }]);
        const params = setup();
        const result = await params.table.createRecords({ records: [{ [NUMBER.name]: 1 }], signal: params.signal });
        expect(params.calls.map((c) => c.body)).toEqual(bare.calls.map((c) => c.body));
        expect(params.calls[0].signal).toBe(params.signal);
        expect(result.records[0].fields[NUMBER.name]).toBe(1);
    });

    it("updateRecords", async () => {
        const bare = setup();
        await bare.table.updateRecords([{ id: "rec1", fields: { [NUMBER.name]: 2 } }]);
        expect(bare.calls[0].method).toBe("PATCH");

        const params = setup();
        await params.table.updateRecords({
            records: [{ id: "rec1", fields: { [NUMBER.name]: 2 } }],
            destructive: true,
            typecast: true,
            signal: params.signal,
        });
        expect(params.calls[0]).toMatchObject({
            method: "PUT",
            body: { records: [{ id: "rec1", fields: { [NUMBER.id]: 2 } }], typecast: true },
            signal: params.signal,
        });
    });

    it("deleteRecords", async () => {
        const bare = setup();
        await bare.table.deleteRecords(["rec1", "rec2"]);
        const params = setup();
        const result = await params.table.deleteRecords({ recordIds: ["rec1", "rec2"], signal: params.signal });
        expect(params.calls.map((c) => c.url)).toEqual(bare.calls.map((c) => c.url));
        expect(params.calls[0].signal).toBe(params.signal);
        expect(result.records.map((r) => r.id)).toEqual(["rec1", "rec2"]);
    });
});

describe("TableClient.getRecord takes a record ID or a params object", () => {
    it("with a record ID", async () => {
        const { table, calls } = setup();
        const record = await table.getRecord("rec1");
        expect(record.id).toBe("rec1");
        expect(new URL(calls[0].url).searchParams.get("cellFormat")).toBeNull();
    });

    it("with params", async () => {
        const { table, calls, signal } = setup();
        await table.getRecord({ recordId: "rec1", cellFormat: "string", signal });
        expect(new URL(calls[0].url).pathname).toBe("/v0/app1/tbl1/rec1");
        expect(new URL(calls[0].url).searchParams.get("cellFormat")).toBe("string");
        expect(calls[0].signal).toBe(signal);
    });
});

describe("other typed client methods take a params object with a signal", () => {
    it("TableClient.createRecord", async () => {
        const { table, calls, signal } = setup();
        const { record } = await table.createRecord({ record: { [NUMBER.name]: 3 }, signal });
        expect(record.fields[NUMBER.name]).toBe(3);
        expect(calls[0].signal).toBe(signal);
    });

    it("TableClient.listRecordsPage", async () => {
        const { table, calls, signal } = setup();
        await table.listRecordsPage({ pageSize: 5, signal });
        expect(new URL(calls[0].url).searchParams.get("pageSize")).toBe("5");
        expect(calls[0].signal).toBe(signal);
    });

    it("TableClient.uploadAttachment", async () => {
        const { table, calls, signal } = setup();
        await table.uploadAttachment({
            recordId: "rec1",
            field: MULTIPLE_ATTACHMENTS.name,
            contentType: "text/plain",
            file: "aGk=",
            filename: "hi.txt",
            signal,
        });
        expect(new URL(calls[0].url).pathname).toBe(`/v0/app1/rec1/${MULTIPLE_ATTACHMENTS.id}/uploadAttachment`);
        expect(calls[0].body).toEqual({ contentType: "text/plain", file: "aGk=", filename: "hi.txt" });
        expect(calls[0].signal).toBe(signal);
    });

    it("TableClient.createField, updateField, and updateTable", async () => {
        const { table, calls, signal } = setup();
        await table.createField({ field: { name: "notes", type: "multilineText" }, signal });
        await table.updateField({ field: { id: NUMBER.id, name: "renamed" }, signal });
        await table.updateTable({ table: { description: "d" }, signal });
        expect(calls.map((c) => [c.method, new URL(c.url).pathname, c.body])).toEqual([
            ["POST", "/v0/meta/bases/app1/tables/tbl1/fields", { name: "notes", type: "multilineText" }],
            ["PATCH", `/v0/meta/bases/app1/tables/tbl1/fields/${NUMBER.id}`, { name: "renamed" }],
            ["PATCH", "/v0/meta/bases/app1/tables/tbl1", { description: "d" }],
        ]);
        expect(calls.every((c) => c.signal === signal)).toBe(true);
    });

    it("BaseClient.createTable and updateTable", async () => {
        const { fetch, calls } = fakeAirtable();
        const base = createBaseClient({ id: "app1", name: "Base", tables: [tableSchema] }, { apiKey: "key", fetch });
        const { signal } = new AbortController();
        await base.createTable({ table: { name: "t", fields: [{ name: "n", type: "singleLineText" }] }, signal });
        await base.updateTable({ table: { id: "tbl1", name: "renamed" }, signal });
        expect(calls.map((c) => [c.method, new URL(c.url).pathname])).toEqual([
            ["POST", "/v0/meta/bases/app1/tables"],
            ["PATCH", "/v0/meta/bases/app1/tables/tbl1"],
        ]);
        expect(calls.every((c) => c.signal === signal)).toBe(true);
    });
});
