import { beforeEach, describe, expect, it } from "vitest";
import { createMockFetcher } from "./fetcher.ts";
import { makeBaseClient } from "./index.ts";

import TaskSchema from "../tests/taskBase.ts";

describe("BaseClient", () => {
    const mockFetcher = createMockFetcher();
    const client = makeBaseClient({
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
        expect(result).toEqual(
            {
                records: [{
                    id: "rec123",
                    fields: {
                        Name: "do laundry",
                        "Due Date": "1990-01-01",
                        Tags: ["selUrgent", "selImportant"],
                    },
                    createdTime: "2024-01-01T00:00:00.000Z",
                }]
            });
    });
});
