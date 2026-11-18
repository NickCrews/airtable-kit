import { describe, expect } from 'vitest';
import {
  makeCreateTool,
  makeUpdateTool,
  makeGetTool,
  makeListTool,
  makeDeleteTool,
} from '../src/mcp/index.ts';
import { test as baseTest } from '../src/tests/fixtures.ts';
import { type TestBase, offlineTestBase } from '../src/tests/test-utils.ts';

const offlineTasks = offlineTestBase.tables.tasks;

/** Every test that uses `tasks` starts with the seed data. */
const test = baseTest.extend<{ tasks: TestBase["tables"]["tasks"] }>({
  tasks: async ({ base }, use) => {
    await use(base.tables.tasks);
  },
});

describe('MCP Tool - Create Tool', () => {
  test('should create a create tool with the correct metadata', () => {
    const createTool = makeCreateTool(offlineTasks);
    expect(createTool.name).toBe("create-records-in-tasks-table");
    expect(createTool.description).toContain("Insert new records into the tasks table");
    expect(createTool.inputJsonSchema).toHaveProperty("properties");
    expect((createTool.inputJsonSchema as any).properties).toHaveProperty("records");
  });

  test('should work for valid input', async ({ tasks }) => {
    const createTool = makeCreateTool(tasks);
    const { records: result } = await createTool.execute({
      records: [
        {
          name: "My new task",
          completed: true,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      fields: {
        name: "My new task",
        completed: true,
      },
    });
    expect(result[0].id).toMatch(/^rec/);
    expect(result[0].url).toContain("airtable.com");
    expect(result[0].createdTime).toBeDefined();
  });
});

describe('MCP Tool - Update Tool', () => {
  test('should create an update tool with the correct metadata', () => {
    const updateTool = makeUpdateTool(offlineTasks);
    expect(updateTool.name).toBe("update-records-in-tasks-table");
    expect(updateTool.description).toBe('Update existing records in the tasks table.');
    expect(updateTool.inputJsonSchema).toHaveProperty("properties");
    expect((updateTool.inputJsonSchema as any).properties).toHaveProperty("records");
  });

  test('should work for valid input', async ({ tasks }) => {
    const updateTool = makeUpdateTool(tasks);

    // Create a record first
    const { records: [created] } = await tasks.createRecords([
      {
        name: "My new task",
        completed: false,
        notes: "a note",
        dueDate: "2025-01-01",
      },
    ]);

    const validInput = {
      records: [
        {
          id: created.id,
          fields: {
            name: null,
            completed: true,
            // undefined values are left as is
            dueDate: undefined,
            // we don't support dueDate, that is left as is
          },
        },
      ],
    };

    const result = await updateTool.execute(validInput);

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      id: created.id,
      fields: {
        name: "",
        completed: true,
        notes: "a note",
        dueDate: "2025-01-01",
      },
    });
  });
});

describe('MCP Tool - Get Tool', () => {
  test('should create a get tool with the correct metadata', () => {
    const getTool = makeGetTool(offlineTasks);
    expect(getTool.name).toBe("get-record-from-tasks-table");
    expect(getTool.description).toBe('Get a single record by ID from the tasks table.');
    expect(getTool.inputJsonSchema).toHaveProperty("properties");
    expect((getTool.inputJsonSchema as any).properties).toHaveProperty("recordId");
  });

  test('should work for valid input', async ({ tasks }) => {
    const getTool = makeGetTool(tasks);
    const { records: [created] } = await tasks.createRecords([
      {
        name: "my task"
      },
    ]);
    const result = await getTool.execute({ recordId: created.id });

    expect(result).toMatchObject({
      id: created.id,
      fields: {
        name: "my task",
      },
    });
    expect(result.createdTime).toBeDefined();
  });
});

describe('MCP Tool - List Tool', () => {
  test('should create a list tool with the correct metadata', () => {
    const listTool = makeListTool(offlineTasks);
    expect(listTool.name).toBe("list-records-from-tasks-table");
    expect(listTool.description).toBe('List records from the tasks table with optional filtering and pagination.');
    expect(listTool.inputJsonSchema).toHaveProperty("properties");
  });

  test('should work for valid input with no options', async ({ tasks }) => {
    const listTool = makeListTool(tasks);
    const validInput = {};
    const result = await listTool.execute(validInput);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("fields");
    expect(result[0]).toHaveProperty("createdTime");
  });

  test('should work with filtering options', async ({ tasks }) => {
    const listTool = makeListTool(tasks);

    const validInput = {
      options: {
        filterByFormula: `{name} = "Setup development environment"`,
        maxRecords: 10,

      },
    };
    const result = await listTool.execute(validInput);

    expect(result.length).toBe(1);
    expect(result[0].fields.name).toBe("Setup development environment")
  });
});

describe('MCP Tool - Delete Tool', () => {
  test('should create a delete tool with the correct metadata', () => {
    const deleteTool = makeDeleteTool(offlineTasks);
    expect(deleteTool.name).toBe("delete-records-from-tasks-table");
    expect(deleteTool.description).toContain("Delete records by ID from the tasks table");
    expect(deleteTool.inputJsonSchema).toHaveProperty("properties");
    expect((deleteTool.inputJsonSchema as any).properties).toHaveProperty("recordIds");
  });

  test('should work for valid input', async ({ tasks }) => {
    const deleteTool = makeDeleteTool(tasks);
    const nRecordsBefore = (await tasks.listRecords({ fields: ["name"] })).length

    const { records: created } = await tasks.createRecords([
      { name: "Delete Me 1" },
      { name: "Delete Me 2" },
    ]);
    const recordIds = created.map((r) => r.id);
    const result = await deleteTool.execute({ recordIds });

    expect(result).toEqual(recordIds);

    const nRecordsAfter = (await tasks.listRecords({ fields: ["name"] })).length
    expect(nRecordsAfter).toBe(nRecordsBefore);
  });
});
