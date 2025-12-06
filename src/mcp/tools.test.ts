import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeCreateTool,
  makeUpdateTool,
  makeGetTool,
  makeListTool,
  makeDeleteTool,
} from './index.ts';
import { testBaseClient } from '../tests/test-utils.ts';
import dotenv from "dotenv";

dotenv.config();

const hasApiKey = !!(process.env.AIRTABLE_KIT_TEST_API_KEY || process.env.AIRTABLE_API_KEY);

describe.skipIf(!hasApiKey)('MCP Tool - Create Tool', () => {
  let tasksTableClient: ReturnType<typeof testBaseClient>['tasksTableClient'];
  let resetBaseData: ReturnType<typeof testBaseClient>['resetBaseData'];

  beforeEach(async () => {
    const client = testBaseClient();
    tasksTableClient = client.tasksTableClient;
    resetBaseData = client.resetBaseData;
    await resetBaseData();
  });

  it('should create a create tool with the correct metadata', () => {
    const createTool = makeCreateTool(tasksTableClient);
    expect(createTool.name).toBe("create-records-in-tasks-table");
    expect(createTool.description).toContain("Insert new records into the tasks table");
    expect(createTool.inputJsonSchema).toHaveProperty("properties");
    expect((createTool.inputJsonSchema as any).properties).toHaveProperty("records");
  });

  it('should work for valid input', async () => {
    const createTool = makeCreateTool(tasksTableClient);
    const result = await createTool.execute({
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

describe.skipIf(!hasApiKey)('MCP Tool - Update Tool', () => {
  let tasksTableClient: ReturnType<typeof testBaseClient>['tasksTableClient'];
  let resetBaseData: ReturnType<typeof testBaseClient>['resetBaseData'];

  beforeEach(async () => {
    const client = testBaseClient();
    tasksTableClient = client.tasksTableClient;
    resetBaseData = client.resetBaseData;
    await resetBaseData();
  });

  it('should create an update tool with the correct metadata', () => {
    const updateTool = makeUpdateTool(tasksTableClient);
    expect(updateTool.name).toBe("update-records-in-tasks-table");
    expect(updateTool.description).toBe('Update existing records in the tasks table.');
    expect(updateTool.inputJsonSchema).toHaveProperty("properties");
    expect((updateTool.inputJsonSchema as any).properties).toHaveProperty("records");
  });

  it('should work for valid input', async () => {
    const updateTool = makeUpdateTool(tasksTableClient);

    // Create a record first
    const [created] = await tasksTableClient.createRecords([
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

describe.skipIf(!hasApiKey)('MCP Tool - Get Tool', () => {
  let tasksTableClient: ReturnType<typeof testBaseClient>['tasksTableClient'];
  let resetBaseData: ReturnType<typeof testBaseClient>['resetBaseData'];

  beforeEach(async () => {
    const client = testBaseClient();
    tasksTableClient = client.tasksTableClient;
    resetBaseData = client.resetBaseData;
    await resetBaseData();
  });

  it('should create a get tool with the correct metadata', () => {
    const getTool = makeGetTool(tasksTableClient);
    expect(getTool.name).toBe("get-record-from-tasks-table");
    expect(getTool.description).toBe('Get a single record by ID from the tasks table.');
    expect(getTool.inputJsonSchema).toHaveProperty("properties");
    expect((getTool.inputJsonSchema as any).properties).toHaveProperty("recordId");
  });

  it('should work for valid input', async () => {
    const getTool = makeGetTool(tasksTableClient);
    const [created] = await tasksTableClient.createRecords([
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

describe.skipIf(!hasApiKey)('MCP Tool - List Tool', () => {
  let tasksTableClient: ReturnType<typeof testBaseClient>['tasksTableClient'];

  beforeEach(() => {
    const client = testBaseClient();
    tasksTableClient = client.tasksTableClient;
  });

  it('should create a list tool with the correct metadata', () => {
    const listTool = makeListTool(tasksTableClient);
    expect(listTool.name).toBe("list-records-from-Users-table");
    expect(listTool.description).toBe('List records from the Users table with optional filtering and pagination.');
    expect(listTool.inputJsonSchema).toHaveProperty("properties");
  });

  it('should work for valid input with no options', async () => {
    const listTool = makeListTool(tasksTableClient);
    const validInput = {};
    const result = await listTool.execute(validInput);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("fields");
    expect(result[0]).toHaveProperty("createdTime");
  });

  it('should work with filtering options', async () => {
    const listTool = makeListTool(tasksTableClient);
    const validInput = {
      options: {
        filterByFormula: `{dueDate} = "2025-01-05"`,
        maxRecords: 10,

      },
    };
    const result = await listTool.execute(validInput);

    expect(result.length).toBe(1);
    expect(result[0].fields.name).toBe("Setup development environment")
  });
});

describe.skipIf(!hasApiKey)('MCP Tool - Delete Tool', () => {
  let tasksTableClient: ReturnType<typeof testBaseClient>['tasksTableClient'];
  let resetBaseData: ReturnType<typeof testBaseClient>['resetBaseData'];

  beforeEach(async () => {
    const client = testBaseClient();
    tasksTableClient = client.tasksTableClient;
    resetBaseData = client.resetBaseData;
    await resetBaseData();
  });

  it('should create a delete tool with the correct metadata', () => {
    const deleteTool = makeDeleteTool(tasksTableClient);
    expect(deleteTool.name).toBe("delete-records-from-tasks-table");
    expect(deleteTool.description).toContain("Delete records by ID from the tasks table");
    expect(deleteTool.inputJsonSchema).toHaveProperty("properties");
    expect((deleteTool.inputJsonSchema as any).properties).toHaveProperty("recordIds");
  });

  it('should work for valid input', async () => {
    const deleteTool = makeDeleteTool(tasksTableClient);
    const nRecordsBefore = (await tasksTableClient.listRecords({ fields: ["name"] })).length

    const created = await tasksTableClient.createRecords([
      { name: "Delete Me 1" },
      { name: "Delete Me 2" },
    ]);
    const recordIds = created.map((r) => r.id);
    const result = await deleteTool.execute({ recordIds });

    expect(result).toEqual(recordIds);

    const nRecordsAfter = (await tasksTableClient.listRecords({ fields: ["name"] })).length
    expect(nRecordsAfter).toBe(nRecordsBefore);
  });
});
