/**
 * Requests a TableClient sends, and how it shapes the responses, checked against a mock fetch.
 */

import { describe, expect, it } from "vitest";
import { createAirtable, createMockFetch } from "airtable-kit";
import { ListResultConsumedError } from "airtable-kit/exceptions";
import { createBaseClient, createTableClient } from "airtable-kit/typed";
import { makeDeleteTool, makeGetTool, makeUpdateTool } from "airtable-kit/mcp";
import { MULTIPLE_ATTACHMENTS, NUMBER, SINGLE_LINE_TEXT } from "./_example-fields.ts";

const fields = [SINGLE_LINE_TEXT, NUMBER, MULTIPLE_ATTACHMENTS] as const;
const tableSchema = { id: "tblTest", name: "Test", primaryFieldId: SINGLE_LINE_TEXT.id, fields } as const;
const CREATED_TIME = "2024-01-01T00:00:00.000Z";

function mockTable() {
    const fetch = createMockFetch();
    const client = createTableClient({ baseId: "appTest", schema: tableSchema, airtable: { apiKey: "patX", fetch } });
    return { fetch, client };
}

const record = (id: string, values: Record<string, unknown> = {}) => ({ id, createdTime: CREATED_TIME, fields: values });

describe("createBaseClient", () => {
    it("exposes the schema and passes options to every table", () => {
        const airtable = createAirtable({ apiKey: "patX", fetch: createMockFetch() });
        const schema = { id: "appTest", name: "Base", tables: [tableSchema] } as const;
        const base = createBaseClient({ schema, airtable });
        expect(base.schema).toBe(schema);
        expect(base.tables.Test.schema).toBe(tableSchema);
        expect(base.tables.Test.baseId).toBe("appTest");
        expect(base.tables.Test.airtable).toBe(airtable);
    });
});

describe("TableClient.createRecords", () => {
    it("sends typecast", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [record("rec1", { [NUMBER.id]: 1 })] });
        await client.createRecords({ records: [{ [NUMBER.name]: 1 }], typecast: true });
        await client.createRecord({ record: { [NUMBER.name]: 1 }, typecast: true });
        for (const call of fetch.getCallHistory()) {
            expect(call.data).toMatchObject({ typecast: true });
        }
    });
});

describe("TableClient.updateRecords", () => {
    it("sends field IDs in fieldsToMergeOn", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [record("rec1")], createdRecords: ["rec1"] });
        await client.updateRecords(
            {
            records: [{ fields: { [SINGLE_LINE_TEXT.name]: "a" } }],
            performUpsert: { fieldsToMergeOn: [SINGLE_LINE_TEXT.name, NUMBER.id] },
        }
        );
        expect(fetch.getCallHistory()[0].data).toMatchObject({
            performUpsert: { fieldsToMergeOn: [SINGLE_LINE_TEXT.id, NUMBER.id] },
        });
    });

    it("updateRecord returns the record without an operation", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [record("rec1", { [NUMBER.id]: 2 })] });
        const result = await client.updateRecord({ record: { id: "rec1", fields: { [NUMBER.name]: 2 } }, typecast: true });
        expect(result.record.id).toBe("rec1");
        expect(result.record.fields[NUMBER.name]).toBe(2);
        expect(result.record).not.toHaveProperty("operation");
        expect(result.warnings).toEqual([]);
        const call = fetch.getCallHistory()[0];
        expect(call.method).toBe("PATCH");
        expect(call.data).toMatchObject({ records: [{ id: "rec1", fields: { [NUMBER.id]: 2 } }], typecast: true });
    });
});

describe("TableClient.deleteRecords", () => {
    it("returns the deleted IDs", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [{ id: "rec1", deleted: true }, { id: "rec2", deleted: true }] });
        expect(await client.deleteRecords({ recordIds: ["rec1", "rec2"] })).toEqual(["rec1", "rec2"]);
    });

    it("deleteRecord returns the deleted ID", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [{ id: "rec1", deleted: true }] });
        expect(await client.deleteRecord({ recordId: "rec1" })).toBe("rec1");
        expect(fetch.getCallHistory()[0].url).toContain("records%5B%5D=rec1");
    });
});

describe("TableClient.listRecords", () => {
    function pagedTable() {
        const pages = [
            { records: [record("rec1", { [NUMBER.id]: 1 })], offset: "itr1" },
            { records: [record("rec2", { [NUMBER.id]: 2 })] },
        ];
        const urls: string[] = [];
        const airtable = createAirtable({
            apiKey: "patX",
            fetch: async (url) => {
                urls.push(url);
                return new Response(JSON.stringify(pages[(urls.length - 1) % pages.length]));
            },
        });
        const client = createTableClient({ baseId: "appTest", schema: tableSchema, airtable });
        return { client, urls };
    }
    const expected = [record("rec1", { [NUMBER.name]: 1 }), record("rec2", { [NUMBER.name]: 2 })];

    it("fetches nothing until read", async () => {
        const { client, urls } = pagedTable();
        client.listRecords();
        await Promise.resolve();
        expect(urls).toHaveLength(0);
    });

    it("awaits to every page, fetched once however many times it is awaited", async () => {
        const { client, urls } = pagedTable();
        const result = client.listRecords({ fields: [NUMBER.name] });
        expect(await result).toEqual(expected);
        expect(await result).toEqual(expected);
        expect(await Promise.all([result, result.then((r) => r.length)])).toEqual([expected, 2]);
        expect(urls).toHaveLength(2);
    });

    it("throws when iterated twice", async () => {
        const { client } = pagedTable();
        const result = client.listRecords();
        for await (const _ of result) { }
        expect(() => result[Symbol.asyncIterator]()).toThrow(ListResultConsumedError);
    });

    it("throws when iterated after being awaited, and awaited after being iterated", async () => {
        const { client } = pagedTable();
        const awaited = client.listRecords();
        await awaited;
        expect(() => awaited[Symbol.asyncIterator]()).toThrow("already awaited. Call listRecords() again");

        const iterated = client.listRecords();
        iterated[Symbol.asyncIterator]();
        await expect(iterated).rejects.toThrow(ListResultConsumedError);
        await expect(iterated.catch(() => "caught")).resolves.toBe("caught");
    });

    it("fetches pages as the iteration proceeds", async () => {
        const { client, urls } = pagedTable();
        const iterator = client.listRecords({ fields: [NUMBER.name] })[Symbol.asyncIterator]();

        const first = await iterator.next();
        expect(first.value).toEqual(record("rec1", { [NUMBER.name]: 1 }));
        expect(urls).toHaveLength(1);

        const second = await iterator.next();
        expect(second.value).toEqual(record("rec2", { [NUMBER.name]: 2 }));
        expect(urls).toHaveLength(2);
        expect(urls[1]).toContain("offset=itr1");

        expect((await iterator.next()).done).toBe(true);
    });
});

describe("TableClient.uploadAttachment", () => {
    const uploadResponse = { id: "rec1", createdTime: CREATED_TIME, fields: {} };
    const base64 = btoa("hello");
    const field = MULTIPLE_ATTACHMENTS.id;

    /** Run `fn` with the given globals removed, restoring them afterwards. */
    async function withoutGlobals(names: ReadonlyArray<string>, fn: () => Promise<void>) {
        const saved = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
        names.forEach((name) => delete (globalThis as Record<string, unknown>)[name]);
        try {
            await fn();
        } finally {
            names.forEach((name, i) => saved[i] && Object.defineProperty(globalThis, name, saved[i]));
        }
    }

    it("accepts a File, taking its name and type", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue(uploadResponse);
        await client.uploadAttachment({
            recordId: "rec1",
            field: MULTIPLE_ATTACHMENTS.name,
            file: new File(["hello"], "a.txt", { type: "text/plain" }),
        });
        const call = fetch.getCallHistory()[0];
        expect(call.url).toBe(`https://content.airtable.com/v0/appTest/rec1/${MULTIPLE_ATTACHMENTS.id}/uploadAttachment`);
        expect(call.data).toEqual({ contentType: "text/plain", filename: "a.txt", file: base64 });
    });

    it("accepts a Blob with a filename", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue(uploadResponse);
        await client.uploadAttachment({
            recordId: "rec1",
            field,
            file: new Blob(["hello"], { type: "text/plain" }),
            filename: "b.txt",
        });
        expect(fetch.getCallHistory()[0].data).toEqual({ contentType: "text/plain", filename: "b.txt", file: base64 });
    });

    it("accepts bytes and base64 strings", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue(uploadResponse);
        const bytes = new TextEncoder().encode("hello");
        for (const file of [bytes, bytes.buffer, base64]) {
            await client.uploadAttachment({ recordId: "rec1", field, file, filename: "c.txt", contentType: "text/plain" });
        }
        for (const call of fetch.getCallHistory()) {
            expect(call.data).toEqual({ contentType: "text/plain", filename: "c.txt", file: base64 });
        }
    });

    it("works in runtimes without the Blob and File globals", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue(uploadResponse);
        const bytes = new TextEncoder().encode("hello");
        const blobLike = { name: "e.txt", type: "text/plain", arrayBuffer: async () => bytes.buffer };
        await withoutGlobals(["Blob", "File"], async () => {
            await client.uploadAttachment({
                recordId: "rec1",
                field,
                file: bytes,
                filename: "c.txt",
                contentType: "text/plain",
            });
            await client.uploadAttachment({ recordId: "rec1", field, file: blobLike as unknown as Blob });
        });
        expect(fetch.getCallHistory().map((c) => c.data)).toEqual([
            { contentType: "text/plain", filename: "c.txt", file: base64 },
            { contentType: "text/plain", filename: "e.txt", file: base64 },
        ]);
    });

    it("throws without a filename or content type", async () => {
        const { client } = mockTable();
        await expect(client.uploadAttachment({ recordId: "rec1", field, file: new Blob(["hello"], { type: "text/plain" }) }))
            .rejects.toThrow("filename");
        await expect(client.uploadAttachment({ recordId: "rec1", field, file: new Blob(["hello"]), filename: "d.txt" }))
            .rejects.toThrow("contentType");
    });
});

describe("Schema API updates", () => {
    it("send empty strings, to clear a description", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({});
        const airtable = createAirtable({ apiKey: "patX", fetch });
        await airtable.tables.update({ baseId: "appTest", table: { id: "tblTest", description: "" } });
        await airtable.fields.update({ baseId: "appTest", tableId: "tblTest", field: { id: "fldX", description: "" } });
        for (const call of fetch.getCallHistory()) {
            expect(call.data).toEqual({ description: "" });
        }
    });
});

describe("MCP tools", () => {
    it("do not offer returnFieldsByFieldId", () => {
        const { client } = mockTable();
        for (const tool of [makeGetTool(client), makeUpdateTool(client)]) {
            expect(JSON.stringify(tool.inputJsonSchema)).not.toContain("returnFieldsByFieldId");
        }
    });

    it("delete tool returns the deleted IDs", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [{ id: "rec00000000000001", deleted: true }] });
        expect(await makeDeleteTool(client).execute({ recordIds: ["rec00000000000001"] })).toEqual(["rec00000000000001"]);
    });
});

describe("Schema methods", () => {
    it("send named parameters to the schema API", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({});
        const airtable = createAirtable({ apiKey: "patX", fetch });
        const base = createBaseClient({ schema: { id: "appTest", name: "Base", tables: [tableSchema] } as const, airtable });
        const table = base.tables.Test;
        await table.createField({ field: { name: "notes", type: "multilineText" } });
        await table.updateField({ field: { id: NUMBER.id, description: "count" } });
        await table.updateTable({ name: "Renamed" });
        await base.createTable({ table: { name: "New", fields: [{ name: "title", type: "singleLineText" }] } });
        await base.updateTable({ table: { id: "tblTest", description: "about" } });
        expect(fetch.getCallHistory().map(({ method, url, data }) => [method, url.replace("https://api.airtable.com/v0", ""), data])).toEqual([
            ["POST", "/meta/bases/appTest/tables/tblTest/fields", { name: "notes", type: "multilineText" }],
            ["PATCH", `/meta/bases/appTest/tables/tblTest/fields/${NUMBER.id}`, { description: "count" }],
            ["PATCH", "/meta/bases/appTest/tables/tblTest", { name: "Renamed" }],
            ["POST", "/meta/bases/appTest/tables", { name: "New", fields: [{ name: "title", type: "singleLineText" }] }],
            ["PATCH", "/meta/bases/appTest/tables/tblTest", { description: "about" }],
        ]);
    });

    it("formulaToString takes the formula by name", () => {
        const { client } = mockTable();
        expect(client.formulaToString({ formula: [">", { field: NUMBER.name }, 3] })).toBe(`{${NUMBER.id}} > 3`);
    });
});
