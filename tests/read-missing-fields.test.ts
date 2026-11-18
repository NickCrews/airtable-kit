/**
 * Reads should not throw MissingFieldReadError for fields that Airtable legitimately omits.
 * See https://github.com/NickCrews/airtable-kit/issues/13
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import { createMockFetch } from "airtable-kit";
import { convertValuesFromRead } from "airtable-kit/records";
import { createTableClient } from "airtable-kit/typed";
import { AUTO_NUMBER, CREATED_TIME, LAST_MODIFIED_BY, LAST_MODIFIED_TIME, SINGLE_LINE_TEXT } from "./_example-fields.ts";

const fields = [SINGLE_LINE_TEXT, CREATED_TIME, AUTO_NUMBER, LAST_MODIFIED_TIME, LAST_MODIFIED_BY] as const;
const tableSchema = { id: "tblTest", name: "Test", primaryFieldId: SINGLE_LINE_TEXT.id, fields } as const;

function mockTable(responseFields: Record<string, unknown>) {
    const fetch = createMockFetch();
    fetch.setReturnValue({
        records: [{ id: "rec1", createdTime: "2024-01-01T00:00:00.000Z", fields: responseFields }],
    });
    const client = createTableClient("appTest", tableSchema, { airtable: { fetch } });
    return { fetch, client };
}

describe("TableClient.listRecords with a fields subset", () => {
    it("only validates the requested fields, and narrows the type", async () => {
        const { fetch, client } = mockTable({ [SINGLE_LINE_TEXT.id]: "hello" });
        const records = await client.listRecords({ fields: [SINGLE_LINE_TEXT.name] });
        expect(records).toHaveLength(1);
        expect(records[0].fields).toEqual({ [SINGLE_LINE_TEXT.name]: "hello" });
        expectTypeOf(records[0].fields).toEqualTypeOf<{ "Single Line Text Field": string }>();

        const { url } = fetch.getCallHistory()[0];
        expect(decodeURIComponent(url)).toContain(`fields[]=${SINGLE_LINE_TEXT.id}`);

        // Without a fields subset, all fields are in the type
        expectTypeOf<Awaited<ReturnType<typeof client.listRecords>>[number]["fields"]>()
            .toHaveProperty("Created Time Field");
    });

    it("accepts a mix of names and IDs", async () => {
        const { client } = mockTable({ [SINGLE_LINE_TEXT.id]: "hello", [AUTO_NUMBER.id]: 7 });
        const result = await client.listRecordsPage({ fields: [SINGLE_LINE_TEXT.name, AUTO_NUMBER.id] });
        expect(result.records[0].fields).toEqual({
            [SINGLE_LINE_TEXT.name]: "hello",
            [AUTO_NUMBER.name]: 7,
        });
        expectTypeOf(result.records[0].fields).toEqualTypeOf<{
            "Single Line Text Field": string;
            "Auto Number Field": number | null;
        }>();
    });

    it("returns no field values for an empty subset", async () => {
        const { fetch } = mockTable({ [SINGLE_LINE_TEXT.id]: "hello", [AUTO_NUMBER.id]: 7 });
        const client = createTableClient("appTest", tableSchema, { airtable: { fetch }, onReadUnexpectedField: "throw" });
        const records = await client.listRecords({ fields: [] });
        expect(records[0].fields).toEqual({});
    });

    it("passes pageSize and offset to listRecordsPage", async () => {
        const { fetch, client } = mockTable({ [SINGLE_LINE_TEXT.id]: "hello" });
        await client.listRecordsPage({ fields: [SINGLE_LINE_TEXT.name], pageSize: 5, offset: "itr1" });
        const { url } = fetch.getCallHistory()[0];
        expect(url).toContain("pageSize=5");
        expect(url).toContain("offset=itr1");
    });

    it("still validates all fields when no subset is requested", async () => {
        const { client } = mockTable({ [SINGLE_LINE_TEXT.id]: "hello" });
        await expect(client.listRecords()).rejects.toThrow();
    });
});

describe("lastModifiedTime / lastModifiedBy", () => {
    it("are null when Airtable omits them", () => {
        const values = convertValuesFromRead(
            { [CREATED_TIME.id]: "2024-01-01T00:00:00.000Z", [AUTO_NUMBER.id]: 1 } as Record<(typeof fields)[number]["id"], unknown>,
            fields,
        );
        expect(values[LAST_MODIFIED_TIME.name]).toBeNull();
        expect(values[LAST_MODIFIED_BY.name]).toBeNull();
        expectTypeOf(values[LAST_MODIFIED_TIME.name]).toEqualTypeOf<string | null>();
    });
});
