/**
 * Runtime conversion of Airtable field schemas to Zod validators
 * This is used by the MCP server for runtime validation
 */

import { z } from "zod";
import type { FieldSchema } from "../schema/fields.ts";
import { fieldSchemaToZod } from "./field-to-zod.ts";

/**
 * Create a Zod schema for record creation
 */
export function makeZodForCreate(fields: readonly FieldSchema[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.name] = fieldSchemaToZod(field).optional();
  }
  return z.array(z.object(shape));
}

/**
 * Create a Zod schema for record updates
 */
export function makeZodForUpdate(fields: readonly FieldSchema[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.name] = fieldSchemaToZod(field).optional();
  }
  return z.array(z.object(shape));
}