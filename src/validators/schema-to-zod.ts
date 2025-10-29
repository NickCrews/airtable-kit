/**
 * Runtime conversion of Airtable field schemas to Zod validators
 * This is used by the MCP server for runtime validation
 */

import { z } from "zod";
import type { FieldSchema } from "../schema/fields.js";
import { fieldSchemaToZod } from "./field-to-zod.js";

/**
 * Create a Zod schema for record creation
 */
export function createRecordSchemaFromFields(fields: readonly FieldSchema[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.name] = fieldSchemaToZod(field).optional();
  }
  return z.object(shape);
}

/**
 * Create a Zod schema for record updates
 */
export function updateRecordSchemaFromFields(
  fields: readonly FieldSchema[],
): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.name] = fieldSchemaToZod(field).optional();
  }
  return z.object(shape);
}