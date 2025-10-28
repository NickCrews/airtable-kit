/**
 * Test utilities and mocks for airtable-kit
 */

import type { BaseSchema, FieldSchema, TableSchema } from "../schema/types.js";
import type {
  FieldSpec,
  SelectChoice,
  SelectColor,
} from "../schema/field-types.js";

/**
 * Helper to create a SelectOption
 */
export function createSelectOption(
  name: string,
  color: SelectColor = "grayLight1",
): SelectChoice {
  return {
    id: `sel${Math.random().toString(36).slice(2, 10)}`,
    name,
    color,
  };
}

/**
 * Helper to create multiple SelectOptions from names
 */
export function createSelectOptions(
  names: string[],
  color: SelectColor = "grayLight1",
): SelectChoice[] {
  return names.map((name) => createSelectOption(name, color));
}

/**
 * Mock Airtable API responses
 */
export const mockFetch = (responses: Map<string, any>) => {
  return async (url: string, options?: RequestInit): Promise<Response> => {
    const key = `${options?.method || "GET"} ${url}`;
    const response = responses.get(key);

    if (!response) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
};

/**
 * Create mock field schema
 */
export function createMockField(
  id: string,
  name: string,
  type: string,
  options?: Record<string, any>,
): FieldSchema {
  return {
    id,
    name,
    type,
    ...options,
  } as FieldSchema;
}

/**
 * Create mock table schema
 */
export function createMockTable(
  id: string,
  name: string,
  fields: FieldSchema[],
): TableSchema {
  return {
    id,
    name,
    description: `Mock table ${name}`,
    primaryFieldId: fields[0]?.id || "fld1",
    fields,
    views: [],
  };
}

/**
 * Create mock base schema
 */
export function createMockBase(
  id: string,
  tables: TableSchema[],
): BaseSchema {
  return {
    id,
    tables,
  };
}

/**
 * Sample base schema for testing
 */
export function createSampleBaseSchema(): BaseSchema {
  const tasksTable = createMockTable("tblTasks", "Tasks", [
    createMockField("fldName", "Name", "singleLineText"),
    createMockField("fldStatus", "Status", "singleSelect", {
      options: {
        choices: [
          { id: "selTodo", name: "Todo", color: "blueLight2" },
          { id: "selInProgress", name: "In Progress", color: "yellowLight2" },
          { id: "selDone", name: "Done", color: "greenLight2" },
        ],
      },
    }),
    createMockField("fldPriority", "Priority", "number", { precision: 0 }),
    createMockField("fldDueDate", "Due Date", "date"),
    createMockField("fldCompleted", "Completed", "checkbox"),
    createMockField("fldNotes", "Notes", "multilineText"),
    createMockField("fldTags", "Tags", "multipleSelects", {
      options: {
        choices: [
          { id: "selUrgent", name: "Urgent", color: "redLight2" },
          { id: "selImportant", name: "Important", color: "orangeLight2" },
        ],
      },
    }),
  ]);

  const usersTable = createMockTable("tblUsers", "Users", [
    createMockField("fldEmail", "Email", "email"),
    createMockField("fldFullName", "Full Name", "singleLineText"),
    createMockField("fldPhone", "Phone", "phoneNumber"),
  ]);

  return createMockBase("appTestBase123", [tasksTable, usersTable]);
}

/**
 * Mock Airtable record
 */
export function createMockRecord<T = Record<string, any>>(
  id: string,
  fields: T,
): { id: string; createdTime: string; fields: T } {
  return {
    id,
    createdTime: new Date().toISOString(),
    fields,
  };
}

/**
 * Mock list records response
 */
export function createMockListResponse<T = Record<string, any>>(
  records: Array<{ id: string; createdTime: string; fields: T }>,
  offset?: string,
) {
  return {
    records,
    offset,
  };
}
