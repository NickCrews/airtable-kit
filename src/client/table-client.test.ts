import { beforeEach, describe, expect, it } from "vitest";
import { createMockFetcher } from "./fetcher.ts";
import { makeTableClient } from "./table-client.ts";

import TaskBaseSchema from "../tests/taskBase.ts";
import { afterEach } from "node:test";

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
    afterEach(() => {
        mockFetcher.reset();
    });
    describe("create", () => {
        it("can handle 0-record creates", async () => {
            const result = await client.create([]);
            expect(result).toEqual({ records: [] });
            expect(mockFetcher.getCallHistory()).toEqual([]);
        });
        it("can create records", async () => {
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
                    "Assigned To": ["rec123abc"],
                    fldCompleted: false,
                    Notes: undefined, // should be ignored
                    Status: null, // should be ignored
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
                                fldAssignedTo: ["rec123abc"],
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
    describe("update", () => {
        it("can handle 0-record updates", async () => {
            const result = await client.update([]);
            expect(result).toEqual({ records: [] });
            expect(mockFetcher.getCallHistory()).toEqual([]);
        });
        it("can update records", async () => {
            mockFetcher.setReturnValue({
                records: [
                    {
                        id: "rec123",
                        createdTime: "2024-01-01T00:00:00.000Z",
                        fields: {
                            fldName: "Fold Laundry",
                            fldCompleted: true,
                        },
                    }
                ]
            });
            const result = await client.update(
                [
                    {
                        id: "rec123",
                        fields: {
                            Name: "Fold Laundry",
                            fldCompleted: true,
                            Notes: undefined, // should be ignored
                            "Due Date": null, // should be cleared
                        },
                    },
                ],
            );
            expect(mockFetcher.getCallHistory()).toEqual([{
                path: "/app123/tblTasks",
                method: "PATCH",
                data: {
                    records: [
                        {
                            id: "rec123",
                            fields: {
                                fldName: "Fold Laundry",
                                fldCompleted: true,
                                fldDueDate: null,
                            },
                        },
                    ],
                    returnFieldsByFieldId: true,
                },
            }]);
            expect(result).toEqual(
                {
                    createdRecords: undefined,
                    updatedRecords: undefined,
                    details: undefined,
                    records: [{
                        id: "rec123",
                        createdTime: "2024-01-01T00:00:00.000Z",
                        fields: {
                            Name: "Fold Laundry",
                            Completed: true,
                        },
                    }]
                });
        });
    });
});