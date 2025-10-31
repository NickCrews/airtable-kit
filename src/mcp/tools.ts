/**
 * MCP tools for Airtable operations - per-table typed tools
 */

import type { TableSchema } from '../types.ts';
import { type TableClient, type CreateArgs, CreateResult } from '../client/table-client.ts';
import { type WriteRecord } from '../client/converters.ts';
import * as z4 from 'zod/v4';
import { makeZodForWrite } from '../validators/schema-to-zod.ts';
import { toIdentifier } from '../codegen/identifiers.ts';

export interface MCPToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  zodInputValidator: z4.ZodType<TInput, any>;
  inputJsonSchema: object;
  execute: (input: TInput) => Promise<TOutput>;
}

type CreateInput<T extends TableSchema> = {
  records: CreateArgs<T["fields"]>;
};

type CreateToolResult<T extends TableSchema["fields"]> = {
  record: CreateResult<T>[number];
  url: string;
}[];

export function makeCreateTool<
  T extends TableSchema,
>(client: TableClient<T>): MCPToolDefinition<CreateInput<T>, CreateToolResult<T["fields"]>> {
  const recordsZod = makeZodForWrite(client.tableSchema.fields);
  const zodInputValidator = z4.object({ records: recordsZod });
  async function execute(input: CreateInput<T>) {
    const validated = zodInputValidator.parse(input);
    const createdRecords = await client.create(validated.records as WriteRecord<T["fields"]>[]);
    return createdRecords.map((r) => ({
      "record": r,
      // include the URL so the bot can share it with the user
      "url": `https://airtable.com/${client.baseId}/${client.tableSchema.id}/${r.id}`,
    }));
  }
  let description = "";
  if (client.tableSchema.description) {
    description += `\n\nThe table has the description:\n${client.tableSchema.description}`;
  }
  return {
    name: `create-records-in-${toIdentifier(client.tableSchema.name)}`,
    description: `Insert new records into the ${client.tableSchema.name} table.${description}

Note that the input does NOT use the same format as the Airtable API.
Look carefully at the input schema to see how to structure the records to create.

If you use this, consider giving the user the URLs of the created records in your final answer.
`,
    zodInputValidator: zodInputValidator as z4.ZodType<CreateInput<T>, any>,
    inputJsonSchema: z4.toJSONSchema(zodInputValidator),
    execute,
  };
}