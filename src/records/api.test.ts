import { beforeEach, describe, expect, it } from "vitest";
import * as api from "./api.ts";
import dotenv from "dotenv";
// @ts-ignore
import testBaseSchema from "../tests/test-base-schema.generated.ts";

dotenv.config();

describe("Records API", () => {
    const tasksTable = testBaseSchema.tables.find((t) => t.name === "tasks")!;
    const linkedItemsTable = testBaseSchema.tables.find((t) => t.name === "linkedItems")!;

    const getApiKey = () => process.env.AIRTABLE_KIT_TEST_API_KEY || process.env.AIRTABLE_API_KEY;

    beforeEach(async () => {
        const allRecords = await api.listRecords({
            baseId: testBaseSchema.id,
            tableId: tasksTable.id,
            fields: tasksTable.fields,
            fetcher: getApiKey(),
        });

        if (allRecords.length > 0) {
            const recordIds = allRecords.map((r) => r.id);
            for (let i = 0; i < recordIds.length; i += 10) {
                const batch = recordIds.slice(i, i + 10);
                await api.deleteRecordsRaw({
                    recordIds: batch,
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                    fetcher: getApiKey(),
                });
            }
        }
    });

    describe("createRecords", () => {
        it("can create a single record", async () => {
            const result = await api.createRecords({
                records: [
                    {
                        name: "Single Task",
                        status: "Todo",
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                fields: {
                    name: "Single Task",
                    status: "Todo",
                },
            });
            expect(result[0].id).toMatch(/^rec/);
            expect(result[0].createdTime).toBeDefined();
        });

        it("can create multiple records in batches", async () => {
            const records = Array.from({ length: 25 }, (_, i) => ({
                name: `Task ${i + 1}`,
                status: i % 2 === 0 ? "Todo" : "In Progress" as any,
            }));

            const result = await api.createRecords({
                records,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toHaveLength(25);
            result.forEach((record) => {
                expect(record.id).toMatch(/^rec/);
                expect(record.createdTime).toBeDefined();
                expect(record.fields.name).toMatch(/^Task \d+$/);
            });
        });

        it("can handle empty record list", async () => {
            const result = await api.createRecords({
                records: [],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toEqual([]);
        });

        it("removes undefined and null fields before sending", async () => {
            const result = await api.createRecords({
                records: [
                    {
                        name: "Test Task",
                        status: undefined,
                        notes: null,
                        completed: false,
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result[0].fields).toMatchObject({
                name: "Test Task",
                completed: false,
            });
        });
    });

    describe("createRecordsRaw", () => {
        it("can create a single record without batching", async () => {
            const result = await api.createRecordsRaw({
                records: [
                    {
                        name: "Raw Create Task",
                        priority: 2,
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toHaveLength(1);
            expect(result[0].fields.name).toBe("Raw Create Task");
        });

        it("rejects more than 10 records", async () => {
            const records = Array.from({ length: 11 }, (_, i) => ({
                name: `Task ${i}`,
            })) as any;

            // The API itself rejects >10 records, not our wrapper
            await expect(
                api.createRecordsRaw({
                    records: records,
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                    fields: tasksTable.fields,
                    fetcher: getApiKey(),
                })
            ).rejects.toThrow();
        });

        it("handles empty list", async () => {
            const result = await api.createRecordsRaw({
                records: [],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toEqual([]);
        });
    });

    describe("listRecords", () => {
        it("can list all records", async () => {
            // Create some records
            await api.createRecords({
                records: [
                    { name: "Task 1", completed: true },
                    { name: "Task 2", completed: false },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.listRecords({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            // The test table may be empty, so just verify the call works
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty("id");
            expect(result[0]).toHaveProperty("fields");
            expect(result[0]).toHaveProperty("createdTime");
            expect(result[0]).toHaveProperty("commentCount");
        });

        it("can filter records by formula string", async () => {
            await api.createRecords({
                records: [
                    { name: "Done Task", status: "Done", completed: true },
                    { name: "Todo Task", status: "Todo", completed: false },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const completedFieldId = tasksTable.fields.find((f) => f.name === "completed")?.id;
            const result = await api.listRecords({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    filterByFormula: `{${completedFieldId}} = TRUE()`,
                },
            });

            expect(Array.isArray(result)).toBe(true);
            expect(result.every((r) => r.fields.completed === true)).toBe(true);
        });

        it("can sort records", async () => {
            await api.createRecords({
                records: [
                    { name: "Task C", priority: 3 },
                    { name: "Task A", priority: 1 },
                    { name: "Task B", priority: 2 },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.listRecords({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    sort: [{ field: "priority", direction: "asc" }],
                },
            });

            expect(result.length).toBeGreaterThan(2);
        });

        it("can limit max records", async () => {
            const result = await api.listRecords({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    maxRecords: 2,
                },
            });

            expect(result.length).toBeLessThanOrEqual(2);
        });

        it("can select specific fields", async () => {
            const result = await api.listRecords({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    fields: ["name", "status"],
                    maxRecords: 1,
                },
            });

            expect(Array.isArray(result)).toBe(true);
        });

        it("handles pagination automatically", async () => {
            const records = Array.from({ length: 35 }, (_, i) => ({
                name: `Task ${i + 1}`,
            }));

            await api.createRecords({
                records,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.listRecords({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result.length).toBeGreaterThanOrEqual(35);
        });
    });

    describe("listRecordsRaw", () => {
        it("can list records with page size", async () => {
            const result = await api.listRecordsRaw({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    pageSize: 5,
                },
            });

            expect(result.records.length).toBeLessThanOrEqual(5);
            expect(result).toHaveProperty("offset");
        });

        it("throws error on invalid filter formula", async () => {
            await expect(
                api.listRecordsRaw({
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                    fields: tasksTable.fields,
                    fetcher: getApiKey(),
                    options: {
                        filterByFormula: "{invalidfield} = TRUE()",
                    },
                })
            ).rejects.toThrow();
        });

        it("includes commentCount in response", async () => {
            const result = await api.listRecordsRaw({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    maxRecords: 1,
                },
            });

            expect(result.records).toBeDefined();
            if (result.records && result.records.length > 0) {
                expect(result.records[0]).toHaveProperty("commentCount");
            }
        });

        it("can include recordMetadata", async () => {
            const result = await api.listRecordsRaw({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    recordMetadata: ["commentCount"],
                    maxRecords: 1,
                },
            });

            expect(result.records).toBeDefined();
            if (result.records && result.records.length > 0) {
                expect(result.records[0]).toHaveProperty("commentCount");
            }
        });

        it("resolves field names to IDs", async () => {
            const result = await api.listRecordsRaw({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    sort: [{ field: "name", direction: "asc" }],
                    maxRecords: 1,
                },
            });

            expect(result.records).toBeDefined();
        });

        it("throws error when field not found", async () => {
            await expect(
                api.listRecordsRaw({
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                    fields: tasksTable.fields,
                    fetcher: getApiKey(),
                    options: {
                        sort: [{ field: "nonexistentfield" as any, direction: "asc" }],
                    },
                })
            ).rejects.toThrow("Field \"nonexistentfield\" not found in table schema");
        });
    });

    describe("getRecord", () => {
        it("can get a single record by ID", async () => {
            const [created] = await api.createRecords({
                records: [{ name: "Get Test Task" }],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.getRecord({
                recordId: created.id,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toMatchObject({
                id: created.id,
                fields: {
                    name: "Get Test Task",
                },
            });
            expect(result.createdTime).toBeDefined();
        });

        it("returns all fields with default values", async () => {
            const [created] = await api.createRecords({
                records: [{ name: "Minimal Task" }],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.getRecord({
                recordId: created.id,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result.fields).toHaveProperty("name");
            expect(result.fields).toHaveProperty("status");
            expect(result.fields).toHaveProperty("completed");
            expect(result.fields).toHaveProperty("priority");
        });

        it("can use string cell format", async () => {
            const [created] = await api.createRecords({
                records: [
                    {
                        name: "Date Task",
                        dueDate: "2025-12-25",
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.getRecord({
                recordId: created.id,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result.fields).toBeDefined();
        });
    });

    describe("updateRecords", () => {
        it("can update a single record", async () => {
            const [created] = await api.createRecords({
                records: [{ name: "Original Name" }],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.updateRecords({
                records: [
                    {
                        id: created.id,
                        fields: {
                            name: "Updated Name",
                            completed: true,
                        },
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).toMatchObject({
                id: created.id,
                fields: {
                    name: "Updated Name",
                    completed: true,
                },
            });
        });

        it("can update multiple records in batches", async () => {
            const created = await api.createRecords({
                records: Array.from({ length: 25 }, (_, i) => ({
                    name: `Task ${i}`,
                })),
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.updateRecords({
                records: created.map((r) => ({
                    id: r.id,
                    fields: {
                        completed: true,
                    },
                })),
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result.records).toHaveLength(25);
            expect(result.records.every((r) => r.fields.completed === true)).toBe(true);
        });

        it("can use non-destructive update (PATCH)", async () => {
            const [created] = await api.createRecords({
                records: [
                    {
                        name: "Original Task",
                        status: "Todo",
                        priority: 1,
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.updateRecords({
                records: [
                    {
                        id: created.id,
                        fields: {
                            name: "Updated Name",
                        },
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    destructive: false,
                },
            });

            const retrieved = await api.getRecord({
                recordId: created.id,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(retrieved.fields.name).toBe("Updated Name");
            expect(retrieved.fields.status).toBe("Todo");
            expect(retrieved.fields.priority).toBe(1);
        });

        it("can use destructive update (PUT)", async () => {
            const [created] = await api.createRecords({
                records: [
                    {
                        name: "Original Task",
                        status: "Todo",
                        priority: 1,
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            await api.updateRecords({
                records: [
                    {
                        id: created.id,
                        fields: {
                            name: "Updated Name",
                        },
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    destructive: true,
                },
            });

            const retrieved = await api.getRecord({
                recordId: created.id,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(retrieved.fields.name).toBe("Updated Name");
            expect(retrieved.fields.status).toBeNull();
            expect(retrieved.fields.priority).toBeNull();
        });

        it("can enable typecast", async () => {
            const [created] = await api.createRecords({
                records: [{ name: "Typecast Task" }],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.updateRecords({
                records: [
                    {
                        id: created.id,
                        fields: {
                            priority: "2" as any,
                        },
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
                options: {
                    typecast: true,
                },
            });

            expect(result.records[0].fields.priority).toBe(2);
        });

        it("handles empty update list", async () => {
            const result = await api.updateRecords({
                records: [],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toEqual({ records: [] });
        });

        it("removes undefined fields but keeps null fields", async () => {
            const [created] = await api.createRecords({
                records: [
                    {
                        name: "Test Task",
                        status: "Todo",
                        priority: 1,
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            await api.updateRecords({
                records: [
                    {
                        id: created.id,
                        fields: {
                            name: "Updated",
                            status: undefined,
                            priority: null,
                        },
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const retrieved = await api.getRecord({
                recordId: created.id,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(retrieved.fields.name).toBe("Updated");
            expect(retrieved.fields.status).toBe("Todo");
        });
    });

    describe("updateRaw", () => {
        it("can update a single record", async () => {
            const [created] = await api.createRecords({
                records: [{ name: "Raw Update Task" }],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.updateRaw({
                records: [
                    {
                        id: created.id,
                        fields: {
                            name: "Updated via Raw",
                            completed: true,
                        },
                    },
                ],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result.records).toHaveLength(1);
            expect(result.records[0].fields.name).toBe("Updated via Raw");
        });

        it("rejects more than 10 records", async () => {
            const records = Array.from({ length: 11 }, (_, i) => ({
                id: `rec${i}`,
                fields: { name: `Task ${i}` },
            }));

            await expect(
                api.updateRaw({
                    records,
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                    fields: tasksTable.fields,
                    fetcher: getApiKey(),
                })
            ).rejects.toThrow("Can only update up to 10 records at a time");
        });

        it("handles empty record list", async () => {
            const result = await api.updateRaw({
                records: [],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            expect(result).toEqual({ records: [] });
        });
    });

    describe("deleteRecords", () => {
        it("can delete a single record", async () => {
            const [created] = await api.createRecords({
                records: [{ name: "Delete Me" }],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.deleteRecords({
                recordIds: [created.id],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
            });

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).toEqual({
                id: created.id,
                deleted: true,
            });
        });

        it("can delete multiple records in batches", async () => {
            const created = await api.createRecords({
                records: Array.from({ length: 25 }, (_, i) => ({
                    name: `Delete Task ${i}`,
                })),
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const recordIds = created.map((r) => r.id);

            const result = await api.deleteRecords({
                recordIds,
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
            });

            expect(result.records).toHaveLength(25);
            expect(result.records.every((r) => r.deleted === true)).toBe(true);
        });

        it("handles empty record list", async () => {
            const result = await api.deleteRecords({
                recordIds: [],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
            });

            expect(result).toEqual({ records: [] });
        });
    });

    describe("deleteRecordsRaw", () => {
        it("can delete a single record", async () => {
            const [created] = await api.createRecords({
                records: [{ name: "Raw Delete Task" }],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                fields: tasksTable.fields,
                fetcher: getApiKey(),
            });

            const result = await api.deleteRecordsRaw({
                recordIds: [created.id],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
            });

            expect(result.records[0]).toEqual({
                id: created.id,
                deleted: true,
            });
        });

        it("rejects more than 10 records", async () => {
            const recordIds = Array.from({ length: 11 }, (_, i) => `rec${i}` as any);

            await expect(
                api.deleteRecordsRaw({
                    recordIds,
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                })
            ).rejects.toThrow("Can only delete up to 10 records at a time");
        });

        it("handles empty record list", async () => {
            const result = await api.deleteRecordsRaw({
                recordIds: [],
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
            });

            expect(result).toEqual({ records: [] });
        });
    });

    describe("uploadAttachment", () => {
        const fieldId = tasksTable.fields.find((f) => f.name === "attachments")?.id!;
        for (const attachmentFieldIdOrName of [fieldId, "attachments"]) {
            it(`can upload an attachment to a record with attachmentFieldIdOrName=${attachmentFieldIdOrName}`, async () => {
                const [created] = await api.createRecords({
                    records: [{ name: "Attachment Test" }],
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                    fields: tasksTable.fields,
                    fetcher: getApiKey(),
                });
                const base64File = Buffer.from("test file content").toString("base64");
                const result = await api.uploadAttachment({
                    baseId: testBaseSchema.id,
                    recordId: created.id,
                    attachmentFieldIdOrName,
                    options: {
                        "contentType": "text/plain",
                        "file": base64File,
                        "filename": "test.txt"
                    },
                    fetcher: getApiKey(),
                });
                // Now fetch the record and verify attachment field
                const updatedRecord = await api.getRecord({
                    recordId: created.id,
                    baseId: testBaseSchema.id,
                    tableId: tasksTable.id,
                    fields: tasksTable.fields,
                    fetcher: getApiKey(),
                });

                expect(updatedRecord.fields.attachments).toBeDefined();
                expect(Array.isArray(updatedRecord.fields.attachments)).toBe(true);
                expect(updatedRecord.fields.attachments.length).toBe(1);
                console.log(updatedRecord.fields.attachments[0]);
                expect(updatedRecord.fields.attachments[0].type).toBe("text/plain");
                expect(updatedRecord.fields.attachments[0].filename).toBe("test.txt");
                expect(updatedRecord.fields.attachments[0].url).toBeDefined();
                expect(updatedRecord.fields.attachments[0].id).toBeDefined();
                expect(updatedRecord.fields.attachments[0].size).toBeGreaterThan(0);
            });
        }
    }
    );
});
