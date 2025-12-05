import { beforeEach, describe, expect, it } from "vitest";
import { testBaseClient } from "../tests/test-utils.ts";

describe("TableClient", () => {
    const { tasksTableClient, resetBaseData } = testBaseClient();

    beforeEach(async () => {
        await resetBaseData();
    });

    describe("createMany", () => {
        it("can handle 0-record creates", async () => {
            const result = await tasksTableClient.createMany([]);
            expect(result).toEqual([]);
        });

        it("can create records", async () => {
            const response = await tasksTableClient.createMany([
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

        it("can create records with select options by name", async () => {
            const response = await tasksTableClient.createMany([
                {
                    name: "Test Task",
                    status: "In Progress",
                },
            ]);

            expect(response).toHaveLength(1);
            expect(response[0].fields.status).toBe("In Progress");
        });

        it("rejects invalid select options", async () => {
            await expect(
                tasksTableClient.createMany([
                    {
                        name: "Test Task",
                        status: "InvalidStatus" as any, // invalid select option
                    },
                ])
            ).rejects.toThrow();
        });
    });

    describe("update", () => {
        it("can handle 0-record updates", async () => {
            const result = await tasksTableClient.update([]);
            expect(result).toEqual({ records: [] });
        });

        it("can update records", async () => {
            // First create a record
            const [created] = await tasksTableClient.createMany([
                {
                    name: "Task to Update",
                    completed: false,
                },
            ]);

            // Update it
            const result = await tasksTableClient.update([
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
        it("can delete records", async () => {
            // Create a record
            const [created] = await tasksTableClient.createMany([
                {
                    name: "Task to Delete",
                },
            ]);

            // Delete it
            const result = await tasksTableClient.delete([created.id]);

            expect(result.records).toEqual([
                {
                    id: created.id,
                    deleted: true,
                },
            ]);

            // Verify it's deleted by trying to list
            const allRecords = await tasksTableClient.list();
            const foundRecord = allRecords.find((r) => r.id === created.id);
            expect(foundRecord).toBeUndefined();
        });
    });

    describe("formulaToString", () => {
        it("can convert formula objects to strings", () => {
            const formulaStr = tasksTableClient.formulaToString([
                "AND",
                [">=", { field: "dueDate" }, ["TODAY"]],
                ["<=", { field: "dueDate" }, ["DATEADD", ["TODAY"], 7, "days"]],
                ["=", { field: "status" }, "In Progress"],
                ["!=", { field: "name" }, null],
            ]);

            // Check that it contains the expected field IDs and structure
            expect(formulaStr).toContain("AND(");
            expect(formulaStr).toContain(">=");
            expect(formulaStr).toContain("TODAY()");
            expect(formulaStr).toContain("DATEADD");
            expect(formulaStr).toContain("In Progress");
            expect(formulaStr).toContain("BLANK()");
        });
    });

    describe("list", () => {
        it("can list records with filterByFormula as string", async () => {
            // Create some test records
            await tasksTableClient.createMany([
                { name: "Task 1", completed: true },
                { name: "Task 2", completed: false },
            ]);

            // Get the completed field ID from the table schema
            const completedFieldId = tasksTableClient.tableSchema.fields.find(
                (f: any) => f.name === "completed"
            )?.id;

            const records = await tasksTableClient.list({
                filterByFormula: `{${completedFieldId}} = TRUE()`,
            });

            // Should only get completed tasks (1 from our created records + seed data completed tasks)
            expect(records.length).toBeGreaterThan(0);
            expect(records.every((r) => r.fields.completed === true)).toBe(true);
        });

        it("can list records with filterByFormula as Formula object", async () => {
            // Create test records
            await tasksTableClient.createMany([
                { name: "Test Done Task", status: "Done", completed: true },
                { name: "Test Todo Task", status: "Todo", completed: false },
            ]);

            const records = await tasksTableClient.list({
                filterByFormula: [
                    "AND",
                    ["=", { field: "status" }, "Done"],
                    ["=", { field: "completed" }, true],
                ],
            });

            // Should only get tasks that are both Done and Completed
            expect(records.length).toBeGreaterThan(0);
            expect(
                records.every((r) => r.fields.status?.name === "Done" && r.fields.completed === true)
            ).toBe(true);
        });

        it("can list all records without filters", async () => {
            const records = await tasksTableClient.list();

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
            const [created] = await tasksTableClient.createMany([
                {
                    name: "Get Test Task",
                    completed: false,
                },
            ]);

            // Get it
            const record = await tasksTableClient.get(created.id);

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
            const [created] = await tasksTableClient.createMany([
                {
                    name: "Minimal Task",
                },
            ]);

            const record = await tasksTableClient.get(created.id);

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
});
