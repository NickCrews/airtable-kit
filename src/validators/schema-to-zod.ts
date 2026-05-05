/**
 * Runtime conversion of Airtable field schemas to Zod validators
 * This is used by the MCP server for runtime validation
 */

import * as z4 from "zod/v4";
import { makeFieldWriteValidator, type InferFieldWriteValidator } from "./field-to-zod.ts";
import { FieldSchemaRead } from "../fields/types.ts";

/**
 * Inferred TypeScript type of the Zod schema returned by {@link makeRecordWriteValidator}
 */
export type InferRecordWriteValidator<T extends readonly FieldSchemaRead[]> = z4.ZodObject<
  {
    [K in T[number]as K["name"]]: z4.core.$ZodOptional<InferFieldWriteValidator<K>>;
  },
  z4.core.$strict
>;

/**
 * Given an array of {@link FieldSchema} objects, make a Zod schema for writing (creating/updating) a single record.
 *
 * This uses {@link makeFieldWriteValidator} to make a validator for each field.
 *
 * See {@link InferRecordWriteValidator} for the inferred TypeScript type of the resulting Zod schema.
 */
export function makeRecordWriteValidator<T extends readonly FieldSchemaRead[]>(fields: T): InferRecordWriteValidator<T> {
  const shape = Object.fromEntries(
    fields.map((field) => [field.name, makeFieldWriteValidator(field).optional()] as const)
  ) as unknown as {
      [K in T[number]as K["name"]]: z4.core.$ZodOptional<InferFieldWriteValidator<K>>;
    };
  const validator = z4.strictObject(shape);
  return validator;
}