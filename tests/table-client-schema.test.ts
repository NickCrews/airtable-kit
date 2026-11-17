import { describe, expect, expectTypeOf, it } from "vitest";
import { createMockFetch } from "airtable-kit";
import { createTableClient } from "airtable-kit/typed";
import { CHECKBOX, SINGLE_LINE_TEXT } from "./_example-fields.ts";

describe("createTableClient with a hand-written schema", () => {
    it("needs only the table ID and the fields", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({
            records: [{ id: "rec1", createdTime: "2024-01-01T00:00:00.000Z", fields: { [SINGLE_LINE_TEXT.id]: "hello" } }],
        });
        const client = createTableClient("appTest", { id: "tblTest", fields: [SINGLE_LINE_TEXT, CHECKBOX] } as const, { fetch });

        const records = await client.listRecords();
        expect(records[0].fields).toEqual({ [SINGLE_LINE_TEXT.name]: "hello", [CHECKBOX.name]: false });
        expectTypeOf(records[0].fields[CHECKBOX.name]).toEqualTypeOf<boolean>();
        expect(fetch.getCallHistory()[0].url).toContain("/appTest/tblTest?");
    });
});
