/**
 * Convert Airtable field types to Zod schemas
 */

import { z } from 'zod';
import type { FieldSchema } from '../schema/fields.js';


const CollaboratorSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
});

/**
 * Handler for custom field type conversions
 */
export type FieldTypeHandler = (field: FieldSchema) => z.ZodSchema;

/**
 * Convert a field type to a Zod schema
 */
export function fieldSchemaToZod(
  field: FieldSchema,
  customHandlers?: Record<string, FieldTypeHandler>
): z.ZodSchema {
  // Check for custom handler first
  if (customHandlers?.[field.type]) {
    return customHandlers[field.type](field);
  }

  const fieldType = field.type;
  switch (fieldType) {
    // read-only fields
    case 'autoNumber':
    case 'button':
    case 'count':
    case 'createdBy':
    case 'createdTime':
    case 'formula':
    case 'lastModifiedBy':
    case 'lastModifiedTime':
    case 'multipleLookupValues':
    case 'rollup':
      return z.never();

    case 'singleLineText':
    case 'multilineText':
    case 'richText':
    case 'phoneNumber':
      return z.string();
    case 'externalSyncSource':
      return z.any();

    case 'email':
      return z.email();

    case 'url':
      return z.url();

    case 'number':
    case 'percent':
    case 'currency':
    case 'duration':
    case 'rating':
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

    case 'multipleAttachments':
      return z.array(z.object({
        url: z.url(),
        filename: z.string(),
      }));

    case 'multipleRecordLinks':
      return z.array(z.string());

    case 'barcode':
      return z.object({
        text: z.string(),
        type: z.string().optional(),
      });

    case 'singleCollaborator':
      return CollaboratorSchema;
    case 'multipleCollaborators':
      return z.array(CollaboratorSchema);

    case 'aiText':
      return z.string();

    default:
      throw new Error(`Unsupported field type: ${fieldType satisfies never}`);
  }
}
