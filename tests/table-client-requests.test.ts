/**
 * Requests a TableClient sends, and how it shapes the responses, checked against a mock fetch.
 */

import { describe, expect, it } from "vitest";
import { createAirtable, createMockFetch } from "airtable-kit";
import { createBaseClient, createTableClient } from "airtable-kit/typed";
import { makeDeleteTool, makeGetTool, makeUpdateTool } from "airtable-kit/mcp";
import { MULTIPLE_ATTACHMENTS, NUMBER, SINGLE_LINE_TEXT } from "./_example-fields.ts";

const fields = [SINGLE_LINE_TEXT, NUMBER, MULTIPLE_ATTACHMENTS] as const;
const tableSchema = { id: "tblTest", name: "Test", primaryFieldId: SINGLE_LINE_TEXT.id, fields } as const;
const CREATED_TIME = "2024-01-01T00:00:00.000Z";

function mockTable() {
    const fetch = createMockFetch();
    const client = createTableClient(tableSchema, { baseId: "appTest", airtable: { apiKey: "patX", fetch } });
    return { fetch, client };
}

const record = (id: string, values: Record<string, unknown> = {}) => ({ id, createdTime: CREATED_TIME, fields: values });

describe("createBaseClient", () => {
    it("exposes the schema and passes options to every table", () => {
        const airtable = createAirtable({ apiKey: "patX", fetch: createMockFetch() });
        const schema = { id: "appTest", name: "Base", tables: [tableSchema] } as const;
        const base = createBaseClient(schema, { airtable });
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
        await client.createRecords([{ [NUMBER.name]: 1 }], { typecast: true });
        await client.createRecord({ [NUMBER.name]: 1 }, { typecast: true });
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
            [{ fields: { [SINGLE_LINE_TEXT.name]: "a" } }],
            { performUpsert: { fieldsToMergeOn: [SINGLE_LINE_TEXT.name, NUMBER.id] } },
        );
        expect(fetch.getCallHistory()[0].data).toMatchObject({
            performUpsert: { fieldsToMergeOn: [SINGLE_LINE_TEXT.id, NUMBER.id] },
        });
    });

    it("updateRecord returns the record without an operation", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [record("rec1", { [NUMBER.id]: 2 })] });
        const result = await client.updateRecord({ id: "rec1", fields: { [NUMBER.name]: 2 } }, { typecast: true });
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
        expect(await client.deleteRecords(["rec1", "rec2"])).toEqual(["rec1", "rec2"]);
    });

    it("deleteRecord returns the deleted ID", async () => {
        const { fetch, client } = mockTable();
        fetch.setReturnValue({ records: [{ id: "rec1", deleted: true }] });
        expect(await client.deleteRecord("rec1")).toBe("rec1");
        expect(fetch.getCallHistory()[0].url).toContain("records%5B%5D=rec1");
    });
});

describe("TableClient.iterateRecords", () => {
    it("fetches pages as the iteration proceeds", async () => {
        const pages = [
            { records: [record("rec1", { [NUMBER.id]: 1 })], offset: "itr1" },
            { records: [record("rec2", { [NUMBER.id]: 2 })] },
        ];
        const urls: string[] = [];
        const airtable = createAirtable({
            apiKey: "patX",
            fetch: async (url) => {
                urls.push(url);
                return new Response(JSON.stringify(pages[urls.length - 1]));
            },
        });
        const client = createTableClient(tableSchema, { baseId: "appTest", airtable });
        const iterator = client.iterateRecords({ fields: [NUMBER.name] })[Symbol.asyncIterator]();

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
            field: MULTIPLE_ATTACHMENTS.id,
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
            await client.uploadAttachment({
                recordId: "rec1",
                field: MULTIPLE_ATTACHMENTS.id,
                file,
                filename: "c.txt",
                contentType: "text/plain",
            });
        }
        for (const call of fetch.getCallHistory()) {
            expect(call.data).toEqual({ contentType: "text/plain", filename: "c.txt", file: base64 });
        }
    });

    it("throws without a filename or content type", async () => {
        const { client } = mockTable();
        await expect(client.uploadAttachment({
            recordId: "rec1",
            field: MULTIPLE_ATTACHMENTS.id,
            file: new Blob(["hello"], { type: "text/plain" }),
        })).rejects.toThrow("filename");
        await expect(client.uploadAttachment({
            recordId: "rec1",
            field: MULTIPLE_ATTACHMENTS.id,
            file: new Blob(["hello"]),
            filename: "d.txt",
        })).rejects.toThrow("contentType");
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
