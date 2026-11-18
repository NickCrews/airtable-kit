import { describe, expect, expectTypeOf } from "vitest";
import { createTableClient } from "airtable-kit/typed";
import { test as baseTest } from "../src/tests/fixtures.ts";
import { type TestBase, offlineTestBase } from "../src/tests/test-utils.ts";
import testBaseSchema from "../src/tests/test-base-schema.generated.ts";

const offlineTasks = offlineTestBase.tables.tasks;

/** Every test that uses `tasks` starts with the seed data. */
const test = baseTest.extend<{ tasks: TestBase["tables"]["tasks"] }>({
    tasks: async ({ base }, use) => {
        await use(base.tables.tasks);
    },
});

describe("TableClient", () => {
    describe("fields dictionary", () => {
        test("typechecks", () => {
            const existingField = offlineTasks.fields.dueDate;
            expect(existingField).toBeDefined();
            const type: "date" = existingField.type;
            expect(type).toBe("date");

            // @ts-expect-error
            const nonExistentField = offlineTasks.fields.nonExistentField;
            expect(nonExistentField).toBeUndefined();
        });
    });

    describe("createRecords", () => {
        test("can handle 0-record creates", async ({ tasks }) => {
            const { records: result } = await tasks.createRecords([]);
            expect(result).toEqual([]);
        });

        test("can create records", async ({ tasks }) => {
            const { records: response } = await tasks.createRecords([
                {
                    name: "Fold Laundry",
                    completed: false,
                    notes: undefined, // should be ignored
                    status: null, // should be ignored
                },
            ]);

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

        test("can create records with select options by name", async ({ tasks }) => {
            const { records: response } = await tasks.createRecords([
                {
                    name: "Test Task",
                    status: "In Progress",
                },
            ]);

            expect(response).toHaveLength(1);
            expect(response[0].fields.status).toBe("In Progress");
        });

        test("rejects invalid select options", async ({ tasks }) => {
            await expect(
                tasks.createRecords([
                    {
                        name: "Test Task",
                        status: "InvalidStatus" as any, // invalid select option
                    },
                ])
            ).rejects.toThrow();
        });
    });

    describe("update", () => {
        test("can handle 0-record updates", async ({ tasks }) => {
            const result = await tasks.updateRecords([]);
            expect(result).toEqual({ records: [], warnings: [] });
        });

        test("can update records", async ({ tasks }) => {
            // First create a record
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Task to Update",
                    completed: false,
                },
            ]);

            // Update it
            const result = await tasks.updateRecords([
                {
                    id: created.id,
                    fields: {
                        name: "Updated Task Name",
                        completed: true,
                        notes: undefined, // should be ignored
                        dueDate: null, // should be cleared
                    },
                },
            ]);

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
        test("can delete records", async ({ tasks }) => {
            // Create a record
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Task to Delete",
                },
            ]);

            // Delete it
            const result = await tasks.deleteRecords([created.id]);

            expect(result.records).toEqual([
                {
                    id: created.id,
                    deleted: true,
                },
            ]);

            // Verify it's deleted by trying to list
            const allRecords = await tasks.listRecords();
            const foundRecord = allRecords.find((r) => r.id === created.id);
            expect(foundRecord).toBeUndefined();
        });
    });

    describe("formulaToString", () => {
        test("can convert formula objects to strings", () => {
            const formulaStr = offlineTasks.formulaToString([
                "AND",
                [">=", { field: "dueDate" }, ["TODAY"]],
                ["<=", { field: "dueDate" }, ["DATEADD", ["TODAY"], 7, "days"]],
                ["=", { field: "status" }, "In Progress"],
                ["!=", { field: "name" }, null],
            ]);
            expect(formulaStr).toMatchInlineSnapshot(`"AND({fldnICsxPklEeCtbY} >= TODAY(), {fldnICsxPklEeCtbY} <= DATEADD(TODAY(), 7, "days"), {fld5HSoxDVnT7NGZ6} = "In Progress", {fldlwe8DKJGEOB4NB} != BLANK())"`)
        });
    });

    describe("list", () => {
        test("can list records with filterByFormula as string", async ({ tasks }) => {
            // Create some test records
            await tasks.createRecords([
                { name: "Task 1", completed: true },
                { name: "Task 2", completed: false },
            ]);

            // Get the completed field ID from the table schema
            const completedFieldId = tasks.tableSchema.fields.find(
                (f: any) => f.name === "completed"
            )?.id;

            const records = await tasks.listRecords({
                filterByFormula: `{${completedFieldId}} = TRUE()`,
            });

            // Should only get completed tasks (1 from our created records + seed data completed tasks)
            expect(records.length).toBeGreaterThan(0);
            expect(records.every((r) => r.fields.completed === true)).toBe(true);
        });

        test("can list records with filterByFormula as Formula object", async ({ tasks }) => {
            // Create test records
            await tasks.createRecords([
                { name: "Test Done Task", status: "Done", completed: true },
                { name: "Test Todo Task", status: "Todo", completed: false },
            ]);

            const records = await tasks.listRecords({
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

        test("can list all records without filters", async ({ tasks }) => {
            const records = await tasks.listRecords();

            // Should get all seed data records
            expect(records.length).toBeGreaterThan(0);
            expect(records[0]).toHaveProperty("id");
            expect(records[0]).toHaveProperty("fields");
            expect(records[0]).toHaveProperty("createdTime");
        });
    });

    describe("get", () => {
        test("can get a record by ID", async ({ tasks }) => {
            // Create a record
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Get Test Task",
                    completed: false,
                },
            ]);

            // Get it
            const record = await tasks.getRecord(created.id);

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

        test("fills in default values for empty fields", async ({ tasks }) => {
            // Create a record with minimal fields
            const { records: [created] } = await tasks.createRecords([
                {
                    name: "Minimal Task",
                },
            ]);

            const record = await tasks.getRecord(created.id);

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
        test("needs only the table ID, and each field's id, name, type, and the options its values depend on", async ({ base }) => {
            const { name, completed, dueDate, status } = base.tables.tasks.fields;
            const handWritten = createTableClient(
                testBaseSchema.id,
                {
                    id: base.tables.tasks.tableSchema.id,
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
                base.airtable,
                // The table has other fields; leave them out of the records
                { onReadUnexpectedField: { warn: false, keep: false } },
            );

            const { records: [created] } = await handWritten.createRecords([
                { name: "Hand-written schema", dueDate: new Date("2024-12-31"), status: "Done" },
            ]);
            expect(created.fields).toEqual({ name: "Hand-written schema", completed: false, dueDate: "2024-12-31", status: "Done" });
            expectTypeOf(created.fields.completed).toEqualTypeOf<boolean>();
            expectTypeOf(created.fields.status).toEqualTypeOf<"Todo" | "In Progress" | "Done" | null>();

            const fetched = await handWritten.getRecord(created.id);
            expect(fetched.fields).toEqual(created.fields);
        });
    });
});
