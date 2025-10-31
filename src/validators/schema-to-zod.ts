/**
 * Runtime conversion of Airtable field schemas to Zod validators
 * This is used by the MCP server for runtime validation
 */

import * as z4 from "zod/v4";
import { type FieldSchema } from "../types.ts";
import { fieldSchemaToZod, type inferZod } from "./field-to-zod.ts";

export type ZodForWriteRecord<T extends readonly FieldSchema[]> = z4.ZodObject<
  {
    [K in T[number]as K["name"]]: z4.core.$ZodOptional<inferZod<K>>;
  },
  z4.core.$strict
>;

/**
 * Create a Zod schema for writing (creating/updating) a single record.
 */
export function makeZodForWriteRecord<T extends readonly FieldSchema[]>(fields: T): ZodForWriteRecord<T> {
  const shape = Object.fromEntries(
    fields.map((field) => [field.name, fieldSchemaToZod(field).optional()] as const)
  ) as unknown as {
      [K in T[number]as K["name"]]: z4.core.$ZodOptional<inferZod<K>>;
    };
  const validator = z4.strictObject(shape);
  return validator;
}