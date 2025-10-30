import { describe, it, expect, beforeEach } from 'vitest';
import { makeCreateTool } from './index.ts';
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
    expect(createTool.name).toBe('Insert into users');
    expect(createTool.description).toBe('Insert new records into the users table.');
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
        "Email": "alice.smith@example.com",
        "Full Name": "alice smith",
        "Phone": "907-555-1234",
        "id": "rec123",
      },
    ]
    );
  });
});