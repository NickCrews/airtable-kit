/**
 * Runtime conversion of Airtable field schemas to Zod validators
 * This is used by the MCP server for runtime validation
 */

import * as z4 from "zod/v4";
import { type FieldSchema } from "../types.ts";
import { fieldSchemaToZod } from "./field-to-zod.ts";
import { CreateArgs } from "../client/table-client.ts";
import { inferWrite } from "../client/converters.ts";

/**
 * Create a Zod schema for writing (creating/updating) records
 */
export function makeZodForWrite<T extends readonly FieldSchema[]>(fields: T) {
  const shape: Record<T[number]["name"], z4.ZodType<inferWrite<T[number]>>> = Object.fromEntries(
    fields.map((field) => {
      return [field.name as inferWrite<typeof field>, fieldSchemaToZod(field).optional()] as const;
    })
  );
  return z4.array(z4.strictObject(shape)) as z4.ZodType<CreateArgs<T>>;
}
