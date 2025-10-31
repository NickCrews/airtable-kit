import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeCreateTool,
  makeUpdateTool,
  makeGetTool,
  makeListTool,
  makeDeleteTool,
} from './index.ts';
import taskBaseSchema from '../tests/taskBase.ts';
import { makeBaseClient } from '../client/base-client.ts';
import { createMockFetcher } from "../client/fetcher.ts";

describe('MCP Tool - Create Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const createTool = makeCreateTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a create tool with the correct metadata', () => {
    expect(createTool.name).toBe('create-records-in-users');
    expect(createTool.description).toMatchInlineSnapshot(`
      "Insert new records into the users table.

      Note that the input does NOT use the same format as the Airtable API.
      Look carefully at the input schema to see how to structure the records to create.

      If you use this, consider giving the user the URLs of the created records in your final answer.
      "
    `);
    expect(createTool.inputJsonSchema).toMatchInlineSnapshot(`
          {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "additionalProperties": false,
            "properties": {
              "records": {
                "items": {
                  "additionalProperties": false,
                  "properties": {
                    "Email": {
                      "format": "email",
                      "pattern": "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
                      "type": "string",
                    },
                    "Full Name": {
                      "type": "string",
                    },
                    "Phone": {
                      "description": "please include area code",
                      "type": "string",
                    },
                  },
                  "type": "object",
                },
                "type": "array",
              },
            },
            "required": [
              "records",
            ],
            "type": "object",
          }
        `);
  });
  it('should work for valid input', async () => {
    const validInput = {
      records: [
        {
          "Full Name": 'alice smith',
          Email: 'alice.smith@example.com',
          Phone: '907-555-1234',
        },
      ],
    };
    const expectedAPIInput = {
      records: [
        {
          fields: {
            fldFullName: 'alice smith',
            fldEmail: 'alice.smith@example.com',
            fldPhone: '907-555-1234',
          },
        },
      ],
      returnFieldsByFieldId: true,
    };
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec123",
          "fields": {
            "fldFullName": 'alice smith',
            "fldEmail": 'alice.smith@example.com',
            "fldPhone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    })
    const result = await createTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{ method: 'POST', path: '/appTaskBase/tblUsers', data: expectedAPIInput }]);
    expect(result).toMatchObject([
      {
        record: {
          "Email": "alice.smith@example.com",
          "Full Name": "alice smith",
          "Phone": "907-555-1234",
          "id": "rec123",
        },
        url: 'https://airtable.com/appTaskBase/tblUsers/rec123',
      },
    ]
    );
  });
});

describe('MCP Tool - Update Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const updateTool = makeUpdateTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create an update tool with the correct metadata', () => {
    expect(updateTool.name).toBe('Update users');
    expect(updateTool.description).toBe('Update existing records in the users table.');
    expect(updateTool.inputJsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "options": {
            "additionalProperties": false,
            "properties": {
              "destructive": {
                "type": "boolean",
              },
              "performUpsert": {
                "additionalProperties": false,
                "properties": {
                  "fieldsToMergeOn": {
                    "items": {
                      "type": "string",
                    },
                    "maxItems": 3,
                    "minItems": 1,
                    "type": "array",
                  },
                },
                "required": [
                  "fieldsToMergeOn",
                ],
                "type": "object",
              },
              "returnFieldsByFieldId": {
                "type": "boolean",
              },
              "typecast": {
                "type": "boolean",
              },
            },
            "type": "object",
          },
          "records": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "fields": {
                  "additionalProperties": false,
                  "properties": {
                    "Email": {
                      "format": "email",
                      "pattern": "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
                      "type": "string",
                    },
                    "Full Name": {
                      "type": "string",
                    },
                    "Phone": {
                      "description": "please include area code",
                      "type": "string",
                    },
                  },
                  "type": "object",
                },
                "id": {
                  "type": "string",
                },
              },
              "required": [
                "fields",
              ],
              "type": "object",
            },
            "type": "array",
          },
        },
        "required": [
          "records",
        ],
        "type": "object",
      }
    `);
  });
  it('should work for valid input', async () => {
    const validInput = {
      records: [
        {
          id: 'rec123',
          fields: {
            "Full Name": 'alice jones',
            Email: 'alice.jones@example.com',
          },
        },
      ],
    };
    const expectedAPIInput = {
      records: [
        {
          id: 'rec123',
          fields: {
            fldFullName: 'alice jones',
            fldEmail: 'alice.jones@example.com',
          },
        },
      ],
    };
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec123",
          "fields": {
            "Full Name": 'alice jones',
            "Email": 'alice.jones@example.com',
            "Phone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
    const result = await updateTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'PATCH',
      path: '/appTaskBase/tblUsers',
      data: expectedAPIInput
    }]);
    expect(result).toMatchObject({
      records: [
        {
          "id": "rec123",
          "fields": {
            "Email": "alice.jones@example.com",
            "Full Name": "alice jones",
            "Phone": "907-555-1234",
          },
        },
      ]
    });
  });
});

describe('MCP Tool - Get Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const getTool = makeGetTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a get tool with the correct metadata', () => {
    expect(getTool.name).toBe('Get from users');
    expect(getTool.description).toBe('Get a single record by ID from the users table.');
    expect(getTool.inputJsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "options": {
            "additionalProperties": false,
            "properties": {
              "cellFormat": {
                "enum": [
                  "json",
                  "string",
                ],
                "type": "string",
              },
              "returnFieldsByFieldId": {
                "type": "boolean",
              },
            },
            "type": "object",
          },
          "recordId": {
            "type": "string",
          },
        },
        "required": [
          "recordId",
        ],
        "type": "object",
      }
    `);
  });
  it('should work for valid input', async () => {
    const validInput = {
      recordId: 'rec123',
    };
    mockFetcher.setReturnValue({
      "id": "rec123",
      "fields": {
        "Full Name": 'alice smith',
        "Email": 'alice.smith@example.com',
        "Phone": '907-555-1234',
      },
      "createdTime": "2024-01-01T12:00:00.000Z",
    });
    const result = await getTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'GET',
      path: '/appTaskBase/tblUsers/rec123',
    }]);
    expect(result).toMatchObject({
      "id": "rec123",
      "fields": {
        "Email": "alice.smith@example.com",
        "Full Name": "alice smith",
        "Phone": "907-555-1234",
      },
      "createdTime": "2024-01-01T12:00:00.000Z",
    });
  });
});

describe('MCP Tool - List Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const listTool = makeListTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a list tool with the correct metadata', () => {
    expect(listTool.name).toBe('List users');
    expect(listTool.description).toBe('List records from the users table with optional filtering and pagination.');
    expect(listTool.inputJsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "options": {
            "additionalProperties": false,
            "properties": {
              "cellFormat": {
                "enum": [
                  "json",
                  "string",
                ],
                "type": "string",
              },
              "fields": {
                "items": {
                  "type": "string",
                },
                "type": "array",
              },
              "filterByFormula": {
                "type": "string",
              },
              "maxRecords": {
                "maximum": 9007199254740991,
                "minimum": 1,
                "type": "integer",
              },
              "offset": {
                "type": "string",
              },
              "pageSize": {
                "maximum": 100,
                "minimum": 1,
                "type": "integer",
              },
              "recordMetadata": {
                "items": {
                  "enum": [
                    "commentCount",
                  ],
                  "type": "string",
                },
                "type": "array",
              },
              "returnFieldsByFieldId": {
                "type": "boolean",
              },
              "sort": {
                "items": {
                  "additionalProperties": false,
                  "properties": {
                    "direction": {
                      "enum": [
                        "asc",
                        "desc",
                      ],
                      "type": "string",
                    },
                    "field": {
                      "type": "string",
                    },
                  },
                  "required": [
                    "field",
                  ],
                  "type": "object",
                },
                "type": "array",
              },
              "timeZone": {
                "type": "string",
              },
              "userLocale": {
                "type": "string",
              },
              "view": {
                "type": "string",
              },
            },
            "type": "object",
          },
        },
        "type": "object",
      }
    `);
  });
  it('should work for valid input with no options', async () => {
    const validInput = {};
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec123",
          "fields": {
            "Full Name": 'alice smith',
            "Email": 'alice.smith@example.com',
            "Phone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
    const result = await listTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'GET',
      path: '/appTaskBase/tblUsers',
    }]);
    expect(result).toMatchObject({
      records: [
        {
          "id": "rec123",
          "fields": {
            "Email": "alice.smith@example.com",
            "Full Name": "alice smith",
            "Phone": "907-555-1234",
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
  });
  it('should work with filtering options', async () => {
    const validInput = {
      options: {
        filterByFormula: 'Email = "alice.smith@example.com"',
        maxRecords: 10,
      }
    };
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec123",
          "fields": {
            "Full Name": 'alice smith',
            "Email": 'alice.smith@example.com',
            "Phone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
    const result = await listTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'GET',
      path: '/appTaskBase/tblUsers?maxRecords=10&filterByFormula=Email+%3D+%22alice.smith%40example.com%22',
    }]);
    expect(result).toMatchObject({
      records: [
        {
          "id": "rec123",
          "fields": {
            "Email": "alice.smith@example.com",
            "Full Name": "alice smith",
            "Phone": "907-555-1234",
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
  });
});

describe('MCP Tool - Delete Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const deleteTool = makeDeleteTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a delete tool with the correct metadata', () => {
    expect(deleteTool.name).toBe('Delete from users');
    expect(deleteTool.description).toBe('Delete records by ID from the users table.');
    expect(deleteTool.inputJsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "recordIds": {
            "items": {
              "type": "string",
            },
            "maxItems": 10,
            "minItems": 1,
            "type": "array",
          },
        },
        "required": [
          "recordIds",
        ],
        "type": "object",
      }
    `);
  });
  it('should work for valid input', async () => {
    const validInput = {
      recordIds: ['rec123', 'rec456'],
    };
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec123",
          "deleted": true,
        },
        {
          "id": "rec456",
          "deleted": true,
        }
      ]
    });
    const result = await deleteTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'DELETE',
      path: '/appTaskBase/tblUsers?records%5B%5D=rec123&records%5B%5D=rec456',
    }]);
    expect(result).toMatchObject({
      records: [
        {
          "id": "rec123",
          "deleted": true,
        },
        {
          "id": "rec456",
          "deleted": true,
        }
      ]
    });
  });
});