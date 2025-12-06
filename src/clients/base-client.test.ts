import { beforeEach, describe, expect, it } from "vitest";
import { testBaseClient } from "../tests/test-utils.ts";
import dotenv from "dotenv";

dotenv.config();

const hasApiKey = !!(process.env.AIRTABLE_KIT_TEST_API_KEY || process.env.AIRTABLE_API_KEY);

const describeOrSkip = hasApiKey ? describe : describe.skip;

describeOrSkip("BaseClient", () => {
    let baseClient: ReturnType<typeof testBaseClient>['baseClient'];
    let resetBaseData: ReturnType<typeof testBaseClient>['resetBaseData'];

    beforeEach(async () => {
        const client = testBaseClient();
        baseClient = client.baseClient;
        resetBaseData = client.resetBaseData;
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
