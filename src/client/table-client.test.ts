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
    describe("createMany", () => {
        it("can handle 0-record creates", async () => {
            const result = await client.createMany([]);
            expect(result).toEqual([]);
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
                            fldUpdatedAt: "2024-01-02T00:00:00.000Z",
                            fldCreatedAt: "2024-01-01T00:00:00.000Z",
                        },
                    }
                ]
            })
            const response = await client.createMany(
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
            expect(response).toEqual([
                {
                    id: "rec123",
                    fields: {
                        "Assigned To": ["usrMe"],
                        "Attachments": null,
                        "Completed": false,
                        "Created At": new Date("2024-01-01T00:00:00.000Z"),
                        "Due Date": null,
                        "Name": "Fold Laundry",
                        "Notes": null,
                        "Priority": null,
                        "Status": null,
                        "Tags": [],
                        "Updated At": new Date("2024-01-02T00:00:00.000Z"),
                    },
                    createdTime: "2024-01-01T00:00:00.000Z",
                }
            ]);
        });
        it("has typesafety on selects and multiselects", async () => {
            const f = async () =>
                await client.createMany(
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
                            fldUpdatedAt: "2024-01-02T00:00:00.000Z",
                            fldCreatedAt: "2024-01-01T00:00:00.000Z",
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
                            "Assigned To": null,
                            "Attachments": null,
                            "Completed": true,
                            "Created At": new Date("2024-01-01T00:00:00.000Z"),
                            "Due Date": null,
                            "Name": "Fold Laundry",
                            "Notes": null,
                            "Priority": null,
                            "Status": null,
                            "Tags": [],
                            "Updated At": new Date("2024-01-02T00:00:00.000Z"),
                        },
                    }]
                });
        });
    });
    describe("formulaToString", () => {
        it("can convert formula objects to strings", () => {
            const formulaStr = client.formulaToString([
                "AND",
                [">=", { field: "Due Date" }, ["TODAY"]],
                ["<=", { field: "Due Date" }, ["DATEADD", ["TODAY"], 7, "days"]],
                ["=", { field: "Status" }, "In Progress"],
                ["!=", { field: "Name" }, null],
            ]);
            expect(formulaStr).toBe('AND({fldDueDate} >= TODAY(), {fldDueDate} <= DATEADD(TODAY(), 7, "days"), {fldStatus} = "In Progress", {fldName} != BLANK())');
        });
    });
    describe("list", () => {
        it("can list records with filterByFormula as string", async () => {
            mockFetcher.setReturnValue({
                records: [],
            });
            await client.list({
                filterByFormula: '{fldCompleted} = TRUE()',
            });
            expect(mockFetcher.getCallHistory()).toEqual([{
                path: "/app123/tblTasks?returnFieldsByFieldId=true&filterByFormula=%7BfldCompleted%7D+%3D+TRUE%28%29",
                method: "GET",
            }]);
        });
        it("can list records with filterByFormula as Formula object", async () => {
            mockFetcher.setReturnValue({
                records: [],
            });
            await client.list({
                filterByFormula: [
                    "AND",
                    ["=", { field: "Status" }, "Done"],
                    ["=", { field: "Completed" }, true],
                ],
            });
            expect(mockFetcher.getCallHistory()).toEqual([{
                path: "/app123/tblTasks?returnFieldsByFieldId=true&filterByFormula=AND%28%7BfldStatus%7D+%3D+%22Done%22%2C+%7BfldCompleted%7D+%3D+TRUE%28%29%29",
                method: "GET",
            }]);
        });
    });
    describe("get", () => {
        it("can get a record by ID", async () => {
            mockFetcher.setReturnValue({
                id: "rec123",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: {
                    fldName: "Fold Laundry",
                    fldCompleted: false,
                    fldCreatedAt: "2024-01-01T00:00:00.000Z",
                    fldUpdatedAt: "2024-01-02T00:00:00.000Z",
                },
            });
            const record = await client.get("rec123");
            expect(mockFetcher.getCallHistory()).toEqual([{
                path: "/app123/tblTasks/rec123?returnFieldsByFieldId=true",
                method: "GET",
            }]);
            expect(record).toEqual({
                id: "rec123",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: {
                    "Assigned To": null,
                    "Attachments": null,
                    "Completed": false,
                    "Created At": new Date("2024-01-01T00:00:00.000Z"),
                    "Due Date": null,
                    "Name": "Fold Laundry",
                    "Notes": null,
                    "Priority": null,
                    "Status": null,
                    "Tags": [],
                    "Updated At": new Date("2024-01-02T00:00:00.000Z"),
                },
            });
        });
        it("fills in any fields omitted by the Airtable API with a default value", async () => {
            mockFetcher.setReturnValue({
                id: "rec123",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: {
                    fldName: "Fold Laundry",
                    fldUpdatedAt: "2024-01-02T00:00:00.000Z",
                    fldCreatedAt: "2024-01-01T00:00:00.000Z",
                },
            });
            const record = await client.get("rec123");
            expect(mockFetcher.getCallHistory()).toEqual([{
                path: "/app123/tblTasks/rec123?returnFieldsByFieldId=true",
                method: "GET",
            }]);
            expect(record).toEqual({
                id: "rec123",
                createdTime: "2024-01-01T00:00:00.000Z",
                fields: {
                    "Assigned To": null,
                    "Attachments": null,
                    "Completed": null,
                    "Created At": new Date("2024-01-01T00:00:00.000Z"),
                    "Due Date": null,
                    "Name": "Fold Laundry",
                    "Notes": null,
                    "Priority": null,
                    "Status": null,
                    "Tags": [],
                    "Updated At": new Date("2024-01-02T00:00:00.000Z"),
                },
            });
        });
    });
});