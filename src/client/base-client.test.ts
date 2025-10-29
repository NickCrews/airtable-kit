import { beforeEach, describe, expect, it } from "vitest";
import { createMockFetcher } from "./fetcher.js";
import { baseClient } from "./index.js";

import TaskSchema from "../tests/taskBase.js";

describe("BaseClient", () => {
    const mockFetcher = createMockFetcher();
    const client = baseClient({
        baseSchema: TaskSchema,
        fetcher: mockFetcher,
    });
    beforeEach(() => {
        mockFetcher.reset();
    });
    it("can insert records", async () => {
        mockFetcher.setReturnValue({
            records: [
                {
                    id: "rec123",
                    createdTime: "2024-01-01T00:00:00.000Z",
                    fields: {
                        fldName: "do laundry",
                        fldDueDate: "1990-01-01",
                        fldTags: ["selUrgent", "selImportant"],
                    },
                }
            ]
        })
        const result = await client.tables.tasks.create(
            [{
                "Name": "do laundry",
                "fldDueDate": "1990-01-01",
                "Tags": ["Urgent", "Important"]
            }],
        );
        expect(mockFetcher.getCallHistory()).toEqual([{
            path: "/appTaskBase/tblTasks",
            method: "POST",
            data: {
                records: [
                    {
                        fields: {
                            fldName: "do laundry",
                            fldDueDate: "1990-01-01",
                            fldTags: ["selUrgent", "selImportant"],
                        },
                    },
                ],
                returnFieldsByFieldId: true,
            },
        }]);
        expect(result).toEqual([{
            id: "rec123",
            Name: "do laundry",
            "Due Date": "1990-01-01",
            Tags: ["selUrgent", "selImportant"],
        }]);
    });
});
