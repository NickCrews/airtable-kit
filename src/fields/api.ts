import { BaseId } from "../bases/types.ts";
import type { Requester } from "../request.ts";
import { TableId } from "../tables/types.ts";
import { FieldId } from "./types.ts";

import { FieldSchemaRead, FieldSchemaCreate, FieldType } from './types.ts';

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
    field: FieldSchemaCreate;
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
}

/** Methods for the Airtable fields API, available as `airtable.fields`. */
export interface FieldsApi {
    /** Create a field in a table. */
    create(params: CreateFieldParams): Promise<FieldSchemaRead>;
    /** Update a field's name and description. A field's type and options cannot be changed. */
    update(params: UpdateFieldParams): Promise<FieldSchemaRead>;
}

export function makeFieldsApi(request: Requester): FieldsApi {
    return {
        // https://airtable.com/developers/web/api/create-field
        create({ baseId, tableId, field }) {
            return request<FieldSchemaRead>({
                path: `/meta/bases/${baseId}/tables/${tableId}/fields`,
                method: "POST",
                data: field,
            });
        },
        // https://airtable.com/developers/web/api/update-field
        update({ baseId, tableId, field }) {
            return request<FieldSchemaRead>({
                path: `/meta/bases/${baseId}/tables/${tableId}/fields/${field.id}`,
                method: "PATCH",
                data: {
                    name: field.name || undefined,
                    description: field.description || undefined,
                },
            });
        },
    };
}
