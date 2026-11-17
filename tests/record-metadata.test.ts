import { describe, expect, expectTypeOf, it } from "vitest";
import { createMockFetch } from "airtable-kit";
import { createTableClient } from "airtable-kit/typed";
import { SINGLE_LINE_TEXT } from "./_example-fields.ts";

const tableSchema = { id: "tblTest", name: "Test", primaryFieldId: SINGLE_LINE_TEXT.id, fields: [SINGLE_LINE_TEXT] } as const;

function mockTable(commentCount?: number) {
    const fetch = createMockFetch();
    fetch.setReturnValue({
        records: [{
            id: "rec1",
            createdTime: "2024-01-01T00:00:00.000Z",
            fields: { [SINGLE_LINE_TEXT.id]: "hello" },
            ...(commentCount === undefined ? {} : { commentCount }),
        }],
    });
    return { fetch, client: createTableClient("appTest", tableSchema, { fetch }) };
}

describe("recordMetadata", () => {
    it("adds commentCount to the records and their type when requested", async () => {
        const { fetch, client } = mockTable(3);
        const records = await client.listRecords({ recordMetadata: ["commentCount"] });
        expect(records[0].commentCount).toBe(3);
        expectTypeOf(records[0].commentCount).toEqualTypeOf<number>();
        expect(decodeURIComponent(fetch.getCallHistory()[0].url)).toContain("recordMetadata[]=commentCount");
    });

    it("omits commentCount from the records and their type when not requested", async () => {
        const { client } = mockTable(3);
        const records = await client.listRecords();
        expect(records[0]).not.toHaveProperty("commentCount");
        expectTypeOf(records[0]).not.toHaveProperty("commentCount");
        // @ts-expect-error commentCount was not requested
        records[0].commentCount;
    });

    it("narrows listRecordsPage the same way", async () => {
        const { client } = mockTable(0);
        const page = await client.listRecordsPage({ recordMetadata: ["commentCount"], fields: [SINGLE_LINE_TEXT.name] });
        expect(page.records[0].commentCount).toBe(0);
        expectTypeOf(page.records[0].commentCount).toEqualTypeOf<number>();
        expectTypeOf(page.records[0].fields).toEqualTypeOf<{ "Single Line Text Field": string }>();

        const unrequested = await client.listRecordsPage();
        expectTypeOf(unrequested.records[0]).not.toHaveProperty("commentCount");
    });
});
