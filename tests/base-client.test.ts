import { beforeEach, describe, expect, it } from "vitest";
import { getTestAirtable, prepTestBaseClient } from "../src/tests/test-utils.ts";
import { createBaseClient } from "airtable-kit/typed";

import testBaseSchema from "../src/tests/test-base-schema.generated.ts";
const baseClient = createBaseClient(testBaseSchema, { airtable: getTestAirtable() });
const { resetBaseData } = prepTestBaseClient(baseClient);

describe("BaseClient", () => {
    beforeEach(resetBaseData);

    it("can access table clients", () => {
        expect(baseClient.tables.tasks).toBeDefined();
        expect(baseClient.tables.linkedItems).toBeDefined();
        expect(baseClient.tables.allTypes).toBeDefined();
    });

    it("can create records via table clients", async () => {
        const { records: result } = await baseClient.tables.tasks.createRecords([
            {
                name: "do laundry",
                dueDate: "1990-01-01",
                tags: ["Urgent", "Important"],
            },
        ]);

        expect(result).toHaveLength(1);
        const { id, fields, createdTime } = result[0];
        expect(fields).toEqual({
            name: "do laundry",
            dueDate: "1990-01-01",
            tags: ["Urgent", "Important"],
            completed: false,
            attachments: [],
            notes: "",
            priority: null,
            status: null,
        });
        expect(id).toMatch(/^rec/);
        expect(createdTime).toBeDefined();
    });
});
