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
                    Name: "Fold Laundry",
                    Completed: false,
                    Notes: undefined, // should be ignored
                    Status: null, // should be ignored
                },
            ]);

            expect(response).toHaveLength(1);
            expect(response[0]).toMatchObject({
                fields: {
                    Name: "Fold Laundry",
                    Completed: false,
                    "Assigned To": [],
                    Attachments: [],
                    "Due Date": null,
                    Notes: "",
                    Priority: null,
                    Status: null,
                    Tags: [],
                },
            });
            expect(response[0].id).toMatch(/^rec/);
            expect(response[0].createdTime).toBeDefined();
            expect(response[0].fields["Created At"]).toBeDefined();
            expect(response[0].fields["Updated At"]).toBeDefined();
        });

        it("can create records with select options by name", async () => {
            const response = await tasksTableClient.createMany([
                {
                    Name: "Test Task",
                    Status: "In Progress",
                },
            ]);

            expect(response).toHaveLength(1);
            expect(response[0].fields.Status).toBe("In Progress");
        });

        it("rejects invalid select options", async () => {
            await expect(
                tasksTableClient.createMany([
                    {
                        Name: "Test Task",
                        Status: "InvalidStatus" as any, // invalid select option
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
                    Name: "Task to Update",
                    Completed: false,
                },
            ]);

            // Update it
            const result = await tasksTableClient.update([
                {
                    id: created.id,
                    fields: {
                        Name: "Updated Task Name",
                        Completed: true,
                        Notes: undefined, // should be ignored
                        "Due Date": null, // should be cleared
                    },
                },
            ]);

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).toMatchObject({
                id: created.id,
                fields: {
                    Name: "Updated Task Name",
                    Completed: true,
                    "Due Date": null,
                },
            });
        });
    });

    describe("delete", () => {
        it("can delete records", async () => {
            // Create a record
            const [created] = await tasksTableClient.createMany([
                {
                    Name: "Task to Delete",
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
                [">=", { field: "Due Date" }, ["TODAY"]],
                ["<=", { field: "Due Date" }, ["DATEADD", ["TODAY"], 7, "days"]],
                ["=", { field: "Status" }, "In Progress"],
                ["!=", { field: "Name" }, null],
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
                { Name: "Task 1", Completed: true },
                { Name: "Task 2", Completed: false },
            ]);

            // Get the Completed field ID from the table schema
            const completedFieldId = tasksTableClient.tableSchema.fields.find(
                (f: any) => f.name === "Completed"
            )?.id;

            const records = await tasksTableClient.list({
                filterByFormula: `{${completedFieldId}} = TRUE()`,
            });

            // Should only get completed tasks (1 from our created records + seed data completed tasks)
            expect(records.length).toBeGreaterThan(0);
            expect(records.every((r) => r.fields.Completed === true)).toBe(true);
        });

        it("can list records with filterByFormula as Formula object", async () => {
            // Create test records
            await tasksTableClient.createMany([
                { Name: "Test Done Task", Status: "Done", Completed: true },
                { Name: "Test Todo Task", Status: "Todo", Completed: false },
            ]);

            const records = await tasksTableClient.list({
                filterByFormula: [
                    "AND",
                    ["=", { field: "Status" }, "Done"],
                    ["=", { field: "Completed" }, true],
                ],
            });

            // Should only get tasks that are both Done and Completed
            expect(records.length).toBeGreaterThan(0);
            expect(
                records.every((r) => r.fields.Status === "Done" && r.fields.Completed === true)
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
                    Name: "Get Test Task",
                    Completed: false,
                },
            ]);

            // Get it
            const record = await tasksTableClient.get(created.id);

            expect(record).toMatchObject({
                id: created.id,
                fields: {
                    Name: "Get Test Task",
                    Completed: false,
                    "Assigned To": [],
                    Attachments: [],
                    "Due Date": null,
                    Notes: "",
                    Priority: null,
                    Status: null,
                    Tags: [],
                },
            });
            expect(record.createdTime).toBeDefined();
            expect(record.fields["Created At"]).toBeDefined();
            expect(record.fields["Updated At"]).toBeDefined();
        });

        it("fills in default values for empty fields", async () => {
            // Create a record with minimal fields
            const [created] = await tasksTableClient.createMany([
                {
                    Name: "Minimal Task",
                },
            ]);

            const record = await tasksTableClient.get(created.id);

            // All fields should be present with default values
            expect(record.fields).toHaveProperty("Assigned To");
            expect(record.fields).toHaveProperty("Attachments");
            expect(record.fields).toHaveProperty("Completed");
            expect(record.fields).toHaveProperty("Due Date");
            expect(record.fields).toHaveProperty("Notes");
            expect(record.fields).toHaveProperty("Priority");
            expect(record.fields).toHaveProperty("Status");
            expect(record.fields).toHaveProperty("Tags");
            expect(record.fields).toHaveProperty("Created At");
            expect(record.fields).toHaveProperty("Updated At");
        });
    });
});
