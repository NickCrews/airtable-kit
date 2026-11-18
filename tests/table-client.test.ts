import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import { getTestAirtable, prepTestBaseClient } from '../src/tests/test-utils.ts';
import { createBaseClient, createTableClient } from "airtable-kit/typed";

import testBaseSchema from "../src/tests/test-base-schema.generated.ts";
const baseClient = createBaseClient({ schema: testBaseSchema, airtable: getTestAirtable() });
const { resetBaseData } = prepTestBaseClient(baseClient);

describe("TableClient", () => {
    const tasksTableClient = baseClient.tables.tasks;

    beforeEach(async () => {
        await resetBaseData();
    });

    describe("fields dictionary", () => {
        it("typechecks"), async () => {
            const existingField = tasksTableClient.fields.dueDate;
            expect(existingField).toBeDefined();
            const type: "date" = existingField.type;
            expect(type).toBe("date");

            // @ts-expect-error
            const nonExistentField = tasksTableClient.fields.nonExistentField;
            expect(nonExistentField).toBeUndefined();
        };
    });

    describe("createRecords", () => {
        it("can handle 0-record creates", async () => {
            const { records: result } = await tasksTableClient.createRecords({ records: [] });
            expect(result).toEqual([]);
        });

        it("can create records", async () => {
            const { records: response } = await tasksTableClient.createRecords({
                records: [
                    {
                        name: "Fold Laundry",
                        completed: false,
                        notes: undefined, // should be ignored
                        status: null, // should be ignored
                    },
                ],
            });

            expect(response).toHaveLength(1);
            expect(response[0]).toMatchObject({
                fields: {
                    name: "Fold Laundry",
                    completed: false,
                    attachments: [],
                    dueDate: null,
                    notes: "",
                    priority: null,
                    status: null,
                    tags: [],
                },
            });
            expect(response[0].id).toMatch(/^rec/);
            expect(response[0].createdTime).toBeDefined();
        });

        it("can create records with select options by name", async () => {
            const { records: response } = await tasksTableClient.createRecords({
                records: [
                    {
                        name: "Test Task",
                        status: "In Progress",
                    },
                ],
            });

            expect(response).toHaveLength(1);
            expect(response[0].fields.status).toBe("In Progress");
        });

        it("rejects invalid select options", async () => {
            await expect(
                tasksTableClient.createRecords({
                    records: [
                        {
                            name: "Test Task",
                            status: "InvalidStatus" as any, // invalid select option
                        },
                    ],
                })
            ).rejects.toThrow();
        });
    });

    describe("update", () => {
        it("can handle 0-record updates", async () => {
            const result = await tasksTableClient.updateRecords({ records: [] });
            expect(result).toEqual({ records: [], warnings: [] });
        });

        it("can update records", async () => {
            // First create a record
            const { records: [created] } = await tasksTableClient.createRecords({
                records: [
                    {
                        name: "Task to Update",
                        completed: false,
                    },
                ],
            });

            // Update it
            const result = await tasksTableClient.updateRecords({
                records: [
                    {
                        id: created.id,
                        fields: {
                            name: "Updated Task Name",
                            completed: true,
                            notes: undefined, // should be ignored
                            dueDate: null, // should be cleared
                        },
                    },
                ],
            });

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).toMatchObject({
                id: created.id,
                fields: {
                    name: "Updated Task Name",
                    completed: true,
                    dueDate: null,
                },
            });
        });
    });

    describe("delete", () => {
        it("can delete records", async () => {
            // Create a record
            const { records: [created] } = await tasksTableClient.createRecords({
                records: [
                    {
                        name: "Task to Delete",
                    },
                ],
            });

            // Delete it
            const result = await tasksTableClient.deleteRecords({ recordIds: [created.id] });

            expect(result).toEqual([created.id]);

            // Verify it's deleted by trying to list
            const allRecords = await tasksTableClient.listRecords();
            const foundRecord = allRecords.find((r) => r.id === created.id);
            expect(foundRecord).toBeUndefined();
        });
    });

    describe("formulaToString", () => {
        it("can convert formula objects to strings", () => {
            const formulaStr = tasksTableClient.formulaToString({
                formula: [
                    "AND",
                    [">=", { field: "dueDate" }, ["TODAY"]],
                    ["<=", { field: "dueDate" }, ["DATEADD", ["TODAY"], 7, "days"]],
                    ["=", { field: "status" }, "In Progress"],
                    ["!=", { field: "name" }, null],
                ],
            });
            expect(formulaStr).toMatchInlineSnapshot(`"AND({fldnICsxPklEeCtbY} >= TODAY(), {fldnICsxPklEeCtbY} <= DATEADD(TODAY(), 7, "days"), {fld5HSoxDVnT7NGZ6} = "In Progress", {fldlwe8DKJGEOB4NB} != BLANK())"`)
        });
    });

    describe("list", () => {
        it("can list records with filterByFormula as string", async () => {
            // Create some test records
            await tasksTableClient.createRecords({
                records: [
                    { name: "Task 1", completed: true },
                    { name: "Task 2", completed: false },
                ],
            });

            // Get the completed field ID from the table schema
            const completedFieldId = tasksTableClient.schema.fields.find(
                (f: any) => f.name === "completed"
            )?.id;

            const records = await tasksTableClient.listRecords({
                filterByFormula: `{${completedFieldId}} = TRUE()`,
            });

            // Should only get completed tasks (1 from our created records + seed data completed tasks)
            expect(records.length).toBeGreaterThan(0);
            expect(records.every((r) => r.fields.completed === true)).toBe(true);
        });

        it("can list records with filterByFormula as Formula object", async () => {
            // Create test records
            await tasksTableClient.createRecords({
                records: [
                    { name: "Test Done Task", status: "Done", completed: true },
                    { name: "Test Todo Task", status: "Todo", completed: false },
                ],
            });

            const records = await tasksTableClient.listRecords({
                filterByFormula: [
                    "AND",
                    ["=", { field: "status" }, "Done"],
                    ["=", { field: "completed" }, true],
                ],
            });

            // Should only get tasks that are both Done and Completed
            expect(records.length).toBeGreaterThan(0);
            expect(
                records.every((r) => r.fields.status === "Done" && r.fields.completed === true)
            ).toBe(true);
        });

        it("can list all records without filters", async () => {
            const records = await tasksTableClient.listRecords();

            // Should get all seed data records
            expect(records.length).toBeGreaterThan(0);
            expect(records[0]).toHaveProperty("id");
            expect(records[0]).toHaveProperty("fields");
            expect(records[0]).toHaveProperty("createdTime");
        });
    });

    describe("get", () => {
        it("can get a record by ID", async () => {
            // Create a record
            const { records: [created] } = await tasksTableClient.createRecords({
                records: [
                    {
                        name: "Get Test Task",
                        completed: false,
                    },
                ],
            });

            // Get it
            const record = await tasksTableClient.getRecord({ recordId: created.id });

            expect(record).toMatchObject({
                id: created.id,
                fields: {
                    name: "Get Test Task",
                    completed: false,
                    attachments: [],
                    dueDate: null,
                    notes: "",
                    priority: null,
                    status: null,
                    tags: [],
                },
            });
            expect(record.createdTime).toBeDefined();
        });

        it("fills in default values for empty fields", async () => {
            // Create a record with minimal fields
            const { records: [created] } = await tasksTableClient.createRecords({
                records: [
                    {
                        name: "Minimal Task",
                    },
                ],
            });

            const record = await tasksTableClient.getRecord({ recordId: created.id });

            // All fields should be present with default values
            expect(record.fields).toHaveProperty("attachments");
            expect(record.fields).toHaveProperty("completed");
            expect(record.fields).toHaveProperty("dueDate");
            expect(record.fields).toHaveProperty("notes");
            expect(record.fields).toHaveProperty("priority");
            expect(record.fields).toHaveProperty("status");
            expect(record.fields).toHaveProperty("tags");
        });
    });

    describe("createTableClient with a hand-written schema", () => {
        it("needs only the table ID, and each field's id, name, type, and the options its values depend on", async () => {
            const { name, completed, dueDate, status } = tasksTableClient.fields;
            const tasks = createTableClient(
                {
                baseId: testBaseSchema.id,
                schema: {
                        id: tasksTableClient.schema.id,
                        fields: [
                            { id: name.id, name: name.name, type: name.type },
                            { id: completed.id, name: completed.name, type: completed.type },
                            { id: dueDate.id, name: dueDate.name, type: dueDate.type },
                            {
                                id: status.id,
                                name: status.name,
                                type: status.type,
                                options: { choices: status.options.choices.map(({ id, name }) => ({ id, name })) },
                            },
                        ],
                    },
                airtable: getTestAirtable(),
                onReadUnexpectedField: { warn: false, keep: false },
            }
            );

            const { records: [created] } = await tasks.createRecords({
                records: [
                    { name: "Hand-written schema", dueDate: new Date("2024-12-31"), status: "Done" },
                ],
            });
            expect(created.fields).toEqual({ name: "Hand-written schema", completed: false, dueDate: "2024-12-31", status: "Done" });
            expectTypeOf(created.fields.completed).toEqualTypeOf<boolean>();
            expectTypeOf(created.fields.status).toEqualTypeOf<"Todo" | "In Progress" | "Done" | null>();

            const fetched = await tasks.getRecord({ recordId: created.id });
            expect(fetched.fields).toEqual(created.fields);
        });
    });
});
