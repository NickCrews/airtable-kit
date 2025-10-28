/**
 * MCP tools for Airtable operations - per-table typed tools
 */

import type { BaseSchema } from '../schema/bases.ts';
import type { TableSchema, TableId } from '../schema/tables.ts';
import { z } from 'zod';
import {
  fieldSchemasToZodObject,
  createRecordSchemaFromFields,
  updateRecordSchemaFromFields,
} from '../validators/schema-to-zod.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
}

export interface MCPToolExecutor<TInput = any, TOutput = any> {
  definition: MCPToolDefinition;
  execute: (input: TInput) => Promise<TOutput>;
}

export interface TableMCPTools<TTable extends TableSchema = TableSchema> {
  insert: MCPToolExecutor;
  update: MCPToolExecutor;
  read: MCPToolExecutor;
  delete: MCPToolExecutor;
}

/**
 * Create typed MCP tools for a specific table
 *
 * @example
 * ```typescript
 * const tools = createMCPTools({
 *   baseSchema,
 *   tableId: 'tblTasks',
 *   execute: async (operation, data) => {
 *     // Your implementation here
 *     return client[operation](baseSchema.id, tableId, data);
 *   }
 * });
 *
 * // Use the tools
 * await tools.insert.execute({ fields: { Name: 'Task 1' } });
 * await tools.read.execute({ recordId: 'rec123' });
 * ```
 */
export function createMCPTools<
  TBaseSchema extends BaseSchema,
  TTableId extends TableId
>(options: {
  baseSchema: TBaseSchema;
  tableId: TTableId;
  execute: (operation: 'insert' | 'update' | 'read' | 'delete', data: any) => Promise<any>;
}): TableMCPTools {
  const { baseSchema, tableId, execute } = options;

  // Find the table in the schema
  const table = baseSchema.tables.find((t) => t.id === tableId);
  if (!table) {
    throw new Error(`Table ${tableId} not found in base schema`);
  }

  const tableName = table.name;

  // Generate zod schemas for this table
  const createSchema = createRecordSchemaFromFields(table.fields as any, table.primaryFieldId);
  const updateSchema = updateRecordSchemaFromFields(table.fields as any);
  const readSchema = z.object({
    recordId: z.string().describe('Record ID to fetch'),
  });
  const deleteSchema = z.object({
    recordId: z.string().describe('Record ID to delete'),
  });

  // Create insert tool
  const insert: MCPToolExecutor = {
    definition: {
      name: `${tableName.toLowerCase().replace(/\s+/g, '_')}_insert`,
      description: `Insert a new record into the ${tableName} table`,
      inputSchema: z.object({
        fields: createSchema,
      }),
    },
    execute: async (input) => {
      return execute('insert', { tableId, fields: input.fields });
    },
  };

  // Create update tool
  const update: MCPToolExecutor = {
    definition: {
      name: `${tableName.toLowerCase().replace(/\s+/g, '_')}_update`,
      description: `Update an existing record in the ${tableName} table`,
      inputSchema: z.object({
        recordId: z.string().describe('Record ID to update'),
        fields: updateSchema,
      }),
    },
    execute: async (input) => {
      return execute('update', { tableId, recordId: input.recordId, fields: input.fields });
    },
  };

  // Create read tool
  const read: MCPToolExecutor = {
    definition: {
      name: `${tableName.toLowerCase().replace(/\s+/g, '_')}_read`,
      description: `Read a record from the ${tableName} table by ID`,
      inputSchema: readSchema,
    },
    execute: async (input) => {
      return execute('read', { tableId, recordId: input.recordId });
    },
  };

  // Create delete tool
  const deleteTool: MCPToolExecutor = {
    definition: {
      name: `${tableName.toLowerCase().replace(/\s+/g, '_')}_delete`,
      description: `Delete a record from the ${tableName} table`,
      inputSchema: deleteSchema,
    },
    execute: async (input) => {
      return execute('delete', { tableId, recordId: input.recordId });
    },
  };

  return {
    insert,
    update,
    read,
    delete: deleteTool,
  };
}
