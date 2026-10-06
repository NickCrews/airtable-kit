/**
 * Reads should not throw MissingFieldReadError for fields that Airtable legitimately omits.
 * See https://github.com/NickCrews/airtable-kit/issues/13
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import { createMockFetcher } from "airtable-kit/fetcher";
import { listRecords, listRecordsRaw, convertValuesFromRead } from "airtable-kit/records";
import { makeTableClient } from "airtable-kit/tables";
import { AUTO_NUMBER, CREATED_TIME, LAST_MODIFIED_BY, LAST_MODIFIED_TIME, SINGLE_LINE_TEXT } from "./_example-fields.ts";

const fields = [SINGLE_LINE_TEXT, CREATED_TIME, AUTO_NUMBER, LAST_MODIFIED_TIME, LAST_MODIFIED_BY] as const;

describe("listRecords with a fields subset", () => {
    it("only validates the requested fields, and narrows the type", async () => {
        const fetcher = createMockFetcher();
        fetcher.setReturnValue({
            records: [{
                id: "rec1",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: { [SINGLE_LINE_TEXT.id]: "hello" },
            }],
        });
        const records = await listRecords({
            baseId: "appTest",
            tableId: "tblTest",
            fields,
            options: { fields: [SINGLE_LINE_TEXT.name] },
            fetcher,
        });
        expect(records).toHaveLength(1);
        expect(records[0].fields).toEqual({ [SINGLE_LINE_TEXT.name]: "hello" });
        expectTypeOf(records[0].fields).toEqualTypeOf<{ "Single Line Text Field": string }>();

        const path = (fetcher.getCallHistory()[0] as { path: string }).path;
        expect(decodeURIComponent(path)).toContain(`fields[]=${SINGLE_LINE_TEXT.id}`);
    });

    it("accepts a mix of names and IDs", async () => {
        const fetcher = createMockFetcher();
        fetcher.setReturnValue({
            records: [{
                id: "rec1",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: { [SINGLE_LINE_TEXT.id]: "hello", [AUTO_NUMBER.id]: 7 },
            }],
            offset: undefined,
        });
        const result = await listRecordsRaw({
            baseId: "appTest",
            tableId: "tblTest",
            fields,
            options: { fields: [SINGLE_LINE_TEXT.name, AUTO_NUMBER.id] },
            fetcher,
        });
        expect(result.records[0].fields).toEqual({
            [SINGLE_LINE_TEXT.name]: "hello",
            [AUTO_NUMBER.name]: 7,
        });
        expectTypeOf(result.records[0].fields).toEqualTypeOf<{
            "Single Line Text Field": string;
            "Auto Number Field": number | null;
        }>();
    });

    it("still validates all fields when no subset is requested", async () => {
        const fetcher = createMockFetcher();
        fetcher.setReturnValue({
            records: [{
                id: "rec1",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: { [SINGLE_LINE_TEXT.id]: "hello" },
            }],
        });
        await expect(listRecords({
            baseId: "appTest",
            tableId: "tblTest",
            fields,
            fetcher,
        })).rejects.toThrow();
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

describe("TableClient.listRecords with a fields subset", () => {
    it("narrows the type and doesn't throw", async () => {
        const fetcher = createMockFetcher();
        fetcher.setReturnValue({
            records: [{
                id: "rec1",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: { [SINGLE_LINE_TEXT.id]: "hello" },
            }],
        });
        const client = makeTableClient({
            baseId: "appTest",
            tableSchema: { id: "tblTest", name: "Test", primaryFieldId: SINGLE_LINE_TEXT.id, fields },
            fetcher,
        });
        const records = await client.listRecords({ fields: [SINGLE_LINE_TEXT.name] });
        expect(records[0].fields).toEqual({ [SINGLE_LINE_TEXT.name]: "hello" });
        expectTypeOf(records[0].fields).toEqualTypeOf<{ "Single Line Text Field": string }>();

        // Without a fields subset, all fields are in the type
        expectTypeOf<Awaited<ReturnType<typeof client.listRecords>>[number]["fields"]>()
            .toHaveProperty("Created Time Field");
    });
});
