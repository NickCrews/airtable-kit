import * as fields from "./index.ts";

/**
 * Union of all field schemas in {@link fields}
 */
const Field = {
  AiText: null as unknown as fields.AiText,
  AutoNumber: null as unknown as fields.AutoNumber,
  Barcode: null as unknown as fields.Barcode,
  Button: null as unknown as fields.Button,
  Checkbox: null as unknown as fields.Checkbox,
  Count: null as unknown as fields.Count,
  CreatedBy: null as unknown as fields.CreatedBy,
  CreatedTime: null as unknown as fields.CreatedTime,
  Currency: null as unknown as fields.Currency,
  Date: null as unknown as fields.Date,
  DateTime: null as unknown as fields.DateTime,
  Duration: null as unknown as fields.Duration,
  Email: null as unknown as fields.Email,
  ExternalSyncSource: null as unknown as fields.ExternalSyncSource,
  Formula: null as unknown as fields.Formula,
  LastModifiedBy: null as unknown as fields.LastModifiedBy,
  LastModifiedTime: null as unknown as fields.LastModifiedTime,
  MultilineText: null as unknown as fields.MultilineText,
  MultipleAttachments: null as unknown as fields.MultipleAttachments,
  MultipleCollaborators: null as unknown as fields.MultipleCollaborators,
  MultipleLookupValues: null as unknown as fields.MultipleLookupValues,
  MultipleRecordLinks: null as unknown as fields.MultipleRecordLinks,
  MultipleSelects: null as unknown as fields.MultipleSelects,
  Number: null as unknown as fields.Number,
  Percent: null as unknown as fields.Percent,
  PhoneNumber: null as unknown as fields.PhoneNumber,
  Rating: null as unknown as fields.Rating,
  RichText: null as unknown as fields.RichText,
  Rollup: null as unknown as fields.Rollup,
  SingleCollaborator: null as unknown as fields.SingleCollaborator,
  SingleLineText: null as unknown as fields.SingleLineText,
  SingleSelect: null as unknown as fields.SingleSelect,
  Url: null as unknown as fields.Url,
};

/**
 * Union of all field schemas from {@link fields}
 */
export type FieldSchema = typeof Field[keyof typeof Field];
/**
 * Field type code (just the string type)
 */
export type FieldType = FieldSchema["type"];