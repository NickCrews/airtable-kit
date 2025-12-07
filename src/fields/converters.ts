/**
 * Converters for field values to/from Airtable API format.
 */

import * as types from "./types.ts";
import { AirtableKitError } from "../exceptions/common.ts";
import { AttachmentId, RecordId } from "../types.ts";

/** ISO 8601 string in UTC, e.g. "2024-01-01T00:00:00.000Z" */
type UtcTimestamp = string;

type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;
type PartialExceptType<T extends { type: types.FieldType }> = PartialExcept<T, "type">;
type PartialExceptTypeAndOptions<T extends { type: types.FieldType }> =
    T extends { options: unknown } ? PartialExcept<T, "type" | "options"> :
    PartialExcept<T, "type">;
// /**
//  * When converting values, we don't need the field name, id, description, or other metadata.
//  * We only need the type and (if they exist), the options.
//  * But other fields are still acceptable, including bogus ones.
//  */
type FieldTypeIsh = types.FieldType | { type: types.FieldType };
type EnsureFieldSchemaRead<T extends FieldTypeIsh> =
    T extends types.FieldType ? Extract<types.FieldSchemaRead, { type: T }> :
    T extends { type: infer FT }
    ? FT extends types.FieldType
    ? Extract<types.FieldSchemaRead, { type: FT }>
    : never
    : never;
type FieldSchemaTypeAndOptions<T extends FieldTypeIsh = types.FieldSchemaRead> = PartialExceptTypeAndOptions<EnsureFieldSchemaRead<T>>;

// ============================================================================
// aiText

function fromReadAiText(value: unknown, fieldSchema: PartialExceptType<types.AiTextSchemaRead>): types.AiTextValueRead {
    return value as types.AiTextValueRead;
}
function toWriteAiText(value: never, fieldSchema: PartialExceptType<types.AiTextSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// autoNumber

function fromReadAutoNumber(value: number, fieldSchema: PartialExceptType<types.AutoNumberSchemaRead>): number {
    const t = typeof value;
    if (t !== "number") {
        const e = new Error(`autoNumber field ${JSON.stringify(fieldSchema)} should always receive a number, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as number;
}
function toWriteAutoNumber(value: never, fieldSchema: PartialExceptType<types.AutoNumberSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// barcode

export interface BarcodeValue {
    text: string;
    type: string;
}
function fromReadBarcode(value: unknown, fieldSchema: PartialExceptType<types.BarcodeSchemaRead>): BarcodeValue | null {
    return value as BarcodeValue | null;
}
function toWriteBarcode(value: BarcodeValue | null | undefined, fieldSchema: PartialExceptType<types.BarcodeSchemaRead>): BarcodeValue | null | undefined {
    return value;
}

// ============================================================================
// button
// Buttons cannot be read or written, so no converters are needed.

// ============================================================================
// checkbox

function fromReadCheckbox(value: unknown, fieldSchema: PartialExceptType<types.CheckboxSchemaRead>): boolean {
    return value as boolean ?? false;
}
function toWriteCheckbox(value: boolean | null | undefined, fieldSchema: PartialExceptType<types.CheckboxSchemaRead>): boolean | null | undefined {
    return value;
}

// ============================================================================
// count

function fromReadCount(value: unknown, fieldSchema: PartialExceptType<types.CountSchemaRead>): number {
    if (value === null || value === undefined) {
        const e = new Error(`count field ${JSON.stringify(fieldSchema)} should always receive a number, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as number;
}
function toWriteCount(value: never, fieldSchema: PartialExceptType<types.CountSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// createdBy

export interface User {
    id: string;
    email?: string;
    name?: string;
    permissionLevel?: "none" | "read" | "comment" | "edit" | "create";
    profilePicUrl?: string;
}
export interface UserWrite {
    id: string;
    email: string;
}
function fromReadCreatedBy(value: unknown, fieldSchema: PartialExceptType<types.CreatedBySchemaRead>): User {
    if (!value) {
        const e = new Error(`createdBy field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as User;
}
function toWriteCreatedBy(value: never, fieldSchema: PartialExceptType<types.CreatedBySchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// createdTime

function fromReadCreatedTime(value: unknown, fieldSchema: PartialExceptType<types.CreatedTimeSchemaRead>): UtcTimestamp {
    if (value === null || value === undefined) {
        const e = new Error(`createdTime field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as UtcTimestamp;
}
function toWriteCreatedTime(value: never, fieldSchema: PartialExceptType<types.CreatedTimeSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// currency

function fromReadCurrency(value: unknown, fieldSchema: PartialExceptType<types.CurrencySchemaRead>): number | null {
    return value as number | null;
}
function toWriteCurrency(value: number | null | undefined, fieldSchema: PartialExceptType<types.CurrencySchemaRead>): number | null | undefined {
    return value;
}

// ============================================================================
// date

type TDateString = `${number}-${number}-${number}`;
function fromReadDate(value: unknown, fieldSchema: PartialExceptType<types.DateSchemaRead>): string | null {
    if (value === null) {
        return null;
    }
    const t = typeof value;
    if (t !== "string") {
        const e = new Error(`date field ${JSON.stringify(fieldSchema)} should always receive a string or null, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as string;
}
function toWriteDate(value: globalThis.Date | TDateString | null | undefined, fieldSchema: PartialExceptType<types.DateSchemaRead>): string | null | undefined {
    if (value instanceof globalThis.Date) {
        return value.toISOString().split("T")[0];
    }
    return value;
}

// ============================================================================
// dateTime

function fromReadDateTime(value: unknown, fieldSchema: PartialExceptType<types.DateTimeSchemaRead>): UtcTimestamp | null {
    return value as UtcTimestamp | null;
}
function toWriteDateTime(value: globalThis.Date | string | null | undefined, fieldSchema: PartialExceptType<types.DateTimeSchemaRead>): string | null | undefined {
    if (value instanceof globalThis.Date) {
        return value.toISOString();
    }
    return value;
}

// ============================================================================
// duration

function fromReadDuration(value: unknown, fieldSchema: PartialExceptType<types.DurationSchemaRead>): number | null {
    return value as number | null;
}
function toWriteDuration(value: number | null | undefined, fieldSchema: PartialExceptType<types.DurationSchemaRead>): number | null | undefined {
    return value;
}

// ============================================================================
// email

function fromReadEmail(value: unknown, fieldSchema: PartialExceptType<types.EmailSchemaRead>): string {
    return (value as string | null) ?? "";
}
function toWriteEmail(value: string | null | undefined, fieldSchema: PartialExceptType<types.EmailSchemaRead>): string | null | undefined {
    return value;
}

// ============================================================================
// externalSyncSource

function fromReadExternalSyncSource(value: unknown, fieldSchema: PartialExceptType<types.ExternalSyncSourceSchemaRead>): unknown {
    return value;
}
function toWriteExternalSyncSource(value: unknown, fieldSchema: PartialExceptType<types.ExternalSyncSourceSchemaRead>): unknown {
    return value;
}

// ============================================================================
// formula
// Formula fields are read-only and their read value depends on the result type.
// For now, we pass through the raw value. A more sophisticated approach would
// use the result type from fieldSchema.options.result to properly convert.

function fromReadFormula(value: unknown, fieldSchema: PartialExceptType<types.FormulaSchemaRead>): unknown {
    return value;
}
function toWriteFormula(value: never, fieldSchema: PartialExceptType<types.FormulaSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// lastModifiedBy

function fromReadLastModifiedBy(value: unknown, fieldSchema: PartialExceptType<types.LastModifiedBySchemaRead>): User {
    if (!value) {
        const e = new Error(`lastModifiedBy field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as User;
}
function toWriteLastModifiedBy(value: never, fieldSchema: PartialExceptType<types.LastModifiedBySchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// lastModifiedTime

function fromReadLastModifiedTime(value: unknown, fieldSchema: PartialExceptType<types.LastModifiedTimeSchemaRead>): UtcTimestamp {
    if (value === null || value === undefined) {
        const e = new Error(`lastModifiedTime field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as UtcTimestamp;
}
function toWriteLastModifiedTime(value: never, fieldSchema: PartialExceptType<types.LastModifiedTimeSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// multilineText

function fromReadMultilineText(value: unknown, fieldSchema: PartialExceptType<types.MultilineTextSchemaRead>): string {
    return (value as string | null) ?? "";
}
function toWriteMultilineText(value: string | null | undefined, fieldSchema: PartialExceptType<types.MultilineTextSchemaRead>): string | null | undefined {
    return value;
}

// ============================================================================
// multipleAttachments

type Thumbnail = {
    url: string;
    height: number;
    width: number;
}
export type MultipleAttachmentReadType = {
    id: AttachmentId;
    type: string;
    filename: string;
    url: string;
    size: number;
    width?: number;
    height?: number;
    thumbnails?: {
        full?: Thumbnail;
        large?: Thumbnail;
        small?: Thumbnail;
    };
};
export type MultipleAttachmentWriteType = {
    id: AttachmentId;
} | {
    url: string;
    filename?: string;
};
function fromReadMultipleAttachments(value: unknown, fieldSchema: PartialExceptType<types.MultipleAttachmentsSchemaRead>): Array<MultipleAttachmentReadType> {
    return (value as Array<MultipleAttachmentReadType> | null) ?? [];
}
function toWriteMultipleAttachments(value: ReadonlyArray<MultipleAttachmentWriteType> | null | undefined, fieldSchema: PartialExceptType<types.MultipleAttachmentsSchemaRead>): ReadonlyArray<MultipleAttachmentWriteType> | null | undefined {
    return value;
}

// ============================================================================
// multipleCollaborators

function fromReadMultipleCollaborators(value: unknown, fieldSchema: PartialExceptType<types.MultipleCollaboratorsSchemaRead>): User[] {
    return (value as User[] | null) ?? [];
}
function toWriteMultipleCollaborators(value: User[] | null | undefined, fieldSchema: PartialExceptType<types.MultipleCollaboratorsSchemaRead>): User[] {
    return value ?? [];
}

// ============================================================================
// multipleLookupValues
// Lookup fields are read-only and their read value depends on the result type.

function fromReadMultipleLookupValues(value: unknown, fieldSchema: PartialExceptType<types.MultipleLookupValuesSchemaRead>): unknown[] {
    return (value as unknown[] | null) ?? [];
}
function toWriteMultipleLookupValues(value: never, fieldSchema: PartialExceptType<types.MultipleLookupValuesSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// multipleRecordLinks

function fromReadMultipleRecordLinks(value: unknown, fieldSchema: PartialExceptType<types.MultipleRecordLinksSchemaRead>): RecordId[] {
    return (value as RecordId[] | null) ?? [];
}
function toWriteMultipleRecordLinks(value: ReadonlyArray<RecordId> | null | undefined, fieldSchema: PartialExceptType<types.MultipleRecordLinksSchemaRead>): ReadonlyArray<RecordId> | null | undefined {
    return value ?? [];
}

// ============================================================================
// multipleSelects

/**
* When reading from the API, we only get back the NAME of the select option,
* we aren't given the selZZZZZZZZZZZZ ID.
* Only the webhooks API provides the full choice object when reading select fields :(
* 
* Currently we error if we can't find the choice by name.
* An alternative would be to return null, or the raw string value.
* 
* Or, we could even make it so this would trigger a fetch of the field schema's choices from the API,
* but that would be an async operation, and would complicate this function significantly.
* 
* See
* https://airtable.com/developers/web/api/field-model#select
*/
function convertFromReadSelectValue<C extends types.SelectChoiceSchemaRead>(
    raw: string,
    fieldSchema: PartialExceptTypeAndOptions<types.SingleSelectSchemaRead<C> | types.MultipleSelectsSchemaRead<C>>
): C["name"] {
    const foundChoiceByName = fieldSchema.options.choices.find((c) => c.name === raw);
    if (foundChoiceByName) {
        return raw;
    }
    throw new Error(`Choice "${raw}" not found in field "${JSON.stringify(fieldSchema)}". Available choices: ${fieldSchema.options.choices.map((c) => c.name).join(", ")}`);
}

function fromReadMultipleSelects<F extends PartialExceptTypeAndOptions<types.MultipleSelectsSchemaRead>>(
    raw: unknown,
    fieldSchema: F
): Array<F["options"]["choices"][number]["name"]> {
    if (!raw) return [];
    return (raw as Array<string>).map((item) => convertFromReadSelectValue(item, fieldSchema));
}

function toWriteMultipleSelects<F extends PartialExceptTypeAndOptions<types.MultipleSelectsSchemaRead>>(
    idsOrNames: null | undefined | ReadonlyArray<F["options"]["choices"][number]["id"] | F["options"]["choices"][number]["name"]>,
    fieldSchema: F
): Array<F["options"]["choices"][number]["id"]> {
    if (!idsOrNames) return [];
    const choices = fieldSchema.options.choices;
    return idsOrNames.map((idOrValue) => {
        let found = choices.find((option) => option.id === idOrValue);
        if (found) {
            return found.id;
        }
        found = choices.find((option) => option.name === idOrValue);
        if (found) {
            return found.id;
        }
        const availableOptions = choices.map((o) => o.name);
        availableOptions.push(...choices.map((o) => o.id));
        throw new Error(
            `No option found for value: ${idOrValue}. Available options: ${availableOptions.join(", ")
            }`,
        );
    });
}

// ============================================================================
// number

function fromReadNumber(value: unknown, fieldSchema: PartialExceptType<types.NumberSchemaRead>): number | null {
    return value as number | null;
}
function toWriteNumber(value: number | null | undefined, fieldSchema: PartialExceptType<types.NumberSchemaRead>): number | null | undefined {
    return value;
}

// ============================================================================
// percent

function fromReadPercent(value: unknown, fieldSchema: PartialExceptType<types.PercentSchemaRead>): number | null {
    return value as number | null;
}
function toWritePercent(value: number | null | undefined, fieldSchema: PartialExceptType<types.PercentSchemaRead>): number | null | undefined {
    return value;
}

// ============================================================================
// phoneNumber

function fromReadPhoneNumber(value: unknown, fieldSchema: PartialExceptType<types.PhoneNumberSchemaRead>): string | null {
    return value as string | null;
}
function toWritePhoneNumber(value: string | null | undefined, fieldSchema: PartialExceptType<types.PhoneNumberSchemaRead>): string | null | undefined {
    return value;
}

// ============================================================================
// rating

function fromReadRating(value: unknown, fieldSchema: PartialExceptType<types.RatingSchemaRead>): number | null {
    return value as number | null;
}
function toWriteRating(value: number | null | undefined, fieldSchema: PartialExceptType<types.RatingSchemaRead>): number | null | undefined {
    return value;
}

// ============================================================================
// richText

function fromReadRichText(value: unknown, fieldSchema: PartialExceptType<types.RichTextSchemaRead>): string {
    return (value as string | null) ?? "";
}
function toWriteRichText(value: string | null | undefined, fieldSchema: PartialExceptType<types.RichTextSchemaRead>): string | null | undefined {
    return value;
}

// ============================================================================
// rollup
// Rollup fields are read-only and their read value depends on the result type.

function fromReadRollup(value: unknown, fieldSchema: PartialExceptType<types.RollupSchemaRead>): unknown {
    return value;
}
function toWriteRollup(value: never, fieldSchema: PartialExceptType<types.RollupSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// singleCollaborator

function fromReadSingleCollaborator(value: unknown, fieldSchema: PartialExceptType<types.SingleCollaboratorSchemaRead>): User | null {
    return value as User | null;
}
function toWriteSingleCollaborator(value: UserWrite | null | undefined, fieldSchema: PartialExceptType<types.SingleCollaboratorSchemaRead>): UserWrite | null | undefined {
    return value;
}

// ============================================================================
// singleLineText

function fromReadSingleLineText(value: unknown, fieldSchema: PartialExceptType<types.SingleLineTextSchemaRead>): string {
    return (value as string | null) ?? "";
}
function toWriteSingleLineText(value: string | null | undefined, fieldSchema: PartialExceptType<types.SingleLineTextSchemaRead>): string | null | undefined {
    return value;
}

// ============================================================================
// singleSelect

function fromReadSingleSelect<F extends PartialExceptTypeAndOptions<types.SingleSelectSchemaRead>>(
    value: unknown,
    fieldSchema: F
): F["options"]["choices"][number]["name"] | null {
    if (value === null || value === undefined) {
        return null;
    }
    return convertFromReadSelectValue(value as string, fieldSchema);
}
function toWriteSingleSelect<F extends PartialExceptTypeAndOptions<types.SingleSelectSchemaRead>>(
    idOrName: F["options"]["choices"][number]["id"] | F["options"]["choices"][number]["name"] | null | undefined,
    fieldSchema: F
): F["options"]["choices"][number]["id"] | null | undefined {
    if (idOrName === null || idOrName === undefined) {
        return idOrName;
    }
    const choices = fieldSchema.options.choices;
    let found = choices.find((option) => option.id === idOrName);
    if (found) {
        return found.id;
    }
    found = choices.find((option) => option.name === idOrName);
    if (found) {
        return found.id;
    }
    const availableOptions = choices.map((o) => o.name);
    availableOptions.push(...choices.map((o) => o.id));
    throw new Error(
        `No option found for value '${idOrName}'. Available options: ${availableOptions.join(", ")}`,
    );
}

// ============================================================================
// url

function fromReadUrl(value: unknown, fieldSchema: PartialExceptType<types.UrlSchemaRead>): string {
    return (value as string | null) ?? "";
}
function toWriteUrl(value: string | null | undefined, fieldSchema: PartialExceptType<types.UrlSchemaRead>): string | null | undefined {
    return value;
}

// ============================================================================

type FromReadConverterFunc = (value: any, fieldSchema: any) => any;
type FieldSchemaForReadFunc<F extends FromReadConverterFunc> = F extends (value: unknown, fieldSchema: infer S) => infer R
    ? S extends FieldSchemaTypeAndOptions ? S : never
    : never;

type ReadFuncFromFieldSchema<T extends FieldSchemaForWrite> =
    T extends FieldSchemaForReadFunc<typeof fromReadAiText> ? typeof fromReadAiText :
    T extends FieldSchemaForReadFunc<typeof fromReadAutoNumber> ? typeof fromReadAutoNumber :
    T extends FieldSchemaForReadFunc<typeof fromReadBarcode> ? typeof fromReadBarcode :
    T extends FieldSchemaForReadFunc<typeof fromReadCheckbox> ? typeof fromReadCheckbox :
    T extends FieldSchemaForReadFunc<typeof fromReadCount> ? typeof fromReadCount :
    T extends FieldSchemaForReadFunc<typeof fromReadCreatedBy> ? typeof fromReadCreatedBy :
    T extends FieldSchemaForReadFunc<typeof fromReadCreatedTime> ? typeof fromReadCreatedTime :
    T extends FieldSchemaForReadFunc<typeof fromReadCurrency> ? typeof fromReadCurrency :
    T extends FieldSchemaForReadFunc<typeof fromReadDate> ? typeof fromReadDate :
    T extends FieldSchemaForReadFunc<typeof fromReadDateTime> ? typeof fromReadDateTime :
    T extends FieldSchemaForReadFunc<typeof fromReadDuration> ? typeof fromReadDuration :
    T extends FieldSchemaForReadFunc<typeof fromReadEmail> ? typeof fromReadEmail :
    T extends FieldSchemaForReadFunc<typeof fromReadExternalSyncSource> ? typeof fromReadExternalSyncSource :
    T extends FieldSchemaForReadFunc<typeof fromReadFormula> ? typeof fromReadFormula :
    T extends FieldSchemaForReadFunc<typeof fromReadLastModifiedBy> ? typeof fromReadLastModifiedBy :
    T extends FieldSchemaForReadFunc<typeof fromReadLastModifiedTime> ? typeof fromReadLastModifiedTime :
    T extends FieldSchemaForReadFunc<typeof fromReadMultilineText> ? typeof fromReadMultilineText :
    T extends FieldSchemaForReadFunc<typeof fromReadMultipleAttachments> ? typeof fromReadMultipleAttachments :
    T extends FieldSchemaForReadFunc<typeof fromReadMultipleCollaborators> ? typeof fromReadMultipleCollaborators :
    T extends FieldSchemaForReadFunc<typeof fromReadMultipleLookupValues> ? typeof fromReadMultipleLookupValues :
    T extends FieldSchemaForReadFunc<typeof fromReadMultipleRecordLinks> ? typeof fromReadMultipleRecordLinks :
    T extends FieldSchemaForReadFunc<typeof fromReadMultipleSelects> ? typeof fromReadMultipleSelects<T> :
    T extends FieldSchemaForReadFunc<typeof fromReadNumber> ? typeof fromReadNumber :
    T extends FieldSchemaForReadFunc<typeof fromReadPercent> ? typeof fromReadPercent :
    T extends FieldSchemaForReadFunc<typeof fromReadPhoneNumber> ? typeof fromReadPhoneNumber :
    T extends FieldSchemaForReadFunc<typeof fromReadRating> ? typeof fromReadRating :
    T extends FieldSchemaForReadFunc<typeof fromReadRichText> ? typeof fromReadRichText :
    T extends FieldSchemaForReadFunc<typeof fromReadRollup> ? typeof fromReadRollup :
    T extends FieldSchemaForReadFunc<typeof fromReadSingleCollaborator> ? typeof fromReadSingleCollaborator :
    T extends FieldSchemaForReadFunc<typeof fromReadSingleLineText> ? typeof fromReadSingleLineText :
    T extends FieldSchemaForReadFunc<typeof fromReadSingleSelect> ? typeof fromReadSingleSelect<T> :
    T extends FieldSchemaForReadFunc<typeof fromReadUrl> ? typeof fromReadUrl :
    never;
const FROM_READ_CONVERTERS = {
    aiText: fromReadAiText,
    autoNumber: fromReadAutoNumber,
    barcode: fromReadBarcode,
    checkbox: fromReadCheckbox,
    count: fromReadCount,
    createdBy: fromReadCreatedBy,
    createdTime: fromReadCreatedTime,
    currency: fromReadCurrency,
    date: fromReadDate,
    dateTime: fromReadDateTime,
    duration: fromReadDuration,
    email: fromReadEmail,
    externalSyncSource: fromReadExternalSyncSource,
    formula: fromReadFormula,
    lastModifiedBy: fromReadLastModifiedBy,
    lastModifiedTime: fromReadLastModifiedTime,
    multilineText: fromReadMultilineText,
    multipleAttachments: fromReadMultipleAttachments,
    multipleCollaborators: fromReadMultipleCollaborators,
    multipleLookupValues: fromReadMultipleLookupValues,
    multipleRecordLinks: fromReadMultipleRecordLinks,
    multipleSelects: fromReadMultipleSelects,
    number: fromReadNumber,
    percent: fromReadPercent,
    phoneNumber: fromReadPhoneNumber,
    rating: fromReadRating,
    richText: fromReadRichText,
    rollup: fromReadRollup,
    singleCollaborator: fromReadSingleCollaborator,
    singleLineText: fromReadSingleLineText,
    singleSelect: fromReadSingleSelect,
    url: fromReadUrl,
} as const;

export type FieldSchemaFromRead = Parameters<typeof FROM_READ_CONVERTERS[keyof typeof FROM_READ_CONVERTERS]>[1];
export type ValueFromRead<F extends FieldSchemaFromRead = FieldSchemaFromRead> = ReturnType<ReadFuncFromFieldSchema<F>>;

/**
 * Given a field schema, convert a value from the raw Airtable API format into the appropriate TypeScript type.
 * 
 * The raw API doesn't include "falsy" values when reading records,
 * such as empty string, False for checkboxes, empty dates or null numbers, etc.
 * We fill in those missing values with sane defaults depening on the field schema,
 * eg the empty string for text-like fields, empty arrays for multi-value fields,
 * or an explicit `null` for eg number and date fields.
 * 
 * We also verify the values are consistent with the field schema for single and multi-select fields.
 * The API only returns the name of the selected option(s),
 * so potentially an option could have gotten renamed, or a new option added.
 * In that case, we would receive a value that doesn't match any of the options defined
 * in the field schema, and we throw a {@link ReadValueConversionError} in that case.
 * 
 * @param value The raw value from the Airtable API
 * @param fieldSchema The {@link FieldSchemaFromRead} describing the field.
 *                    This must include at least the `type` property, and if applicable, the `options` property.
 * @returns The value in the appropriate TypeScript type
 *
 * @throws {@link FieldNotReadableError} if the field type cannot be read.
 * @throws {@link ReadValueConversionError} if the value could not be converted.
 */
export function convertValueFromRead<F extends FieldSchemaFromRead>(
    value: unknown,
    fieldSchema: F,
): ValueFromRead<F> {
    const type = fieldSchema.type;
    const converterFunc = FROM_READ_CONVERTERS[type];
    if (!converterFunc) {
        throw new Error(`No converter found for field: ${JSON.stringify(fieldSchema)}`);
    }
    try {
        return (converterFunc as (value: unknown, fieldSchema: unknown) => unknown)(value, fieldSchema) as ValueFromRead<F>;
    } catch (e) {
        // if it's already a ReadValueConversionError, just re-throw it
        if (e instanceof ReadValueConversionError) {
            throw e;
        }
        throw new ReadValueConversionError(value, fieldSchema, e as Error);
    }
}

// TODO: this is the wrong parameters, this is saying each convert can handle any field schema,
// but in reality each converter only handles one specific field schema type.
// type ToWriteConverterFunc<T extends FieldSchemaTypeAndOptions = FieldSchemaTypeAndOptions> = (value: any, fieldSchema: T) => any;
type ToWriteConverterFunc = ((value: any, fieldSchema: any) => any) | ((value: never, fieldSchema: any) => never);
type FieldSchemaForWriteFunc<F extends ToWriteConverterFunc> =
    F extends (value: any, fieldSchema: infer S) => any ? S : never;
type WriteFuncFromFieldSchema<T extends FieldSchemaForWrite> =
    T extends FieldSchemaForWriteFunc<typeof toWriteAiText> ? typeof toWriteAiText :
    T extends FieldSchemaForWriteFunc<typeof toWriteAutoNumber> ? typeof toWriteAutoNumber :
    T extends FieldSchemaForWriteFunc<typeof toWriteBarcode> ? typeof toWriteBarcode :
    T extends FieldSchemaForWriteFunc<typeof toWriteCheckbox> ? typeof toWriteCheckbox :
    T extends FieldSchemaForWriteFunc<typeof toWriteCount> ? typeof toWriteCount :
    T extends FieldSchemaForWriteFunc<typeof toWriteCreatedBy> ? typeof toWriteCreatedBy :
    T extends FieldSchemaForWriteFunc<typeof toWriteCreatedTime> ? typeof toWriteCreatedTime :
    T extends FieldSchemaForWriteFunc<typeof toWriteCurrency> ? typeof toWriteCurrency :
    T extends FieldSchemaForWriteFunc<typeof toWriteDate> ? typeof toWriteDate :
    T extends FieldSchemaForWriteFunc<typeof toWriteDateTime> ? typeof toWriteDateTime :
    T extends FieldSchemaForWriteFunc<typeof toWriteDuration> ? typeof toWriteDuration :
    T extends FieldSchemaForWriteFunc<typeof toWriteEmail> ? typeof toWriteEmail :
    T extends FieldSchemaForWriteFunc<typeof toWriteExternalSyncSource> ? typeof toWriteExternalSyncSource :
    T extends FieldSchemaForWriteFunc<typeof toWriteFormula> ? typeof toWriteFormula :
    T extends FieldSchemaForWriteFunc<typeof toWriteLastModifiedBy> ? typeof toWriteLastModifiedBy :
    T extends FieldSchemaForWriteFunc<typeof toWriteLastModifiedTime> ? typeof toWriteLastModifiedTime :
    T extends FieldSchemaForWriteFunc<typeof toWriteMultilineText> ? typeof toWriteMultilineText :
    T extends FieldSchemaForWriteFunc<typeof toWriteMultipleAttachments> ? typeof toWriteMultipleAttachments :
    T extends FieldSchemaForWriteFunc<typeof toWriteMultipleCollaborators> ? typeof toWriteMultipleCollaborators :
    T extends FieldSchemaForWriteFunc<typeof toWriteMultipleLookupValues> ? typeof toWriteMultipleLookupValues :
    T extends FieldSchemaForWriteFunc<typeof toWriteMultipleRecordLinks> ? typeof toWriteMultipleRecordLinks :
    T extends FieldSchemaForWriteFunc<typeof toWriteMultipleSelects> ? typeof toWriteMultipleSelects<T> :
    T extends FieldSchemaForWriteFunc<typeof toWriteNumber> ? typeof toWriteNumber :
    T extends FieldSchemaForWriteFunc<typeof toWritePercent> ? typeof toWritePercent :
    T extends FieldSchemaForWriteFunc<typeof toWritePhoneNumber> ? typeof toWritePhoneNumber :
    T extends FieldSchemaForWriteFunc<typeof toWriteRating> ? typeof toWriteRating :
    T extends FieldSchemaForWriteFunc<typeof toWriteRichText> ? typeof toWriteRichText :
    T extends FieldSchemaForWriteFunc<typeof toWriteRollup> ? typeof toWriteRollup :
    T extends FieldSchemaForWriteFunc<typeof toWriteSingleCollaborator> ? typeof toWriteSingleCollaborator :
    T extends FieldSchemaForWriteFunc<typeof toWriteSingleLineText> ? typeof toWriteSingleLineText :
    T extends FieldSchemaForWriteFunc<typeof toWriteSingleSelect> ? typeof toWriteSingleSelect<T> :
    T extends FieldSchemaForWriteFunc<typeof toWriteUrl> ? typeof toWriteUrl :
    never;
const TO_WRITE_CONVERTERS = {
    aiText: toWriteAiText,
    autoNumber: toWriteAutoNumber,
    barcode: toWriteBarcode,
    checkbox: toWriteCheckbox,
    count: toWriteCount,
    createdBy: toWriteCreatedBy,
    createdTime: toWriteCreatedTime,
    currency: toWriteCurrency,
    date: toWriteDate,
    dateTime: toWriteDateTime,
    duration: toWriteDuration,
    email: toWriteEmail,
    externalSyncSource: toWriteExternalSyncSource,
    formula: toWriteFormula,
    lastModifiedBy: toWriteLastModifiedBy,
    lastModifiedTime: toWriteLastModifiedTime,
    multilineText: toWriteMultilineText,
    multipleAttachments: toWriteMultipleAttachments,
    multipleCollaborators: toWriteMultipleCollaborators,
    multipleLookupValues: toWriteMultipleLookupValues,
    multipleRecordLinks: toWriteMultipleRecordLinks,
    multipleSelects: toWriteMultipleSelects,
    number: toWriteNumber,
    percent: toWritePercent,
    phoneNumber: toWritePhoneNumber,
    rating: toWriteRating,
    richText: toWriteRichText,
    rollup: toWriteRollup,
    singleCollaborator: toWriteSingleCollaborator,
    singleLineText: toWriteSingleLineText,
    singleSelect: toWriteSingleSelect,
    url: toWriteUrl,
} as const;

export type FieldSchemaForWrite = Parameters<typeof TO_WRITE_CONVERTERS[keyof typeof TO_WRITE_CONVERTERS]>[1];
export type ValueForWrite<F extends FieldSchemaForWrite = FieldSchemaForWrite> = Parameters<WriteFuncFromFieldSchema<F>>[0];

/**
 * Using the given field schema, convert a value into a format suitable for writing to Airtable.
 * 
 * For example, for single and multi-select fields, you can pass values
 * by either option name (eg "In Progress") or option ID (eg "selXXXXXXXXXXX"),
 * and this function will convert them to always use option IDs,
 * so you are safe from issues if an option name is changed in Airtable.
 * 
 * @param value The value in the appropriate TypeScript type
 * @param fieldSchema The {@link FieldSchemaForWrite} describing the field.
 *                    This is a subset of the full field schema, containing only
 *                    the field type, and for certain field types, the options.
 * @returns The raw value that will be converted to Airtable API format
 *
 * @throws {@link FieldNotWritableError} if the field type cannot be written to.
 * @throws {@link WriteValueConversionError} if the value could not be converted for writing.
 */
export function convertValueForWrite<F extends FieldSchemaForWrite>(
    value: ValueForWrite<F>,
    fieldSchema: F,
): unknown {
    const type = fieldSchema.type;
    const converterFunc = TO_WRITE_CONVERTERS[type];
    if (!converterFunc) {
        throw new Error(`No converter found for field: ${JSON.stringify(fieldSchema)}`);
    }
    try {
        return (converterFunc as (value: unknown, fieldSchema: unknown) => unknown)(value, fieldSchema);
    } catch (e) {
        // if it's already a WriteValueConversionError, just re-throw it
        if (e instanceof WriteValueConversionError) {
            throw e;
        }
        throw new WriteValueConversionError(value, fieldSchema, e as Error);
    }
}


/**
 * Thrown when a value read from the Airtable API could not be converted to the appropriate TypeScript type.
 */
export class ReadValueConversionError extends AirtableKitError {
    public readonly fieldSchema: FieldSchemaFromRead;
    public readonly value: unknown;
    public readonly originalError?: Error;
    constructor(value: unknown, fieldSchema: FieldSchemaFromRead, originalError?: Error) {
        super(`Value not convertible for field ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type}): ${value}`);
        this.value = value;
        this.fieldSchema = fieldSchema;
        this.originalError = originalError;
        this.name = "ReadValueNotConvertibleError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, ReadValueConversionError.prototype);
    }
}

/**
 * Thrown when a value could not be converted to write to the Airtable API.
 */
export class WriteValueConversionError extends AirtableKitError {
    public readonly fieldSchema: FieldSchemaForWrite;
    public readonly value: unknown;
    public readonly originalError?: Error;
    constructor(value: unknown, fieldSchema: FieldSchemaForWrite, originalError?: Error) {
        super(`Value not convertible for writing to field ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type}): ${value}`);
        this.value = value;
        this.fieldSchema = fieldSchema;
        this.originalError = originalError;
        this.name = "WriteValueNotConvertibleError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, WriteValueConversionError.prototype);
    }
}

/** Thrown when attempting to read from a field that is not readable, eg a 'button' field */
export class FieldNotReadableError extends AirtableKitError {
    public readonly fieldSchema: FieldSchemaFromRead;
    constructor(fieldSchema: FieldSchemaFromRead) {
        super(`Field not readable: ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type})`);
        this.fieldSchema = fieldSchema;
        this.name = "FieldNotReadableError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, FieldNotReadableError.prototype);
    }
}

/** Thrown when attempting to write to a field that is not writable, eg a 'createdTime' field */
export class FieldNotWritableError extends AirtableKitError {
    public readonly fieldSchema: FieldSchemaForWrite;
    constructor(fieldSchema: FieldSchemaForWrite) {
        super(`Field not writable: ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type})`);
        this.fieldSchema = fieldSchema;
        this.name = "FieldNotWritableError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, FieldNotWritableError.prototype);
    }
}