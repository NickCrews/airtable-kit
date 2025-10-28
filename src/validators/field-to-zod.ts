/**
 * Convert Airtable field types to Zod schemas
 */

import { z } from 'zod';
import type { FieldSchema, FieldType } from '../schema/types.js';

/**
 * Common Zod schemas for Airtable types
 */
export const AirtableSchemas = {
  attachment: z.object({
    id: z.string(),
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
    type: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    thumbnails: z
      .object({
        small: z.object({ url: z.string().url(), width: z.number(), height: z.number() }),
        large: z.object({ url: z.string().url(), width: z.number(), height: z.number() }),
        full: z.object({ url: z.string().url(), width: z.number(), height: z.number() }),
      })
      .optional(),
  }),

  collaborator: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
  }),

  barcode: z.object({
    text: z.string(),
    type: z.string().optional(),
  }),

  button: z.object({
    label: z.string(),
    url: z.string().url().optional(),
  }),
};

/**
 * Handler for custom field type conversions
 */
export type FieldTypeHandler = (field: FieldSchema) => z.ZodSchema;

/**
 * Convert a field type to a Zod schema
 */
export function fieldTypeToZod(
  field: FieldSchema,
  customHandlers?: Record<string, FieldTypeHandler>
): z.ZodSchema {
  // Check for custom handler first
  if (customHandlers?.[field.type]) {
    return customHandlers[field.type](field);
  }

  switch (field.type) {
    case 'singleLineText':
    case 'multilineText':
    case 'richText':
    case 'phoneNumber':
      return z.string();

    case 'email':
      return z.string().email();

    case 'url':
      return z.string().url();

    case 'number':
    case 'percent':
    case 'currency':
    case 'duration':
    case 'rating':
    case 'autoNumber':
    case 'count':
      return z.number();

    case 'checkbox':
      return z.boolean();

    case 'date':
      // Date format: YYYY-MM-DD
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

    case 'dateTime':
      return z.string().datetime();

    case 'singleSelect':
      if (field.options?.choices && field.options.choices.length > 0) {
        const values = field.options.choices.map((c) => c.name);
        return z.enum(values as [string, ...string[]]);
      }
      return z.string();

    case 'multipleSelects':
      if (field.options?.choices && field.options.choices.length > 0) {
        const values = field.options.choices.map((c) => c.name);
        return z.array(z.enum(values as [string, ...string[]]));
      }
      return z.array(z.string());

    case 'attachment':
      return z.array(AirtableSchemas.attachment);

    case 'multipleRecordLinks':
      return z.array(z.string());

    case 'createdBy':
    case 'lastModifiedBy':
      return AirtableSchemas.collaborator;

    case 'barcode':
      return AirtableSchemas.barcode;

    case 'button':
      return AirtableSchemas.button;

    case 'createdTime':
    case 'lastModifiedTime':
      return z.string().datetime();

    case 'formula':
    case 'rollup':
      // Formulas and rollups can return various types
      // We use the result type if available
      if (field.options?.result) {
        const resultField: FieldSchema = {
          ...field,
          type: field.options.result.precision !== undefined ? 'number' : 'singleLineText',
          options: field.options.result,
        };
        return fieldTypeToZod(resultField, customHandlers);
      }
      return z.unknown();

    case 'lookup':
      // Lookups return arrays of the linked field type
      return z.array(z.unknown());

    default:
      return z.unknown();
  }
}

/**
 * Convert field type to TypeScript type string (for codegen)
 */
export function fieldTypeToTS(field: FieldSchema): string {
  switch (field.type) {
    case 'singleLineText':
    case 'multilineText':
    case 'richText':
    case 'phoneNumber':
    case 'email':
    case 'url':
    case 'date':
    case 'dateTime':
    case 'createdTime':
    case 'lastModifiedTime':
      return 'string';

    case 'number':
    case 'percent':
    case 'currency':
    case 'duration':
    case 'rating':
    case 'autoNumber':
    case 'count':
      return 'number';

    case 'checkbox':
      return 'boolean';

    case 'singleSelect':
      if (field.options?.choices && field.options.choices.length > 0) {
        const values = field.options.choices.map((c) => `'${c.name}'`);
        return values.join(' | ');
      }
      return 'string';

    case 'multipleSelects':
      if (field.options?.choices && field.options.choices.length > 0) {
        const values = field.options.choices.map((c) => `'${c.name}'`);
        return `Array<${values.join(' | ')}>`;
      }
      return 'string[]';

    case 'attachment':
      return 'Attachment[]';

    case 'multipleRecordLinks':
      return 'string[]';

    case 'createdBy':
    case 'lastModifiedBy':
      return 'Collaborator';

    case 'barcode':
      return 'Barcode';

    case 'button':
      return 'Button';

    case 'formula':
    case 'rollup':
      if (field.options?.result) {
        const resultField: FieldSchema = {
          ...field,
          type: field.options.result.precision !== undefined ? 'number' : 'singleLineText',
          options: field.options.result,
        };
        return fieldTypeToTS(resultField);
      }
      return 'unknown';

    case 'lookup':
      return 'unknown[]';

    default:
      return 'unknown';
  }
}
