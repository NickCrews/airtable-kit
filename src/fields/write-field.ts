
/**
 * The schemas for when you want to write field definitions.
 * 
 * In general, this is {
 *   name: string
 *   type: FieldType // eg autoNumber, dateTime, etc
 *   options: any // if relevant for type
 * }
 * 
 * which is like the normal FieldSchema, but
 * - without the ID
 * - the the options being required (if relevant for that type)
*/
import * as fields from './index.ts'

const WRITE_FIELD_SCHEMAS = {
    aiText: null as unknown as fields.AiTextSchemaWrite,
    autoNumber: null as unknown as fields.AutoNumberSchemaWrite,
    barcode: null as unknown as fields.BarcodeSchemaWrite,
    button: null as unknown as fields.ButtonSchemaWrite,
    checkbox: null as unknown as fields.CheckboxSchemaWrite,
    count: null as unknown as fields.CountSchemaWrite,
    createdBy: null as unknown as fields.CreatedBySchemaWrite,
    createdTime: null as unknown as fields.CreatedTimeSchemaWrite,
    currency: null as unknown as fields.CurrencySchemaWrite,
    date: null as unknown as fields.DateSchemaWrite,
    dateTime: null as unknown as fields.DateTimeSchemaWrite,
    duration: null as unknown as fields.DurationSchemaWrite,
    email: null as unknown as fields.EmailSchemaWrite,
    externalSyncSource: null as unknown as fields.ExternalSyncSourceSchemaWrite,
    formula: null as unknown as fields.FormulaSchemaWrite,
    lastModifiedBy: null as unknown as fields.LastModifiedBySchemaWrite,
    lastModifiedTime: null as unknown as fields.LastModifiedTimeSchemaWrite,
    multilineText: null as unknown as fields.MultilineTextSchemaWrite,
    multipleAttachments: null as unknown as fields.MultipleAttachmentsSchemaWrite,
    multipleCollaborators: null as unknown as fields.MultipleCollaboratorsSchemaWrite,
    multipleLookupValues: null as unknown as fields.MultipleLookupValuesSchemaWrite,
    multipleRecordLinks: null as unknown as fields.MultipleRecordLinksSchemaWrite,
    multipleSelects: null as unknown as fields.MultipleSelectsSchemaWrite,
    number: null as unknown as fields.NumberSchemaWrite,
    percent: null as unknown as fields.PercentSchemaWrite,
    phoneNumber: null as unknown as fields.PhoneNumberSchemaWrite,
    rating: null as unknown as fields.RatingSchemaWrite,
    richText: null as unknown as fields.RichTextSchemaWrite,
    rollup: null as unknown as fields.RollupSchemaWrite,
    singleCollaborator: null as unknown as fields.SingleCollaboratorSchemaWrite,
    singleLineText: null as unknown as fields.SingleLineTextSchemaWrite,
    singleSelect: null as unknown as fields.SingleSelectSchemaWrite,
    url: null as unknown as fields.UrlSchemaWrite,
};

export type WriteFieldSchema = typeof WRITE_FIELD_SCHEMAS[keyof typeof WRITE_FIELD_SCHEMAS];