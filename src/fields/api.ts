import { IntoFetcher, makeFetcher } from "../fetcher.ts";
import { BaseId, FieldId, FieldSchema, TableId } from "../types";

import * as fields from './index.ts'
import { FieldType } from './types.ts';

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
 * In general, this is
 * ```
 * {
 *   name: string
 *   type: FieldType // eg "autoNumber", "dateTime", etc
 *   options: any // if relevant for type
 * }
 * ```
 * which is like the {@link FieldSchema} you get when you read table's schema, but
 * - without the ID
 * - the the options being required (if relevant for that type)
*/
export type CreateFieldSchema = typeof CREATE_FIELD_SCHEMAS[keyof typeof CREATE_FIELD_SCHEMAS];

const fieldCreationAbilityMap = {
    "aiText": "anytime",
    "autoNumber": "manually",
    "barcode": "anytime",
    "button": "anytime",
    "checkbox": "anytime",
    "count": "manually",
    "createdBy": "manually",
    "createdTime": "manually",
    "currency": "anytime",
    "date": "anytime",
    "dateTime": "anytime",
    "duration": "anytime",
    "email": "anytime",
    "externalSyncSource": "anytime",
    "formula": "manually",
    "lastModifiedBy": "manually",
    "lastModifiedTime": "manually",
    "multilineText": "anytime",
    "multipleAttachments": "anytime",
    "multipleCollaborators": "anytime",
    "multipleLookupValues": "afterBaseCreate",
    "multipleRecordLinks": "afterBaseCreate",
    "multipleSelects": "anytime",
    "number": "anytime",
    "percent": "anytime",
    "phoneNumber": "anytime",
    "rating": "anytime",
    "richText": "anytime",
    "rollup": "afterBaseCreate",
    "singleCollaborator": "anytime",
    "singleLineText": "anytime",
    "singleSelect": "anytime",
    "url": "anytime",
} as const;

/**
 * The permissions around when a field can be created.
 * 
 * The airtable API doesn't support some fields using the API at all,
 * you need to create them manually in the UI. These fields are marked as 'manually'.
 * These are:
 * - lastModifiedBy
 * - lastModifiedTime
 * - createdBy
 * - createdTime
 * - formula
 * 
 * Other fields can be created via the API, but some, like multipleRecordLinks,
 * require you to know the field IDs of other fields at creation time.
 * This means that you can't create these fields until after the base has been created,
 * and you know the table and field IDs. These are marked as 'afterBaseCreate'.
 * 
 * All other fields can be created at any time via the API, and are marked as 'anytime'.
 * These are the simple ones, like singleLineText, number, checkbox, etc.
 */
export type FieldCreationAbility<T extends FieldType = FieldType> = typeof fieldCreationAbilityMap[T];

/**
 * Determine the {@link FieldCreationAbility} for a given {@link FieldType}
 * 
 * @param fieldType The type of the field to check
 * @returns The creation ability of the field type
 */
export function fieldCreationAbility<T extends FieldType = FieldType>(fieldType: T): FieldCreationAbility<T> {
    const result = fieldCreationAbilityMap[fieldType];
    if (!result) {
        throw new Error(`Unknown field type: ${fieldType}`);
    }
    return result;
}

export interface CreateFieldParams {
    baseId: BaseId;
    tableId: TableId;
    field: CreateFieldSchema;
    fetcher?: IntoFetcher;
}

export async function createField({
    baseId,
    tableId,
    field,
    fetcher: intoFetcher,
}: CreateFieldParams): Promise<FieldSchema> {
    const fetcher = makeFetcher(intoFetcher);
    const response = await fetcher.fetch<FieldSchema>({
        path: `/meta/bases/${baseId}/tables/${tableId}/fields`,
        method: "POST",
        data: {
            ...field,
        },
    });
    return response;
}

export interface UpdateFieldSchema {
    id: FieldId;
    name?: string;
    description?: string;
}

export interface UpdateFieldParams {
    baseId: BaseId;
    tableId: TableId;
    field: UpdateFieldSchema;
    fetcher?: IntoFetcher;
}

/**
 * You can update a field's name and description, but not its type or options.
 */
export async function updateField({
    baseId,
    tableId,
    field,
    fetcher: intoFetcher,
}: UpdateFieldParams): Promise<FieldSchema> {
    const fetcher = makeFetcher(intoFetcher);
    const response = await fetcher.fetch<FieldSchema>({
        path: `/meta/bases/${baseId}/tables/${tableId}/fields/${field.id}`,
        method: "PATCH",
        data: {
            name: field.name || undefined,
            description: field.description || undefined,
        },
    });
    return response;
}