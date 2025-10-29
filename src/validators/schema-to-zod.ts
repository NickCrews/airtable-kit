/**
 * Runtime conversion of Airtable field schemas to Zod validators
 * This is used by the MCP server for runtime validation
 */

import { z } from "zod";
import type { FieldSchema } from "../schema/fields.js";

/**
 * Convert a field schema to a Zod schema at runtime
 */
export function fieldSchemaToZod(field: FieldSchema): z.ZodTypeAny {
  switch (field.type) {
    case "singleLineText":
    case "multilineText":
    case "richText":
    case "phoneNumber":
      return z.string();

    case "email":
      return z.string().email();

    case "url":
      return z.string().url();

    case "number":
    case "percent":
    case "currency":
    case "duration":
    case "rating":
    case "autoNumber":
    case "count":
      return z.number();

    case "checkbox":
      return z.boolean();

    case "date":
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

    case "dateTime":
    case "createdTime":
    case "lastModifiedTime":
      return z.string().datetime();

    case "singleSelect":
      if (field.options?.choices && field.options.choices.length > 0) {
        const values = field.options.choices.map((c) => c.name) as [
          string,
          ...string[],
        ];
        return z.enum(values);
      }
      return z.string();

    case "multipleSelects":
      if (field.options?.choices && field.options.choices.length > 0) {
        const values = field.options.choices.map((c) => c.name) as [
          string,
          ...string[],
        ];
        return z.array(z.enum(values));
      }
      return z.array(z.string());

    case "multipleAttachments":
      return z.array(AttachmentSchema);

    case "multipleRecordLinks":
      return z.array(z.string());

    case "createdBy":
    case "lastModifiedBy":
      return CollaboratorSchema;

    case "barcode":
      return BarcodeSchema;

    case "button":
      return ButtonSchema;

    case "formula":
      if (field.options?.result) {
        // Recursively handle formula result type
        // Note: FieldOptions.result doesn't have a 'type' property, we infer it
        const resultType = field.options.result.precision !== undefined
          ? "number"
          : "singleLineText";
        const resultField: FieldSchema = {
          ...field,
          type: resultType as any,
          options: field.options.result,
        };
        return fieldSchemaToZod(resultField);
      }
    case "rollup":
      return z.unknown();

    case "multipleLookupValues":
      return z.array(z.unknown());

    default:
      return z.unknown();
  }
}

/**
 * Convert an array of field schemas to a Zod object schema
 */
export function fieldSchemasToZodObject(
  fields: readonly FieldSchema[],
  primaryFieldId?: string,
): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const zodSchema = fieldSchemaToZod(field);
    const isRequired = field.id === primaryFieldId;
    shape[field.name] = isRequired ? zodSchema : zodSchema.optional();
  }

  return z.object(shape);
}

/**
 * Create a Zod schema for record creation (excludes computed fields)
 */
export function createRecordSchemaFromFields(
  fields: readonly FieldSchema[],
  primaryFieldId?: string,
): z.ZodObject<any> {
  const computedTypes = [
    "formula",
    "rollup",
    "lookup",
    "multipleLookupValues",
    "createdTime",
    "lastModifiedTime",
    "createdBy",
    "lastModifiedBy",
    "autoNumber",
    "count",
  ];

  const writableFields = fields.filter((f) => !computedTypes.includes(f.type));
  return fieldSchemasToZodObject(writableFields, primaryFieldId);
}

/**
 * Create a Zod schema for record updates (all fields optional, excludes computed)
 */
export function updateRecordSchemaFromFields(
  fields: readonly FieldSchema[],
): z.ZodObject<any> {
  const computedTypes = [
    "formula",
    "rollup",
    "lookup",
    "multipleLookupValues",
    "createdTime",
    "lastModifiedTime",
    "createdBy",
    "lastModifiedBy",
    "autoNumber",
    "count",
  ];

  const writableFields = fields.filter((f) => !computedTypes.includes(f.type));
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of writableFields) {
    shape[field.name] = fieldSchemaToZod(field).optional();
  }

  return z.object(shape);
}

// Common Zod schemas for complex types
const AttachmentSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  filename: z.string(),
  size: z.number(),
  type: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnails: z
    .object({
      small: z.object({
        url: z.string().url(),
        width: z.number(),
        height: z.number(),
      }),
      large: z.object({
        url: z.string().url(),
        width: z.number(),
        height: z.number(),
      }),
      full: z.object({
        url: z.string().url(),
        width: z.number(),
        height: z.number(),
      }),
    })
    .optional(),
});

const CollaboratorSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

const BarcodeSchema = z.object({
  text: z.string(),
  type: z.string().optional(),
});

const ButtonSchema = z.object({
  label: z.string(),
  url: z.string().url().optional(),
});
