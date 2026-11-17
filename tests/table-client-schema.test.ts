import { describe, expect, expectTypeOf, it } from "vitest";
import { createMockFetch } from "airtable-kit";
import { createTableClient } from "airtable-kit/typed";

const tableSchema = {
    id: "tblTest",
    fields: [
        { id: "fldName", name: "name", type: "singleLineText" },
        { id: "fldDone", name: "done", type: "checkbox" },
        { id: "fldDue", name: "dueDate", type: "date" },
        {
            id: "fldStatus", name: "status", type: "singleSelect",
            options: { choices: [{ id: "selTodo", name: "Todo" }, { id: "selDone", name: "Done" }] },
        },
    ],
} as const;

describe("createTableClient with a hand-written schema", () => {
    it("needs only the table ID, and each field's id, name, type, and the options its values depend on", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({
            records: [{ id: "rec1", createdTime: "2024-01-01T00:00:00.000Z", fields: { fldName: "hello", fldStatus: "Done" } }],
        });
        const client = createTableClient("appTest", tableSchema, { fetch });

        const records = await client.listRecords();
        expect(records[0].fields).toEqual({ name: "hello", done: false, dueDate: null, status: "Done" });
        expectTypeOf(records[0].fields).toEqualTypeOf<{
            name: string;
            done: boolean;
            dueDate: string | null;
            status: "Todo" | "Done" | null;
        }>();
        expect(fetch.getCallHistory()[0].url).toContain("/appTest/tblTest?");

        await client.updateRecords([{ id: "rec1", fields: { dueDate: new Date("2024-12-31"), status: "Todo" } }]);
        expect(fetch.getCallHistory()[1].data).toMatchObject({
            records: [{ id: "rec1", fields: { fldDue: "2024-12-31", fldStatus: "selTodo" } }],
        });
    });
});
