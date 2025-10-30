/**
 * MCP tools for Airtable operations - per-table typed tools
 */

import type { TableSchema } from '../schema/tables.ts';
import { type TableClient, type CreateArgs, CreateResult } from '../client/table-client.ts';
import { type WriteRecord } from '../client/converters.ts';
import { z } from 'zod';
import {
  makeZodForCreate,
  makeZodForUpdate,
} from '../validators/schema-to-zod.ts';

export interface MCPToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  zodInputValidator: z.ZodType<unknown, TInput>;
  inputJsonSchema: object;
  execute: (input: TInput) => Promise<TOutput>;
}

type CreateInput<T extends TableSchema> = {
  records: CreateArgs<T["fields"]>;
};

export function makeCreateTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<CreateInput<T>, CreateResult<T["fields"]>> {
  const recordsZod = makeZodForCreate(client.tableSchema.fields);
  const zodInputValidator = z.object({ records: recordsZod });
  async function execute(input: CreateInput<T>) {
    const validated = zodInputValidator.parse(input);
    const createdRecords = await client.create(validated.records as WriteRecord<T["fields"]>[]);
    return createdRecords;
  }
  return {
    name: `Insert into ${client.tableSchema.name}`,
    description: `Insert new records into the ${client.tableSchema.name} table.`,
    zodInputValidator: zodInputValidator as any,
    inputJsonSchema: z.toJSONSchema(zodInputValidator),
    execute,
  };
}