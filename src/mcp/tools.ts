/**
 * MCP tools for Airtable operations - per-table typed tools
 */

import type { TableSchema } from '../types.ts';
import {
  type TableClient,
  type CreateArgs,
  CreateResult,
  type UpdateRecordsOptions,
  type UpdateRecordsResponse,
  type ListRecordsOptions,
  type ListRecordsResponse,
  type GetRecordOptions,
  type DeleteRecordsResponse,
} from '../client/table-client.ts';
import { type WriteRecord, type ReadRecordByName } from '../client/converters.ts';
import * as z4 from 'zod/v4';
import { makeZodForWriteRecord } from '../validators/schema-to-zod.ts';
import { toIdentifier } from '../codegen/identifiers.ts';
import { RecordIdSchema } from '../validators/index.ts';
import { TIMEZONES } from '../fields/timezones.ts';

export interface MCPToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  zodInputValidator: z4.ZodType<TInput>;
  inputJsonSchema: object;
  execute: (input: TInput) => Promise<TOutput>;
}

type CreateInput<T extends TableSchema> = {
  records: CreateArgs<T["fields"]>;
};

type CreateToolResult<T extends TableSchema["fields"]> = Array<
  CreateResult<T>[number] & { url: string; }
>;

export function makeCreateTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<CreateInput<T>, CreateToolResult<T["fields"]>> {
  const recordSchema = makeZodForWriteRecord(client.tableSchema.fields);
  const zodInputValidator = z4.object({ records: z4.array(recordSchema) });
  async function execute(input: CreateInput<T>) {
    const validated = zodInputValidator.parse(input);
    const createdRecords = await client.create(validated.records as WriteRecord<T["fields"]>[]);
    return createdRecords.map((r) => ({
      ...r,
      // include the URL so the bot can share it with the user
      "url": `https://airtable.com/${client.baseId}/${client.tableSchema.id}/${r.id}`,
    }));
  }
  let description = "";
  if (client.tableSchema.description) {
    description += `\n\nThe table has the description:\n${client.tableSchema.description}`;
  }
  return {
    name: `create-records-in-${toIdentifier(client.tableSchema.name)}-table`,
    description: `Insert new records into the ${client.tableSchema.name} table.${description}

Note that the input does NOT use the same format as the Airtable API.
Look carefully at the input schema to see how to structure the records to create.

If you use this, consider giving the user the URLs of the created records in your final answer.
`,
    zodInputValidator: zodInputValidator as any,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}

type UpdateInput<T extends TableSchema> = {
  records: Array<{
    id?: string;
    fields: Partial<WriteRecord<T["fields"]>>;
  }>;
  options?: UpdateRecordsOptions;
};

export function makeUpdateTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<UpdateInput<T>, UpdateRecordsResponse<T["fields"]>> {
  const fieldsZod = makeZodForWriteRecord(client.tableSchema.fields);
  const recordZod = z4.object({
    id: RecordIdSchema.optional(),
    fields: fieldsZod,
  });
  const zodInputValidator = z4.object({
    records: z4.array(recordZod),
    options: z4.object({
      performUpsert: z4.object({
        fieldsToMergeOn: z4.array(z4.string()).min(1).max(3),
      }).optional(),
      returnFieldsByFieldId: z4.boolean().optional(),
      typecast: z4.boolean().optional(),
      destructive: z4.boolean().optional(),
    }).optional(),
  });
  async function execute(input: UpdateInput<T>) {
    const validated = zodInputValidator.parse(input);
    const result = await client.update(validated.records as any, validated.options);
    return result;
  }
  return {
    name: `Update ${client.tableSchema.name}`,
    description: `Update existing records in the ${client.tableSchema.name} table.`,
    zodInputValidator: zodInputValidator as any,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}

type GetInput = {
  recordId: string;
  options?: GetRecordOptions;
};

export function makeGetTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<GetInput, { id: string; createdTime: string; fields: ReadRecordByName<T["fields"]> }> {
  const zodInputValidator = z4.object({
    recordId: RecordIdSchema,
    options: z4.object({
      cellFormat: z4.enum(['json', 'string']).optional(),
      returnFieldsByFieldId: z4.boolean().optional(),
    }).optional(),
  });
  async function execute(input: GetInput) {
    const validated = zodInputValidator.parse(input);
    const result = await client.get(validated.recordId, validated.options);
    return result;
  }
  return {
    name: `Get from ${client.tableSchema.name}`,
    description: `Get a single record by ID from the ${client.tableSchema.name} table.`,
    zodInputValidator: zodInputValidator as any,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}

type ListInput<T extends TableSchema> = {
  options?: ListRecordsOptions<T["fields"]>;
};

export function makeListTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<ListInput<T>, ListRecordsResponse<T["fields"]>> {
  const zodInputValidator = z4.object({
    options: z4.object({
      timeZone: z4.enum(TIMEZONES).optional(),
      userLocale: z4.string().optional(),
      pageSize: z4.number().int().min(1).max(100).optional(),
      maxRecords: z4.number().int().min(1).optional(),
      offset: z4.string().optional(),
      view: z4.string().optional(),
      sort: z4.array(z4.object({
        field: z4.string(),
        direction: z4.enum(['asc', 'desc']).optional(),
      })).optional(),
      filterByFormula: z4.string().optional(),
      cellFormat: z4.enum(['json', 'string']).optional(),
      fields: z4.array(z4.string()).optional(),
      returnFieldsByFieldId: z4.boolean().optional(),
      recordMetadata: z4.array(z4.enum(['commentCount'])).optional(),
    }).optional(),
  });
  async function execute(input: ListInput<T>) {
    const validated = zodInputValidator.parse(input);
    const result = await client.list(validated.options);
    return result;
  }
  return {
    name: `List ${client.tableSchema.name}`,
    description: `List records from the ${client.tableSchema.name} table with optional filtering and pagination.`,
    zodInputValidator: zodInputValidator as any,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}

type DeleteInput = {
  recordIds: string[];
};

export function makeDeleteTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<DeleteInput, DeleteRecordsResponse> {
  const zodInputValidator = z4.object({
    recordIds: z4.array(RecordIdSchema).min(1).max(10),
  });
  async function execute(input: DeleteInput) {
    const validated = zodInputValidator.parse(input);
    const result = await client.delete(validated.recordIds);
    return result;
  }
  return {
    name: `Delete from ${client.tableSchema.name}`,
    description: `Delete records by ID from the ${client.tableSchema.name} table.`,
    zodInputValidator: zodInputValidator as any,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}