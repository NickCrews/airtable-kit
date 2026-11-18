import { describe, expect, expectTypeOf } from "vitest";
import { test as baseTest } from "../src/tests/fixtures.ts";
import { type TestBase } from "../src/tests/test-utils.ts";
import testBaseSchema from "../src/tests/test-base-schema.generated.ts";

const tasksTable = testBaseSchema.tables.find((t) => t.name === "tasks")!;

/** Every test that uses `tasks` starts with an empty base. */
const test = baseTest.extend<{ tasks: TestBase["tables"]["tasks"] }>({
    tasks: async ({ emptyBase }, use) => {
        await use(emptyBase.tables.tasks);
    },
});

describe("Records API", () => {
    describe("createRecords", () => {
        test("can create a single record", async ({ tasks }) => {
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

        test("can create more than 25 records (batches requests to Airtable)", async ({ tasks }) => {
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

        test("can handle empty record list", async ({ tasks }) => {
            const { records: result } = await tasks.createRecords([]);

            expect(result).toEqual([]);
        });

        test("removes undefined and null fields before sending", async ({ tasks }) => {
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
        test("returns commentCount only when recordMetadata requests it", async ({ tasks, airtable }) => {
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
        test("sends and returns values as Airtable's JSON, keyed by field name", async ({ emptyBase }) => {
            const { records: result } = await emptyBase.airtable.records.create({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                records: [{ fields: { name: "Raw Create Task", priority: 2 } }],
            });

            expect(result).toHaveLength(1);
            expect(result[0].fields.name).toBe("Raw Create Task");
            // Raw records omit empty fields
            expect(result[0].fields).not.toHaveProperty("completed");
        });

        test("handles empty list", async ({ airtable }) => {
            const result = await airtable.records.create({
                baseId: testBaseSchema.id,
                tableId: tasksTable.id,
                records: [],
            });

            expect(result).toEqual({ records: [], warnings: [] });
        });
    });

    describe("listRecords", () => {
        test("can list all records", async ({ tasks }) => {
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

        test("can filter records by formula string", async ({ tasks }) => {
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

        test("can sort records", async ({ tasks }) => {
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

        test("can limit max records", async ({ tasks }) => {
            const result = await tasks.listRecords({
                maxRecords: 2,
            });

            expect(result.length).toBeLessThanOrEqual(2);
        });

        test("can select specific fields", async ({ tasks }) => {
            const result = await tasks.listRecords({
                fields: ["name", "status"],
                maxRecords: 1,
            });

            expect(Array.isArray(result)).toBe(true);
        });

        test("handles pagination automatically", async ({ tasks }) => {
            const records = Array.from({ length: 35 }, (_, i) => ({
                name: `Task ${i + 1}`,
            }));

            await tasks.createRecords(records);

            const result = await tasks.listRecords();

            expect(result.length).toBeGreaterThanOrEqual(35);
        });
    });

    describe("listRecordsPage", () => {
        test("can list records with page size", async ({ tasks }) => {
            const result = await tasks.listRecordsPage({
                pageSize: 5,
            });

            expect(result.records.length).toBeLessThanOrEqual(5);
            expect(result).toHaveProperty("offset");
        });

        test("throws error on invalid filter formula", async ({ tasks }) => {
            await expect(
                tasks.listRecordsPage({
                    filterByFormula: "{invalidfield} = TRUE()",
                })
            ).rejects.toThrow();
        });

        test("omits commentCount from the records and their type unless requested", async ({ tasks }) => {
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

        test("adds commentCount to the records and their type when requested", async ({ tasks }) => {
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

        test("resolves field names to IDs", async ({ tasks }) => {
            const result = await tasks.listRecordsPage({
                sort: [{ field: "name", direction: "asc" }],
                maxRecords: 1,
            });

            expect(result.records).toBeDefined();
        });

        test("throws error when field not found", async ({ tasks }) => {
            await expect(
                tasks.listRecordsPage({
                    sort: [{ field: "nonexistentfield" as any, direction: "asc" }],
                })
            ).rejects.toThrow("Field \"nonexistentfield\" not found in table schema");
        });
    });

    describe("getRecord", () => {
        test("can get a single record by ID", async ({ tasks }) => {
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

        test("returns all fields with default values", async ({ tasks }) => {
            const { records: [created] } = await tasks.createRecords([{ name: "Minimal Task" }]);

            const result = await tasks.getRecord(created.id);

            expect(result.fields).toHaveProperty("name");
            expect(result.fields).toHaveProperty("status");
            expect(result.fields).toHaveProperty("completed");
            expect(result.fields).toHaveProperty("priority");
        });

        test("can use string cell format", async ({ tasks }) => {
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
        test("can update a single record", async ({ tasks }) => {
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

        test("reports which records an upsert created and which it updated", async ({ tasks }) => {
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

        test("can update multiple records in batches", async ({ tasks }) => {
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

        test("can use non-destructive update (PATCH)", async ({ tasks }) => {
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

        test("can use destructive update (PUT)", async ({ tasks }) => {
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

        test("can enable typecast", async ({ tasks }) => {
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

        test("handles empty update list", async ({ tasks }) => {
            const result = await tasks.updateRecords([]);

            expect(result).toEqual({ records: [], warnings: [] });
        });

        test("removes undefined fields but keeps null fields", async ({ tasks }) => {
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
        test("can delete a single record", async ({ tasks }) => {
            const { records: [created] } = await tasks.createRecords([{ name: "Delete Me" }]);

            const result = await tasks.deleteRecords([created.id]);

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).toEqual({
                id: created.id,
                deleted: true,
            });
        });

        test("can delete multiple records in batches", async ({ tasks }) => {
            const { records: created } = await tasks.createRecords(Array.from({ length: 25 }, (_, i) => ({
                name: `Delete Task ${i}`,
            })));

            const result = await tasks.deleteRecords(created.map((r) => r.id));

            expect(result.records).toHaveLength(25);
            expect(result.records.every((r) => r.deleted === true)).toBe(true);
        });

        test("handles empty record list", async ({ tasks }) => {
            const result = await tasks.deleteRecords([]);

            expect(result).toEqual({ records: [] });
        });
    });

    describe("uploadAttachment", () => {
        const fieldId = tasksTable.fields.find((f) => f.name === "attachments")?.id!;
        for (const attachmentFieldIdOrName of [fieldId, "attachments"] as const) {
            test(`can upload an attachment to a record with attachmentFieldIdOrName=${attachmentFieldIdOrName}`, async ({ tasks }) => {
                const { records: [created] } = await tasks.createRecords([{ name: "Attachment Test" }]);
                const base64File = Buffer.from("test file content").toString("base64");
                await tasks.uploadAttachment(created.id, attachmentFieldIdOrName, {
                    "contentType": "text/plain",
                    "file": base64File,
                    "filename": "test.txt"
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
