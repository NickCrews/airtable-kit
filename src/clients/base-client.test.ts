import { beforeEach, describe, expect, it } from "vitest";
import { testBaseClient } from "../tests/test-utils.ts";

describe("BaseClient", () => {
    const { baseClient, resetBaseData } = testBaseClient();

    beforeEach(async () => {
        await resetBaseData();
    });

    it("can access table clients", () => {
        expect(baseClient.tables.tasks).toBeDefined();
        expect(baseClient.tables.linkedItems).toBeDefined();
        expect(baseClient.tables.allTypes).toBeDefined();
    });

    it("can create records via table clients", async () => {
        const result = await baseClient.tables.tasks.createRecords([
            {
                name: "do laundry",
                dueDate: "1990-01-01",
                tags: ["Urgent", "Important"],
            },
        ]);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            fields: {
                name: "do laundry",
                "Due Date": "1990-01-01",
                Tags: ["Urgent", "Important"],
                Completed: false,
                "Assigned To": [],
                Attachments: [],
                Notes: "",
                Priority: null,
                Status: null,
            },
        });
        expect(result[0].id).toMatch(/^rec/);
        expect(result[0].createdTime).toBeDefined();
    });
});
