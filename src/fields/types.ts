import * as fields from "./index.ts";

const FIELD_SCHEMAS = {
  aiText: null as unknown as fields.AiText,
  autoNumber: null as unknown as fields.AutoNumber,
  barcode: null as unknown as fields.Barcode,
  button: null as unknown as fields.Button,
  checkbox: null as unknown as fields.Checkbox,
  count: null as unknown as fields.Count,
  createdBy: null as unknown as fields.CreatedBy,
  createdTime: null as unknown as fields.CreatedTime,
  currency: null as unknown as fields.Currency,
  date: null as unknown as fields.Date,
  dateTime: null as unknown as fields.DateTime,
  duration: null as unknown as fields.Duration,
  email: null as unknown as fields.Email,
  externalSyncSource: null as unknown as fields.ExternalSyncSource,
  formula: null as unknown as fields.Formula,
  lastModifiedBy: null as unknown as fields.LastModifiedBy,
  lastModifiedTime: null as unknown as fields.LastModifiedTime,
  multilineText: null as unknown as fields.MultilineText,
  multipleAttachments: null as unknown as fields.MultipleAttachments,
  multipleCollaborators: null as unknown as fields.MultipleCollaborators,
  multipleLookupValues: null as unknown as fields.MultipleLookupValues,
  multipleRecordLinks: null as unknown as fields.MultipleRecordLinks,
  multipleSelects: null as unknown as fields.MultipleSelects,
  number: null as unknown as fields.Number,
  percent: null as unknown as fields.Percent,
  phoneNumber: null as unknown as fields.PhoneNumber,
  rating: null as unknown as fields.Rating,
  richText: null as unknown as fields.RichText,
  rollup: null as unknown as fields.Rollup,
  singleCollaborator: null as unknown as fields.SingleCollaborator,
  singleLineText: null as unknown as fields.SingleLineText,
  singleSelect: null as unknown as fields.SingleSelect,
  url: null as unknown as fields.Url,
};

/**
 * Union of all field schemas from {@link fields}
 * 
 * Each field schema is an extension of the metadata from the [airtable API](https://airtable.com/developers/web/api/field-model)
 * It is an object with at least the following properties:
 * - `id`: The ID of the field, like `fldxxxxxxxxxxxxxx`
 * - `type`: The {@link FieldType} code, eg 'singleLineText'
 * - `name`: A friendly name to refer to the field in your code, eg 'dueDate'
 * 
 * Additionally, they MAY contain properties:
 * - `options`: Some fields have extra metadata, such as a `singleSelect` field keeps track of the list of choices.
 *    These extra properties are included for some field types under the `options` property.
 * - `description`: An optional description for the field.
 *    During code generation, this is pulled from the description set in the Airtable UI.
 *    During Zod validator generation, this is added as a description to the Zod schema,
 *    so that it shows up in any generate JSON Schema or OpenAPI docs.
 */
export type FieldSchema = typeof FIELD_SCHEMAS[keyof typeof FIELD_SCHEMAS];
/**
 * One of the string type codes from the [Airtable API](https://airtable.com/developers/web/api/field-model), eg 'singleSelect'
 */
export type FieldType = FieldSchema["type"];