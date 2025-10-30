import { beforeEach, describe, expect, it } from "vitest";
import { createMockFetcher } from "./fetcher.ts";
import { makeTableClient } from "./table-client.ts";

import TaskBaseSchema from "../tests/taskBase.ts";

const TASK_TABLE_SCHEMA = TaskBaseSchema.tables.find((t) => t.name === "tasks")!;

describe("TableClient", () => {
    const mockFetcher = createMockFetcher();
    const client = makeTableClient({
        baseId: "app123",
        tableSchema: TASK_TABLE_SCHEMA,
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
                        fldName: "Fold Laundry",
                        fldAssignedTo: ["usrMe"],
                        fldCompleted: false,
                    },
                }
            ]
        })
        await client.create(
            [{
                Name: "Fold Laundry",
                "Assigned To": ["usrMe"],
                fldCompleted: false,
            }],
        );
        expect(mockFetcher.getCallHistory()).toEqual([{
            path: "/app123/tblTasks",
            method: "POST",
            data: {
                records: [
                    {
                        fields: {
                            fldName: "Fold Laundry",
                            fldAssignedTo: ["usrMe"],
                            fldCompleted: false,
                        },
                    },
                ],
                returnFieldsByFieldId: true,
            },
        }]);
    });
    it("has typesafety on selects and multiselects", async () => {
        const f = async () =>
            await client.create(
                [
                    {
                        Status: "In Progress",
                    },
                    {
                        Status: "selDone",
                    },
                    {
                        // @ts-expect-error invalid select option
                        Status: "bogus",
                    },
                ],
            );
        await expect(f()).rejects.toThrow();
    });
});
