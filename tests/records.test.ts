import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import { createTableClient } from "airtable-kit/typed";
import testBaseSchema from "../src/tests/test-base-schema.generated.ts";
import { getTestAirtable } from "../src/tests/test-utils.ts";

const airtable = getTestAirtable();

describe("Records API", () => {
    const tasksTable = testBaseSchema.tables.find((t) => t.name === "tasks")!;
    const linkedItemsTable = testBaseSchema.tables.find((t) => t.name === "linkedItems")!;
    const tasks = createTableClient(tasksTable, { baseId: testBaseSchema.id, airtable });
    const linkedItems = createTableClient(linkedItemsTable, { baseId: testBaseSchema.id, airtable });

    beforeEach(async () => {
        const allRecords = await tasks.listRecords();

        if (allRecords.length > 0) {
            await tasks.deleteRecords(allRecords.map((r) => r.id));
        }
    });

    describe("createRecords", () => {
        it("can create a single record", async () => {
            const { records: result } = await tasks.createRecords([
                {
                    name: "Single Task",
                    status: "Todo",
                },
            ]);

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

        it("can create more than 25 records (batches requests to Airtable)", async () => {
            const n = 100;
            const records = Array.from({ length: n }, (_, i) => ({
                name: `Task ${i + 1}`,
                status: i % 2 === 0 ? "Todo" : "In Progress" as any,
            }));

            const { records: result } = await tasks.createRecords(records);

            expect(result).toHaveLength(n);
            result.forEach((record) => {
                expect(record.id).toMatch(/^rec/);
                expect(record.createdTime).toBeDefined();
                expect(record.fields.name).toMatch(/^Task \d+$/);
            });
        });

        it("can handle empty record list", async () => {
            const { records: result } = await tasks.createRecords([]);

            expect(result).toEqual([]);
        });

        it("removes undefined and null fields before sending", async () => {
            const { records: result } = await tasks.createRecords([
                {
                    name: "Test Task",
                    status: undefined,
                    notes: null,
                    completed: false,
                },
            ]);

            expect(result[0].fields).toMatchObject({
                name: "Test Task",
                completed: false,
            });
        });
    });

    describe("airtable.records.list", () => {
        it("returns commentCount only when recordMetadata requests it", async () => {
            await tasks.createRecords([{ name: "Task" }]);
            const withCount = await airtable.records.list({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                recordMetadata: ["commentCount"],
            });
            expect(withCount).toHaveLength(1);
            expect(withCount[0].commentCount).toBe(0);

            const withoutCount = await airtable.records.list({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
            });
            expect(withoutCount).toHaveLength(1);
            expect(withoutCount[0]).not.toHaveProperty("commentCount");
        });
    });

    describe("airtable.records.create", () => {
        it("sends and returns values as Airtable's JSON, keyed by field name", async () => {
            const { records: result } = await airtable.records.create({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                records: [{ fields: { name: "Raw Create Task", priority: 2 } }],
            });

            expect(result).toHaveLength(1);
            expect(result[0].fields.name).toBe("Raw Create Task");
            // Raw records omit empty fields
            expect(result[0].fields).not.toHaveProperty("completed");
        });

        it("handles empty list", async () => {
            const result = await airtable.records.create({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                records: [],
            });

            expect(result).toEqual({ records: [], warnings: [] });
        });
    });

    describe("listRecords", () => {
        it("can list all records", async () => {
            await tasks.createRecords([
                { name: "Task 1", completed: true },
                { name: "Task 2", completed: false },
            ]);

            const result = await tasks.listRecords();

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty("id");
            expect(result[0]).toHaveProperty("fields");
            expect(result[0]).toHaveProperty("createdTime");
            expect(result[0]).not.toHaveProperty("commentCount");
        }, 10_000);

        it("can filter records by formula string", async () => {
            await tasks.createRecords([
                { name: "Done Task", status: "Done", completed: true },
                { name: "Todo Task", status: "Todo", completed: false },
            ]);

            const completedFieldId = tasksTable.fields.find((f) => f.name === "completed")?.id;
            const result = await tasks.listRecords({
                filterByFormula: `{${completedFieldId}} = TRUE()`,
            });

            expect(Array.isArray(result)).toBe(true);
            expect(result.every((r) => r.fields.completed === true)).toBe(true);
        });

        it("can sort records", async () => {
            await tasks.createRecords([
                { name: "Task C", priority: 3 },
                { name: "Task A", priority: 1 },
                { name: "Task B", priority: 2 },
            ]);

            const result = await tasks.listRecords({
                sort: [{ field: "priority", direction: "asc" }],
            });

            expect(result.length).toBeGreaterThan(2);
        });

        it("can limit max records", async () => {
            const result = await tasks.listRecords({
                maxRecords: 2,
            });

            expect(result.length).toBeLessThanOrEqual(2);
        });

        it("can select specific fields", async () => {
            const result = await tasks.listRecords({
                fields: ["name", "status"],
                maxRecords: 1,
            });

            expect(Array.isArray(result)).toBe(true);
        });

        it("handles pagination automatically", async () => {
            const records = Array.from({ length: 35 }, (_, i) => ({
                name: `Task ${i + 1}`,
            }));

            await tasks.createRecords(records);

            const result = await tasks.listRecords();

            expect(result.length).toBeGreaterThanOrEqual(35);
        });
    });

    describe("listRecordsPage", () => {
        it("can list records with page size", async () => {
            const result = await tasks.listRecordsPage({
                pageSize: 5,
            });

            expect(result.records.length).toBeLessThanOrEqual(5);
            expect(result).toHaveProperty("offset");
        });

        it("throws error on invalid filter formula", async () => {
            await expect(
                tasks.listRecordsPage({
                    filterByFormula: "{invalidfield} = TRUE()",
                })
            ).rejects.toThrow();
        });

        it("omits commentCount from the records and their type unless requested", async () => {
            await tasks.createRecords([{ name: "Task" }]);
            const result = await tasks.listRecordsPage({
                maxRecords: 1,
            });

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).not.toHaveProperty("commentCount");
            expectTypeOf(result.records[0]).not.toHaveProperty("commentCount");
            // @ts-expect-error commentCount was not requested
            result.records[0].commentCount;
        });

        it("adds commentCount to the records and their type when requested", async () => {
            await tasks.createRecords([{ name: "Task" }]);
            const result = await tasks.listRecordsPage({
                recordMetadata: ["commentCount"],
                fields: ["name"],
                maxRecords: 1,
            });

            expect(result.records).toHaveLength(1);
            expect(result.records[0].commentCount).toBe(0);
            expectTypeOf(result.records[0].commentCount).toEqualTypeOf<number>();
            expectTypeOf(result.records[0].fields).toEqualTypeOf<{ name: string }>();
        });

        it("resolves field names to IDs", async () => {
            const result = await tasks.listRecordsPage({
                sort: [{ field: "name", direction: "asc" }],
                maxRecords: 1,
            });

            expect(result.records).toBeDefined();
        });

        it("throws error when field not found", async () => {
            await expect(
                tasks.listRecordsPage({
                    sort: [{ field: "nonexistentfield" as any, direction: "asc" }],
                })
            ).rejects.toThrow("Field \"nonexistentfield\" not found in table schema");
        });
    });

    describe("getRecord", () => {
        it("can get a single record by ID", async () => {
            const { records: [created] } = await tasks.createRecords([{ name: "Get Test Task" }]);

            const result = await tasks.getRecord(created.id);

            expect(result).toMatchObject({
                id: created.id,
                fields: {
                    name: "Get Test Task",
                },
            });
            expect(result.createdTime).toBeDefined();
        });

        it("returns all fields with default values", async () => {
            const { records: [created] } = await tasks.createRecords([{ name: "Minimal Task" }]);

            const result = await tasks.getRecord(created.id);

            expect(result.fields).toHaveProperty("name");
            expect(result.fields).toHaveProperty("status");
            expect(result.fields).toHaveProperty("completed");
            expect(result.fields).toHaveProperty("priority");
        });

        it("can use string cell format", async () => {
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Date Task",
                    dueDate: "2025-12-25",
                },
            ]);

            const result = await tasks.getRecord(created.id);

            expect(result.fields).toBeDefined();
        });
    });

    describe("updateRecords", () => {
        it("can update a single record", async () => {
            const { records: [created] } = await tasks.createRecords([{ name: "Original Name" }]);

            const result = await tasks.updateRecords([
                {
                    id: created.id,
                    fields: {
                        name: "Updated Name",
                        completed: true,
                    },
                },
            ]);

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).toMatchObject({
                id: created.id,
                fields: {
                    name: "Updated Name",
                    completed: true,
                },
                operation: "updated",
            });
            expect(result.warnings).toEqual([]);
        });

        it("reports which records an upsert created and which it updated", async () => {
            const { records: [existing] } = await tasks.createRecords([{ name: "Upsert Existing" }]);

            const result = await tasks.updateRecords([
                { fields: { name: "Upsert Existing", priority: 1 } },
                { fields: { name: "Upsert New", priority: 2 } },
            ], { performUpsert: { fieldsToMergeOn: ["name"] } });

            expect(result.records).toHaveLength(2);
            expect(result.records[0]).toMatchObject({ id: existing.id, operation: "updated" });
            expect(result.records[1].operation).toBe("created");
            expect(result.records[1].id).not.toBe(existing.id);
            expect(result.warnings).toEqual([]);
        });

        it("can update multiple records in batches", async () => {
            const { records: created } = await tasks.createRecords(Array.from({ length: 25 }, (_, i) => ({
                name: `Task ${i}`,
            })));

            const result = await tasks.updateRecords(created.map((r) => ({
                id: r.id,
                fields: {
                    completed: true,
                },
            })));

            expect(result.records).toHaveLength(25);
            expect(result.records.every((r) => r.fields.completed === true)).toBe(true);
        });

        it("can use non-destructive update (PATCH)", async () => {
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Original Task",
                    status: "Todo",
                    priority: 1,
                },
            ]);

            await tasks.updateRecords([
                {
                    id: created.id,
                    fields: {
                        name: "Updated Name",
                    },
                },
            ], {
                destructive: false,
            });

            const retrieved = await tasks.getRecord(created.id);

            expect(retrieved.fields.name).toBe("Updated Name");
            expect(retrieved.fields.status).toBe("Todo");
            expect(retrieved.fields.priority).toBe(1);
        });

        it("can use destructive update (PUT)", async () => {
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Original Task",
                    status: "Todo",
                    priority: 1,
                },
            ]);

            await tasks.updateRecords([
                {
                    id: created.id,
                    fields: {
                        name: "Updated Name",
                    },
                },
            ], {
                destructive: true,
            });

            const retrieved = await tasks.getRecord(created.id);

            expect(retrieved.fields.name).toBe("Updated Name");
            expect(retrieved.fields.status).toBeNull();
            expect(retrieved.fields.priority).toBeNull();
        });

        it("can enable typecast", async () => {
            const { records: [created] } = await tasks.createRecords([{ name: "Typecast Task" }]);

            const result = await tasks.updateRecords([
                {
                    id: created.id,
                    fields: {
                        priority: "2" as any,
                    },
                },
            ], {
                typecast: true,
            });

            expect(result.records[0].fields.priority).toBe(2);
        });

        it("handles empty update list", async () => {
            const result = await tasks.updateRecords([]);

            expect(result).toEqual({ records: [], warnings: [] });
        });

        it("removes undefined fields but keeps null fields", async () => {
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Test Task",
                    status: "Todo",
                    priority: 1,
                },
            ]);

            await tasks.updateRecords([
                {
                    id: created.id,
                    fields: {
                        name: "Updated",
                        status: undefined,
                        priority: null,
                    },
                },
            ]);

            const retrieved = await tasks.getRecord(created.id);

            expect(retrieved.fields.name).toBe("Updated");
            expect(retrieved.fields.status).toBe("Todo");
        });
    });

    describe("deleteRecords", () => {
        it("can delete a single record", async () => {
            const { records: [created] } = await tasks.createRecords([{ name: "Delete Me" }]);

            const result = await tasks.deleteRecords([created.id]);

            expect(result).toEqual([created.id]);
        });

        it("can delete multiple records in batches", async () => {
            const { records: created } = await tasks.createRecords(Array.from({ length: 25 }, (_, i) => ({
                name: `Delete Task ${i}`,
            })));

            const result = await tasks.deleteRecords(created.map((r) => r.id));

            expect(result).toEqual(created.map((r) => r.id));
        });

        it("handles empty record list", async () => {
            const result = await tasks.deleteRecords([]);

            expect(result).toEqual([]);
        });
    });

    describe("uploadAttachment", () => {
        const fieldId = tasksTable.fields.find((f) => f.name === "attachments")?.id!;
        for (const attachmentFieldIdOrName of [fieldId, "attachments"] as const) {
            it(`can upload an attachment to a record with attachmentFieldIdOrName=${attachmentFieldIdOrName}`, async () => {
                const { records: [created] } = await tasks.createRecords([{ name: "Attachment Test" }]);
                const base64File = Buffer.from("test file content").toString("base64");
                await tasks.uploadAttachment({
                    recordId: created.id,
                    field: attachmentFieldIdOrName,
                    contentType: "text/plain",
                    file: base64File,
                    filename: "test.txt",
                });
                const updatedRecord = await tasks.getRecord(created.id);

                expect(updatedRecord.fields.attachments).toBeDefined();
                expect(Array.isArray(updatedRecord.fields.attachments)).toBe(true);
                expect(updatedRecord.fields.attachments.length).toBe(1);
                expect(updatedRecord.fields.attachments[0].type).toBe("text/plain");
                expect(updatedRecord.fields.attachments[0].filename).toBe("test.txt");
                expect(updatedRecord.fields.attachments[0].url).toBeDefined();
                expect(updatedRecord.fields.attachments[0].id).toBeDefined();
                expect(updatedRecord.fields.attachments[0].size).toBeGreaterThan(0);
            });
        }
    });
});
