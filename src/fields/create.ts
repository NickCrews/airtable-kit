import * as fields from './index.ts'

const CREATE_FIELD_SCHEMAS = {
    aiText: null as unknown as fields.AiTextSchemaCreate,
    autoNumber: null as unknown as fields.AutoNumberSchemaCreate,
    barcode: null as unknown as fields.BarcodeSchemaCreate,
    button: null as unknown as fields.ButtonSchemaCreate,
    checkbox: null as unknown as fields.CheckboxSchemaCreate,
    count: null as unknown as fields.CountSchemaCreate,
    createdBy: null as unknown as fields.CreatedBySchemaCreate,
    createdTime: null as unknown as fields.CreatedTimeSchemaCreate,
    currency: null as unknown as fields.CurrencySchemaCreate,
    date: null as unknown as fields.DateSchemaCreate,
    dateTime: null as unknown as fields.DateTimeSchemaCreate,
    duration: null as unknown as fields.DurationSchemaCreate,
    email: null as unknown as fields.EmailSchemaCreate,
    externalSyncSource: null as unknown as fields.ExternalSyncSourceSchemaCreate,
    formula: null as unknown as fields.FormulaSchemaCreate,
    lastModifiedBy: null as unknown as fields.LastModifiedBySchemaCreate,
    lastModifiedTime: null as unknown as fields.LastModifiedTimeSchemaCreate,
    multilineText: null as unknown as fields.MultilineTextSchemaCreate,
    multipleAttachments: null as unknown as fields.MultipleAttachmentsSchemaCreate,
    multipleCollaborators: null as unknown as fields.MultipleCollaboratorsSchemaCreate,
    multipleLookupValues: null as unknown as fields.MultipleLookupValuesSchemaCreate,
    multipleRecordLinks: null as unknown as fields.MultipleRecordLinksSchemaCreate,
    multipleSelects: null as unknown as fields.MultipleSelectsSchemaCreate,
    number: null as unknown as fields.NumberSchemaCreate,
    percent: null as unknown as fields.PercentSchemaCreate,
    phoneNumber: null as unknown as fields.PhoneNumberSchemaCreate,
    rating: null as unknown as fields.RatingSchemaCreate,
    richText: null as unknown as fields.RichTextSchemaCreate,
    rollup: null as unknown as fields.RollupSchemaCreate,
    singleCollaborator: null as unknown as fields.SingleCollaboratorSchemaCreate,
    singleLineText: null as unknown as fields.SingleLineTextSchemaCreate,
    singleSelect: null as unknown as fields.SingleSelectSchemaCreate,
    url: null as unknown as fields.UrlSchemaCreate,
};


/**
 * The schemas for when you want to create a field in Airtable.
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
export type CreateFieldSchema = typeof CREATE_FIELD_SCHEMAS[keyof typeof CREATE_FIELD_SCHEMAS];