/**
 * Converters for field values to/from Airtable API format.
 */

import * as types from "./types.ts";
import { AirtableKitError } from "../exceptions/common.ts";
import { AttachmentId, RecordId, SelectId } from "../types.ts";
import { extend } from "zod/mini";

/** ISO 8601 string in UTC, e.g. "2024-01-01T00:00:00.000Z" */
type UtcTimestamp = string;

// /**
//  * When converting values, we don't need the field name, id, description, or other metadata.
//  * We only need the type and (if they exist), the options.
//  * But other fields are still acceptable, including bogus ones.
//  */
type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;
type PartialExceptType<T extends { type: types.FieldType }> = PartialExcept<T, "type">;
type PartialExceptTypeAndOptions<T extends { type: types.FieldType }> =
    T extends { options: unknown } ? PartialExcept<T, "type" | "options"> :
    PartialExcept<T, "type">;

/**
 * When you pass undefined or null to a read converter, it often gets replaced
 * with a default value (e.g. null, empty array, false, etc).
 */
type CoalesceTo<T, Default> = T extends null | undefined ? Default : T;

// ============================================================================
// aiText

function fromReadAiText<F extends FieldOfType<"aiText">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.AiTextSchemaRead>): FromReadResult<F, V> {
    return value as FromReadResult<F, V>;
}
function toWriteAiText(value: never, fieldSchema: PartialExceptType<types.AiTextSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// autoNumber

function fromReadAutoNumber<F extends FieldOfType<"autoNumber">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.AutoNumberSchemaRead>): FromReadResult<F, V> {
    const t = typeof value;
    if (t !== "number") {
        const e = new Error(`autoNumber field ${JSON.stringify(fieldSchema)} should always receive a number, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as FromReadResult<F, V>;
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
function fromReadBarcode<F extends FieldOfType<"barcode">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.BarcodeSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteBarcode<F extends FieldOfType<"barcode">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.BarcodeSchemaRead>): ValueForWriteMap<F> {
    return (value ?? null) as ValueForWriteMap<F>;
}

// ============================================================================
// button

function fromReadButton(value: never, fieldSchema: PartialExceptType<types.ButtonSchemaRead>): never {
    throw new FieldNotReadableError(fieldSchema);
}
function toWriteButton(value: never, fieldSchema: PartialExceptType<types.ButtonSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// checkbox

function fromReadCheckbox<F extends FieldOfType<"checkbox">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.CheckboxSchemaRead>): FromReadResult<F, V> {
    return (value ?? false) as FromReadResult<F, V>;
}
function toWriteCheckbox<F extends FieldOfType<"checkbox">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.CheckboxSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? false) as ForWriteResultMap<F, V>;
}

// ============================================================================
// count

function fromReadCount<F extends FieldOfType<"count">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.CountSchemaRead>): FromReadResult<F, V> {
    if (typeof value !== "number") {
        const e = new Error(`count field ${JSON.stringify(fieldSchema)} should always receive a number, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as FromReadResult<F, V>;
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
function fromReadCreatedBy<F extends FieldOfType<"createdBy">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.CreatedBySchemaRead>): FromReadResult<F, V> {
    if (!value) {
        const e = new Error(`createdBy field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as FromReadResult<F, V>;
}
function toWriteCreatedBy(value: never, fieldSchema: PartialExceptType<types.CreatedBySchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// createdTime

function fromReadCreatedTime<F extends FieldOfType<"createdTime">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.CreatedTimeSchemaRead>): FromReadResult<F, V> {
    if (!value) {
        const e = new Error(`createdTime field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as FromReadResult<F, V>;
}
function toWriteCreatedTime(value: never, fieldSchema: PartialExceptType<types.CreatedTimeSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// currency

function fromReadCurrency<F extends FieldOfType<"currency">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.CurrencySchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteCurrency<F extends FieldOfType<"currency">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.CurrencySchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// date

type TDateString = `${number}-${number}-${number}`;
function fromReadDate<F extends FieldOfType<"date">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.DateSchemaRead>): FromReadResult<F, V> {
    if (!value) {
        return null as FromReadResult<F, V>;
    }
    const t = typeof value;
    if (t !== "string") {
        const e = new Error(`date field ${JSON.stringify(fieldSchema)} should always receive a string or null, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as FromReadResult<F, V>;
}
function toWriteDate<F extends FieldOfType<"date">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.DateSchemaRead>): ForWriteResultMap<F, V> {
    if (value instanceof globalThis.Date) {
        return (value.toISOString().split("T")[0]) as ForWriteResultMap<F, V>;
    }
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// dateTime

function fromReadDateTime<F extends FieldOfType<"dateTime">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.DateTimeSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteDateTime<F extends FieldOfType<"dateTime">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.DateTimeSchemaRead>): ForWriteResultMap<F, V> {
    if (value instanceof globalThis.Date) {
        return (value.toISOString()) as ForWriteResultMap<F, V>;
    }
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// duration

function fromReadDuration<F extends FieldOfType<"duration">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.DurationSchemaRead>): FromReadResult<F, V> {
    // return (value ?? null) as ValueFromReadMap<F, V>;
    return "foo" as FromReadResult<F, V>;
}
function toWriteDuration<F extends FieldOfType<"duration">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.DurationSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// email

function fromReadEmail<F extends FieldOfType<"email">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.EmailSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteEmail<F extends FieldOfType<"email">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.EmailSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// externalSyncSource

function fromReadExternalSyncSource<F extends FieldOfType<"externalSyncSource">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.ExternalSyncSourceSchemaRead>): FromReadResult<F, V> {
    return value as FromReadResult<F, V>;
}
function toWriteExternalSyncSource<F extends FieldOfType<"externalSyncSource">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.ExternalSyncSourceSchemaRead>): ForWriteResultMap<F, V> {
    return value as ForWriteResultMap<F, V>;
}

// ============================================================================
// formula
// Formula fields are read-only and their read value depends on the result type.
// For now, we pass through the raw value. A more sophisticated approach would
// use the result type from fieldSchema.options.result to properly convert.

type OptionsForDerivingResultType = { isValid: boolean; result: types.FieldTypeAndOptions };
type DerivedFieldTypes =
    | { type: "number", options: OptionsForDerivingResultType }
    | { type: "singleLineText", options: OptionsForDerivingResultType }
    | { type: "checkbox", options: OptionsForDerivingResultType }
type RawResultFromDerivedType<T extends DerivedFieldTypes, V extends FromReadInputValueMap<Extract<FieldSchemaNeededForRead, T>> = FromReadInputValueMap<Extract<FieldSchemaNeededForRead, T>>> =
    T["options"] extends { isValid: true; result: infer R extends DerivedFieldTypes } ? V extends FromReadInputValueMap<R> ? FromReadResult<R, V> : never : never;

type PartialExceptTypeAndResultTypeOptions<T extends { type: types.FieldType, options: OptionsForDerivingResultType }> =
    T extends { options: infer O extends OptionsForDerivingResultType } ? Pick<T, "type"> & { options: PartialExcept<O, "isValid" | "result"> } & Partial<Omit<T, "type" | "options">> : never

function fromReadFormula<F extends FieldOfType<"formula">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: F): FromReadResult<F, V> {
    return value as FromReadResult<F, V>;
}
function toWriteFormula(value: never, fieldSchema: PartialExceptType<types.FormulaSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// lastModifiedBy

function fromReadLastModifiedBy<F extends FieldOfType<"lastModifiedBy">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.LastModifiedBySchemaRead>): FromReadResult<F, V> {
    if (!value) {
        const e = new Error(`lastModifiedBy field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as FromReadResult<F, V>;
}
function toWriteLastModifiedBy(value: never, fieldSchema: PartialExceptType<types.LastModifiedBySchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// lastModifiedTime

function fromReadLastModifiedTime<F extends FieldOfType<"lastModifiedTime">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.LastModifiedTimeSchemaRead>): FromReadResult<F, V> {
    if (!value) {
        const e = new Error(`lastModifiedTime field ${JSON.stringify(fieldSchema)} should always receive a value, but got: ${value}`);
        throw new ReadValueConversionError(value, fieldSchema, e);
    }
    return value as FromReadResult<F, V>;
}
function toWriteLastModifiedTime(value: never, fieldSchema: PartialExceptType<types.LastModifiedTimeSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// multilineText

function fromReadMultilineText<F extends FieldOfType<"multilineText">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultilineTextSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteMultilineText<F extends FieldOfType<"multilineText">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultilineTextSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
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
function fromReadMultipleAttachments<F extends FieldOfType<"multipleAttachments">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultipleAttachmentsSchemaRead>): FromReadResult<F, V> {
    return (value ?? []) as FromReadResult<F, V>;
}
function toWriteMultipleAttachments<F extends FieldOfType<"multipleAttachments">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultipleAttachmentsSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// multipleCollaborators

function fromReadMultipleCollaborators<F extends FieldOfType<"multipleCollaborators">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultipleCollaboratorsSchemaRead>): FromReadResult<F, V> {
    return (value ?? []) as FromReadResult<F, V>;
}
function toWriteMultipleCollaborators<F extends FieldOfType<"multipleCollaborators">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultipleCollaboratorsSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? []) as ForWriteResultMap<F, V>;
}

// ============================================================================
// multipleLookupValues

function fromReadMultipleLookupValues<F extends FieldOfType<"multipleLookupValues">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: F): FromReadResult<F, V> {
    return (value ?? []) as FromReadResult<F, V>;
}
function toWriteMultipleLookupValues(
    value: never,
    fieldSchema: PartialExceptType<types.MultipleLookupValuesSchemaRead>
): never {
    throw new FieldNotWritableError(fieldSchema);
}

const fieldSchemaMultipleLookupValues = {
    type: "multipleLookupValues" as const,
    options: {
        isValid: true,
        result: { type: "number" as const, },
    },
} as const
let y: RawResultFromDerivedType<typeof fieldSchemaMultipleLookupValues, any>
let x: FromReadInputValueMap<typeof fieldSchemaMultipleLookupValues>

// let z = fromReadFormula(123, fieldSchema);
fromReadMultipleLookupValues([54], fieldSchemaMultipleLookupValues);
fromReadMultipleLookupValues([], fieldSchemaMultipleLookupValues);
// @ts-expect-error
fromReadMultipleLookupValues(["foo"], fieldSchemaMultipleLookupValues);

const fieldSchemaFormula = {
    type: "multipleLookupValues" as const,
    options: {
        isValid: true,
        result: { type: "singleLineText" as const },
    },
} as const
let ddd: RawResultFromDerivedType<typeof fieldSchemaFormula.options>
let fff: FromReadInputValueMap<typeof fieldSchemaFormula>

fromReadMultipleLookupValues(["foo"], fieldSchemaFormula);
fromReadMultipleLookupValues([], fieldSchemaFormula);

// ============================================================================
// multipleRecordLinks

function fromReadMultipleRecordLinks<F extends FieldOfType<"multipleRecordLinks">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultipleRecordLinksSchemaRead>): FromReadResult<F, V> {
    return (value ?? []) as FromReadResult<F, V>;
}
function toWriteMultipleRecordLinks<F extends FieldOfType<"multipleRecordLinks">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.MultipleRecordLinksSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? []) as ForWriteResultMap<F, V>;
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
    throw new Error(`Choice "${raw}" not found in field "${JSON.stringify(fieldSchema)}".Available choices: ${fieldSchema.options.choices.map((c) => c.name).join(", ")}`);
}

function fromReadMultipleSelects<F extends FieldOfType<"multipleSelects">, V extends FromReadInputValueMap<F>>(
    raw: V,
    fieldSchema: PartialExceptTypeAndOptions<types.MultipleSelectsSchemaRead>
): FromReadResult<F, V> {
    if (!raw) return [] as FromReadResult<F, V>;
    return ((raw as Array<string>).map((item) => convertFromReadSelectValue(item, fieldSchema))) as FromReadResult<F, V>;
}

function toWriteMultipleSelects<F extends FieldOfType<"multipleSelects">, V extends ValueForWriteMap<F>>(
    idsOrNames: V,
    fieldSchema: PartialExceptTypeAndOptions<types.MultipleSelectsSchemaRead>
): ForWriteResultMap<F, V> {
    if (!idsOrNames) return [] as ForWriteResultMap<F, V>;
    const choices = fieldSchema.options.choices;
    return ((idsOrNames as any[]).map((idOrValue: string) => {
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
            } `,
        );
    })) as ForWriteResultMap<F, V>;
}

// ============================================================================
// number

function fromReadNumber<F extends FieldOfType<"number">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.NumberSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteNumber<F extends FieldOfType<"number">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.NumberSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// percent

function fromReadPercent<F extends FieldOfType<"percent">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.PercentSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWritePercent<F extends FieldOfType<"percent">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.PercentSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// phoneNumber

function fromReadPhoneNumber<F extends FieldOfType<"phoneNumber">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.PhoneNumberSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWritePhoneNumber<F extends FieldOfType<"phoneNumber">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.PhoneNumberSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// rating

function fromReadRating<F extends FieldOfType<"rating">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.RatingSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteRating<F extends FieldOfType<"rating">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.RatingSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// richText

function fromReadRichText<F extends FieldOfType<"richText">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.RichTextSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteRichText<F extends FieldOfType<"richText">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.RichTextSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// rollup
// Rollup fields are read-only and their read value depends on the result type.

function fromReadRollup<F extends FieldOfType<"rollup">, V extends FromReadInputValueMap<F>>(
    value: V,
    fieldSchema: F,
): FromReadResult<F, V> {
    return value as FromReadResult<F, V>;
}
function toWriteRollup(value: never, fieldSchema: PartialExceptType<types.RollupSchemaRead>): never {
    throw new FieldNotWritableError(fieldSchema);
}

// ============================================================================
// singleCollaborator

function fromReadSingleCollaborator<F extends FieldOfType<"singleCollaborator">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.SingleCollaboratorSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteSingleCollaborator<F extends FieldOfType<"singleCollaborator">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.SingleCollaboratorSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// singleLineText

function fromReadSingleLineText<F extends FieldOfType<"singleLineText">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.SingleLineTextSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteSingleLineText<F extends FieldOfType<"singleLineText">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.SingleLineTextSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================
// singleSelect

function fromReadSingleSelect<F extends FieldOfType<"singleSelect">, V extends FromReadInputValueMap<F>>(
    value: V,
    fieldSchema: PartialExceptTypeAndOptions<types.SingleSelectSchemaRead>
): FromReadResult<F, V> {
    if (!value) {
        return null as FromReadResult<F, V>;
    }
    return (convertFromReadSelectValue(value as string, fieldSchema)) as FromReadResult<F, V>;
}
function toWriteSingleSelect<F extends FieldOfType<"singleSelect">, V extends ValueForWriteMap<F>>(
    idOrName: V,
    fieldSchema: PartialExceptTypeAndOptions<types.SingleSelectSchemaRead>
): ForWriteResultMap<F, V> {
    if (idOrName === null || idOrName === undefined) {
        return null as ForWriteResultMap<F, V>;
    }
    const choices = fieldSchema.options.choices;
    let found = choices.find((option) => option.id === idOrName);
    if (found) {
        return (found.id) as ForWriteResultMap<F, V>;
    }
    found = choices.find((option) => option.name === idOrName);
    if (found) {
        return (found.id) as ForWriteResultMap<F, V>;
    }
    const availableOptions = choices.map((o) => o.name);
    availableOptions.push(...choices.map((o) => o.id));
    throw new Error(
        `No option found for value '${idOrName}'.Available options: ${availableOptions.join(", ")} `,
    );
}

// ============================================================================
// url

function fromReadUrl<F extends FieldOfType<"url">, V extends FromReadInputValueMap<F>>(value: V, fieldSchema: PartialExceptType<types.UrlSchemaRead>): FromReadResult<F, V> {
    return (value ?? null) as FromReadResult<F, V>;
}
function toWriteUrl<F extends FieldOfType<"url">, V extends ValueForWriteMap<F>>(value: V, fieldSchema: PartialExceptType<types.UrlSchemaRead>): ForWriteResultMap<F, V> {
    return (value ?? null) as ForWriteResultMap<F, V>;
}

// ============================================================================

export type FieldSchemaFromRead = Parameters<typeof FROM_READ_CONVERTERS[keyof typeof FROM_READ_CONVERTERS]>[1];

type ChoicesOptions = { choices: ReadonlyArray<{ id: SelectId; name: string }> };
type FieldSchemaNeededForRead =
    | { type: "aiText" }
    | { type: "autoNumber" }
    | { type: "barcode" }
    | { type: "button" }
    | { type: "checkbox" }
    | { type: "count" }
    | { type: "createdBy" }
    | { type: "createdTime" }
    | { type: "currency" }
    | { type: "date" }
    | { type: "dateTime" }
    | { type: "duration" }
    | { type: "email" }
    | { type: "externalSyncSource" }
    | { type: "formula", options: OptionsForDerivingResultType }
    | { type: "lastModifiedBy" }
    | { type: "lastModifiedTime" }
    | { type: "multilineText" }
    | { type: "multipleAttachments" }
    | { type: "multipleCollaborators" }
    | { type: "multipleLookupValues", options: OptionsForDerivingResultType }
    | { type: "multipleRecordLinks" }
    | { type: "multipleSelects", options: ChoicesOptions }
    | { type: "number" }
    | { type: "percent" }
    | { type: "phoneNumber" }
    | { type: "rating" }
    | { type: "richText" }
    | { type: "rollup", options: OptionsForDerivingResultType }
    | { type: "singleCollaborator" }
    | { type: "singleLineText" }
    | { type: "singleSelect", options: ChoicesOptions }
    | { type: "url" }

type FieldOfType<T extends types.FieldType> = Extract<FieldSchemaNeededForRead, { type: T }>;

type FromReadInputValueMap<F extends FieldSchemaNeededForRead> =
    IsFieldOfType<F, "aiText"> extends true ? types.AiTextValueRead :
    IsFieldOfType<F, "autoNumber"> extends true ? number :
    IsFieldOfType<F, "barcode"> extends true ? BarcodeValue | null | undefined :
    IsFieldOfType<F, "button"> extends true ? never :
    IsFieldOfType<F, "checkbox"> extends true ? boolean | null | undefined :
    IsFieldOfType<F, "count"> extends true ? number :
    IsFieldOfType<F, "createdBy"> extends true ? User :
    IsFieldOfType<F, "createdTime"> extends true ? UtcTimestamp :
    IsFieldOfType<F, "currency"> extends true ? number | null | undefined :
    IsFieldOfType<F, "date"> extends true ? TDateString | null | undefined :
    IsFieldOfType<F, "dateTime"> extends true ? UtcTimestamp | null | undefined :
    IsFieldOfType<F, "duration"> extends true ? number | null | undefined :
    IsFieldOfType<F, "email"> extends true ? string | null | undefined :
    IsFieldOfType<F, "externalSyncSource"> extends true ? unknown :
    IsFieldOfType<F, "formula"> extends true ? RawResultFromDerivedType<F extends { options: OptionsForDerivingResultType } ? F : never, any> :
    IsFieldOfType<F, "lastModifiedBy"> extends true ? User :
    IsFieldOfType<F, "lastModifiedTime"> extends true ? UtcTimestamp :
    IsFieldOfType<F, "multilineText"> extends true ? string | null | undefined :
    IsFieldOfType<F, "multipleAttachments"> extends true ? Array<MultipleAttachmentReadType> | null | undefined :
    IsFieldOfType<F, "multipleCollaborators"> extends true ? User[] | null | undefined :
    IsFieldOfType<F, "multipleLookupValues"> extends true ? null | undefined | Array<RawResultFromDerivedType<F extends { options: OptionsForDerivingResultType } ? F["options"] : never, any>> :
    IsFieldOfType<F, "multipleRecordLinks"> extends true ? Array<RecordId> | null | undefined :
    IsFieldOfType<F, "multipleSelects"> extends true ? F extends { options: ChoicesOptions } ? Array<F["options"]["choices"][number]["name"]> | null | undefined : never :
    IsFieldOfType<F, "number"> extends true ? number | null | undefined :
    IsFieldOfType<F, "percent"> extends true ? number | null | undefined :
    IsFieldOfType<F, "phoneNumber"> extends true ? string | null | undefined :
    IsFieldOfType<F, "rating"> extends true ? number | null | undefined :
    IsFieldOfType<F, "richText"> extends true ? string | null | undefined :
    IsFieldOfType<F, "rollup"> extends true ? RawResultFromDerivedType<F extends { options: OptionsForDerivingResultType } ? F["options"] : never, any> :
    IsFieldOfType<F, "singleCollaborator"> extends true ? User | null | undefined :
    IsFieldOfType<F, "singleLineText"> extends true ? string | null | undefined :
    IsFieldOfType<F, "singleSelect"> extends true ? F extends { options: ChoicesOptions } ? F["options"]["choices"][number]["name"] | null | undefined : never :
    IsFieldOfType<F, "url"> extends true ? string | null | undefined :
    unknown;

type FromReadResult<F extends FieldSchemaNeededForRead, V extends FromReadInputValueMap<F> = FromReadInputValueMap<F>> =
    IsFieldOfType<F, "aiText"> extends true ? V :
    IsFieldOfType<F, "autoNumber"> extends true ? V :
    IsFieldOfType<F, "barcode"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "button"> extends true ? never :
    IsFieldOfType<F, "checkbox"> extends true ? CoalesceTo<V, false> :
    IsFieldOfType<F, "count"> extends true ? number :
    IsFieldOfType<F, "createdBy"> extends true ? User :
    IsFieldOfType<F, "createdTime"> extends true ? UtcTimestamp :
    IsFieldOfType<F, "currency"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "date"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "dateTime"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "duration"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "email"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "externalSyncSource"> extends true ? unknown :
    IsFieldOfType<F, "formula"> extends true ? RawResultFromDerivedType<F extends { options: OptionsForDerivingResultType } ? F["options"] : never, V> :
    IsFieldOfType<F, "lastModifiedBy"> extends true ? User :
    IsFieldOfType<F, "lastModifiedTime"> extends true ? UtcTimestamp :
    IsFieldOfType<F, "multilineText"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "multipleAttachments"> extends true ? CoalesceTo<V, []> :
    IsFieldOfType<F, "multipleCollaborators"> extends true ? CoalesceTo<V, []> :
    IsFieldOfType<F, "multipleLookupValues"> extends true ? CoalesceTo<V, []> :
    IsFieldOfType<F, "multipleRecordLinks"> extends true ? CoalesceTo<V, []> :
    IsFieldOfType<F, "multipleSelects"> extends true ? CoalesceTo<V, []> :
    IsFieldOfType<F, "number"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "percent"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "phoneNumber"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "rating"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "richText"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "rollup"> extends true ? RawResultFromDerivedType<F extends { options: OptionsForDerivingResultType } ? F["options"] : never, V> :
    IsFieldOfType<F, "singleCollaborator"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "singleLineText"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "singleSelect"> extends true ? CoalesceTo<V, null> :
    IsFieldOfType<F, "url"> extends true ? CoalesceTo<V, null> :
    unknown;


// @ts-expect-error
type A = FromReadResult<{ type: "singleSelect", options: { choices: [{ id: "sel1", name: "choice1" }] } }, 2>;
type B = FromReadResult<{ type: "singleSelect", options: { choices: [{ id: "sel1", name: "choice1" }] } }, "choice1">;
type C = FromReadResult<{ type: "formula", options: { isValid: true, result: { type: "number" } } }, 123>;
// @ts-expect-error C should be narrowed to exactly 123, not any number
const c: C = 456
type D = FromReadResult<{ type: "formula", options: { isValid: true, result: { type: "number" } } }, "string-instead-of-number">;
// @ts-expect-error
const d: D = 456


const FROM_READ_CONVERTERS = {
    aiText: fromReadAiText,
    autoNumber: fromReadAutoNumber,
    barcode: fromReadBarcode,
    button: fromReadButton,
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
export function convertValueFromRead<F extends FieldSchemaNeededForRead, V extends FromReadInputValueMap<F>>(
    value: V,
    fieldSchema: F,
): FromReadResult<F, V> {
    const type = fieldSchema.type;
    const converterFunc = FROM_READ_CONVERTERS[type];
    if (!converterFunc) {
        throw new Error(`No converter found for field: ${JSON.stringify(fieldSchema)} `);
    }
    try {
        return (converterFunc as (value: unknown, fieldSchema: unknown) => unknown)(value, fieldSchema) as FromReadResult<F, V>;
    } catch (e) {
        // if it's already a ReadValueConversionError, just re-throw it
        if (e instanceof ReadValueConversionError) {
            throw e;
        }
        throw new ReadValueConversionError(value, fieldSchema, e as Error);
    }
}

export type FieldSchemaForWrite = Parameters<typeof TO_WRITE_CONVERTERS[keyof typeof TO_WRITE_CONVERTERS]>[1];

type IsFieldOfType<S extends { type: types.FieldType }, F extends types.FieldType> = S["type"] extends F ? true : false;
type ValueForWriteMap<F> =
    F extends { type: "aiText" } ? never :
    F extends { type: "autoNumber" } ? never :
    F extends { type: "barcode" } ? BarcodeValue | null | undefined :
    F extends { type: "button" } ? never :
    F extends { type: "checkbox" } ? boolean | null | undefined :
    F extends { type: "count" } ? never :
    F extends { type: "createdBy" } ? never :
    F extends { type: "createdTime" } ? never :
    F extends { type: "currency" } ? number | null | undefined :
    F extends { type: "date" } ? globalThis.Date | TDateString | null | undefined :
    F extends { type: "dateTime" } ? globalThis.Date | string | null | undefined :
    F extends { type: "duration" } ? number | null | undefined :
    F extends { type: "email" } ? string | null | undefined :
    F extends { type: "externalSyncSource" } ? unknown :
    F extends { type: "formula" } ? never :
    F extends { type: "lastModifiedBy" } ? never :
    F extends { type: "lastModifiedTime" } ? never :
    F extends { type: "multilineText" } ? string | null | undefined :
    F extends { type: "multipleAttachments" } ? ReadonlyArray<MultipleAttachmentWriteType> | null | undefined :
    F extends { type: "multipleCollaborators" } ? User[] | null | undefined :
    F extends { type: "multipleLookupValues" } ? never :
    F extends { type: "multipleRecordLinks" } ? ReadonlyArray<RecordId> | null | undefined :
    F extends PartialExceptTypeAndOptions<types.MultipleSelectsSchemaRead> ? null | undefined | ReadonlyArray<F["options"]["choices"][number]["id"] | F["options"]["choices"][number]["name"]> :
    F extends { type: "number" } ? number | null | undefined :
    F extends { type: "percent" } ? number | null | undefined :
    F extends { type: "phoneNumber" } ? string | null | undefined :
    F extends { type: "rating" } ? number | null | undefined :
    F extends { type: "richText" } ? string | null | undefined :
    F extends { type: "rollup" } ? never :
    F extends { type: "singleCollaborator" } ? UserWrite | null | undefined :
    F extends { type: "singleLineText" } ? string | null | undefined :
    F extends PartialExceptTypeAndOptions<types.SingleSelectSchemaRead> ? F["options"]["choices"][number]["id"] | F["options"]["choices"][number]["name"] | null | undefined :
    F extends { type: "url" } ? string | null | undefined :
    unknown;

type ForWriteResultMap<F, V> =
    F extends { type: "aiText" } ? never :
    F extends { type: "autoNumber" } ? never :
    F extends { type: "barcode" } ? CoalesceTo<V, null> :
    F extends { type: "button" } ? never :
    F extends { type: "checkbox" } ? CoalesceTo<V, false> :
    F extends { type: "count" } ? never :
    F extends { type: "createdBy" } ? never :
    F extends { type: "createdTime" } ? never :
    F extends { type: "currency" } ? CoalesceTo<V, null> :
    F extends { type: "date" } ? CoalesceTo<V extends globalThis.Date ? TDateString : V, null> :
    F extends { type: "dateTime" } ? CoalesceTo<V extends globalThis.Date ? string : V, null> :
    F extends { type: "duration" } ? CoalesceTo<V, null> :
    F extends { type: "email" } ? CoalesceTo<V, null> :
    F extends { type: "externalSyncSource" } ? unknown :
    F extends { type: "formula" } ? never :
    F extends { type: "lastModifiedBy" } ? never :
    F extends { type: "lastModifiedTime" } ? never :
    F extends { type: "multilineText" } ? CoalesceTo<V, null> :
    F extends { type: "multipleAttachments" } ? CoalesceTo<V, null> :
    F extends { type: "multipleCollaborators" } ? CoalesceTo<V, User[]> :
    F extends { type: "multipleLookupValues" } ? never :
    F extends { type: "multipleRecordLinks" } ? CoalesceTo<V, ReadonlyArray<RecordId>> :
    F extends PartialExceptTypeAndOptions<types.MultipleSelectsSchemaRead> ? CoalesceTo<V, Array<F["options"]["choices"][number]["id"]>> :
    F extends { type: "number" } ? CoalesceTo<V, null> :
    F extends { type: "percent" } ? CoalesceTo<V, null> :
    F extends { type: "phoneNumber" } ? CoalesceTo<V, null> :
    F extends { type: "rating" } ? CoalesceTo<V, null> :
    F extends { type: "richText" } ? CoalesceTo<V, null> :
    F extends { type: "rollup" } ? never :
    F extends { type: "singleCollaborator" } ? CoalesceTo<V, null> :
    F extends { type: "singleLineText" } ? CoalesceTo<V, null> :
    F extends PartialExceptTypeAndOptions<types.SingleSelectSchemaRead> ? CoalesceTo<V, null> :
    F extends { type: "url" } ? CoalesceTo<V, null> :
    unknown;

export type ValueForWrite<F extends FieldSchemaForWrite = FieldSchemaForWrite> = ValueForWriteMap<F>;
export type ForWriteResult<F extends FieldSchemaForWrite = FieldSchemaForWrite, V extends ValueForWrite<F> = ValueForWrite<F>> = ForWriteResultMap<F, V>;


const TO_WRITE_CONVERTERS = {
    aiText: toWriteAiText,
    autoNumber: toWriteAutoNumber,
    barcode: toWriteBarcode,
    button: toWriteButton,
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
export function convertValueForWrite<F extends FieldSchemaForWrite, V extends ValueForWrite<F>>(
    value: V,
    fieldSchema: F,
): ForWriteResult<F, V> {
    const type = fieldSchema.type;
    const converterFunc = TO_WRITE_CONVERTERS[type];
    if (!converterFunc) {
        throw new Error(`No converter found for field: ${JSON.stringify(fieldSchema)} `);
    }
    try {
        const result = (converterFunc as (value: unknown, fieldSchema: unknown) => unknown)(value, fieldSchema);
        return result as ForWriteResult<F, V>;
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
    public readonly fieldSchema: FieldSchemaNeededForRead;
    public readonly value: unknown;
    public readonly originalError?: Error;
    constructor(value: unknown, fieldSchema: FieldSchemaNeededForRead, originalError?: Error) {
        super(`Value not convertible for field ${fieldSchema.name}(id: ${fieldSchema.id}, type: ${fieldSchema.type}): ${value} `);
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