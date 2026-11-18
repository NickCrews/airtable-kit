import { describe, expect } from "vitest";
import { test } from "../src/tests/fixtures.ts";
import { offlineTestBase } from "../src/tests/test-utils.ts";

describe("BaseClient", () => {
    test("can access table clients", () => {
        expect(offlineTestBase.tables.tasks).toBeDefined();
        expect(offlineTestBase.tables.linkedItems).toBeDefined();
        expect(offlineTestBase.tables.allTypes).toBeDefined();
    });

    test("can create records via table clients", async ({ emptyBase }) => {
        const { records: result } = await emptyBase.tables.tasks.createRecords([
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
