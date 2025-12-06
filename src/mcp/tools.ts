/**
 * MCP tools for Airtable operations - per-table typed tools
 */

import type { RecordId, TableSchema } from '../types.ts';
import { type TableClient } from '../client/table-client.ts';
import { type RecordRead, type RecordWrite } from '../records/converters.ts';
import * as z4 from 'zod/v4';
import { makeRecordWriteValidator } from '../validators/schema-to-zod.ts';
import { toIdentifier } from '../codegen/identifiers.ts';
import { RecordIdSchema } from '../validators/index.ts';
import { TIMEZONES } from '../fields/timezones.ts';
import { ListRecordsOptions, ListRecordsResponse, UpdateRecordsOptions, UpdateRecordsResponse } from '../records/api.ts';

export interface MCPToolDefinition<TInput = any, TOutput = any> {
  /**Must start with a letter or an underscore. Must be alphameric (a-z, A-Z, 0-9), underscores (_), dots (.), colons (:), or dashes (-), with a maximum length of 64 */
  name: string;
  description: string;
  zodInputValidator: z4.ZodType<TInput>;
  inputJsonSchema: object;
  execute: (input: TInput) => Promise<TOutput>;
}

type CreateInput<T extends TableSchema> = {
  records: ReadonlyArray<RecordWrite<T["fields"][number]>>;
};
type CreateToolResult<T extends TableSchema> = Array<{
  id: RecordId;
  createdTime: string;
  fields: RecordRead<T["fields"][number]>;
  url: string;
}>;
export function makeCreateTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<CreateInput<T>, CreateToolResult<T>> {
  const recordSchema = makeRecordWriteValidator(client.tableSchema.fields);
  const zodInputValidator = z4.object({ records: z4.array(recordSchema) });
  async function execute(input: CreateInput<T>) {
    const validated = zodInputValidator.parse(input);
    const createRecords = await client.createMany(validated.records as RecordWrite<T["fields"][number]>[]);
    return createRecords.map((r) => ({
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
    fields: Partial<RecordWrite<T["fields"][number]>>;
  }>;
  options?: UpdateRecordsOptions<T["fields"][number]>;
};
export function makeUpdateTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<UpdateInput<T>, UpdateRecordsResponse<T["fields"][number]>> {
  const fieldsZod = makeRecordWriteValidator(client.tableSchema.fields);
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
    name: `update-records-in-${toIdentifier(client.tableSchema.name)}-table`,
    description: `Update existing records in the ${client.tableSchema.name} table.`,
    zodInputValidator: zodInputValidator as any,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}

const GetInput = z4.object({
  recordId: RecordIdSchema,
  options: z4.object({
    cellFormat: z4.enum(['json', 'string']).optional(),
    returnFieldsByFieldId: z4.boolean().optional(),
  }).optional(),
});
type GetInput = z4.infer<typeof GetInput>;
type GetToolResult<T extends TableSchema> = {
  id: string;
  createdTime: string;
  fields: RecordRead<T["fields"][number]>;
  url: string;
};
export function makeGetTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<GetInput, GetToolResult<T>> {
  async function execute(input: GetInput) {
    const validated = GetInput.parse(input);
    const raw = await client.get(validated.recordId, validated.options);
    return {
      ...raw,
      url: `https://airtable.com/${client.baseId}/${client.tableSchema.id}/${raw.id}`,
    };
  }
  return {
    name: `get-record-from-${toIdentifier(client.tableSchema.name)}-table`,
    description: `Get a single record by ID from the ${client.tableSchema.name} table.`,
    zodInputValidator: GetInput as any,
    inputJsonSchema: z4.toJSONSchema(GetInput),
    execute,
  };
}

type ListInput<T extends TableSchema> = {
  options?: ListRecordsOptions<T["fields"][number]>;
};
export function makeListTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<ListInput<T>, ListRecordsResponse<T["fields"][number]>> {
  const availableFieldNames = client.tableSchema.fields.map((f) => f.name);
  const zodInputValidator = z4.object({
    options: z4.object({
      timeZone: z4.enum(TIMEZONES).optional(),
      userLocale: z4.string().optional(),
      maxRecords: z4.int().min(1).optional(),
      view: z4.string().optional(),
      sort: z4.array(z4.object({
        field: z4.enum(availableFieldNames),
        direction: z4.enum(['asc', 'desc']).optional(),
      })).optional(),
      filterByFormula: z4.string().optional().describe(filterFormulaDescription),
      cellFormat: z4.enum(['json', 'string']).optional(),
      fields: z4.array(z4.enum(availableFieldNames)).optional().describe(
        'If provided, only these fields will be included in the returned records.'
      ),
      recordMetadata: z4.array(z4.enum(['commentCount'])).optional(),
    }).optional(),
  });
  async function execute(input: ListInput<T>) {
    const validated = zodInputValidator.parse(input);
    const rawRecords = await client.list(validated.options);
    return rawRecords.map((rec) => ({
      ...rec,
      url: `https://airtable.com/${client.baseId}/${client.tableSchema.id}/${rec.id}`,
    }));
  }
  return {
    name: `list-records-from-${toIdentifier(client.tableSchema.name)}-table`,
    description: `List records from the ${client.tableSchema.name} table with optional filtering and pagination.`,
    zodInputValidator: zodInputValidator,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}

const DeleteInput = z4.object({
  recordIds: z4.array(RecordIdSchema).min(1).readonly(),
});
type DeleteInput = z4.infer<typeof DeleteInput>;
type DeleteToolResult = RecordId[];
export function makeDeleteTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<DeleteInput, DeleteToolResult> {
  async function execute(input: DeleteInput) {
    const validated = DeleteInput.parse(input);
    const raw = await client.delete(validated.recordIds);
    return raw.records.map((r) => r.id);
  }
  return {
    name: `delete-records-from-${toIdentifier(client.tableSchema.name)}-table`,
    description: `Delete records by ID from the ${client.tableSchema.name} table.
    
    Returns the list of deleted record IDs.`,
    zodInputValidator: DeleteInput as any,
    inputJsonSchema: z4.toJSONSchema(DeleteInput),
    execute,
  };
}

const filterFormulaDescription = `A formula used to filter records. The formula will be evaluated for each record, and if the result is not 0, false, "", NaN, [], or #Error! the record will be included in the response.

If combined with the view parameter, only records in that view which satisfy the formula will be returned.

Formulas should reference fields by their names in braces, eg '{Number of Guests} > 3'`