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
    it("can create records", async () => {
        mockFetcher.setReturnValue({
            records: [
                {
                    id: "rec123",
                    createdTime: "2024-01-01T00:00:00.000Z",
                    fields: {
                        fldName: "do laundry",
                        fldDueDate: "1990-01-01",
                        fldTags: ["selUrgent", "selImportant"],
                        fldCreatedAt: "2024-01-01T00:00:00.000Z",
                        fldUpdatedAt: "2024-01-02T00:00:00.000Z",
                    },
                }
            ]
        })
        const result = await client.tables.tasks.createMany(
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
        expect(result).toMatchObject(
            [
                {
                    "createdTime": "2024-01-01T00:00:00.000Z",
                    "fields": {
                        "Assigned To": null,
                        "Attachments": null,
                        "Completed": null,
                        "Created At": new Date("2024-01-01T00:00:00.000Z"),
                        "Due Date": "1990-01-01",
                        "Name": "do laundry",
                        "Notes": null,
                        "Priority": null,
                        "Status": null,
                        "Tags": [
                            "selUrgent",
                            "selImportant",
                        ],
                        "Updated At": new Date("2024-01-02T00:00:00.000Z"),
                    },
                    "id": "rec123",
                },
            ]
        );
    });
});
