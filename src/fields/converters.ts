/**
 * Converters for field values to/from Airtable API format.
 */

import * as types from "./types.ts";
import { type FieldSchemaRead, type FieldType } from "./types.ts";
import { AttachmentId, RecordId, FieldId } from "../types.ts";
import * as exceptions from "../exceptions.ts";

/** ISO 8601 string in UTC, e.g. "2024-01-01T00:00:00.000Z" */
type UtcTimestamp = string;

// Minimal schema types needed for conversions
// These types only include the information actually used by converters,
// rather than the full FieldSchemaRead which includes UI display options etc.
export type AiTextForConvert = { type: 'aiText' };
export type AutoNumberForConvert = { type: 'autoNumber' };
export type BarcodeForConvert = { type: 'barcode' };
export type ButtonForConvert = { type: 'button' };
export type CheckboxForConvert = { type: 'checkbox' };
export type CountForConvert = { type: 'count' };
export type CreatedByForConvert = { type: 'createdBy' };
export type CreatedTimeForConvert = { type: 'createdTime' };
export type CurrencyForConvert = { type: 'currency' };
export type DateForConvert = { type: 'date' };
export type DateTimeForConvert = { type: 'dateTime' };
export type DurationForConvert = { type: 'duration' };
export type EmailForConvert = { type: 'email' };
export type ExternalSyncSourceForConvert = { type: 'externalSyncSource' };
export type FormulaForConvert = {
    type: 'formula';
    options: { result: Omit<FieldSchemaRead, "id" | "name" | "description"> };
};
export type LastModifiedByForConvert = { type: 'lastModifiedBy' };
export type LastModifiedTimeForConvert = { type: 'lastModifiedTime' };
export type MultilineTextForConvert = { type: 'multilineText' };
export type MultipleAttachmentsForConvert = { type: 'multipleAttachments' };
export type MultipleCollaboratorsForConvert = { type: 'multipleCollaborators' };
export type MultipleLookupValuesForConvert = {
    type: 'multipleLookupValues';
    options: { result: Omit<FieldSchemaRead, "id" | "name" | "description"> | null };
};
export type MultipleRecordLinksForConvert = { type: 'multipleRecordLinks' };
export type MultipleSelectsForConvert<C extends types.SelectChoiceSchemaRead = types.SelectChoiceSchemaRead> = {
    type: 'multipleSelects';
    options: { choices: ReadonlyArray<C> };
};
export type NumberForConvert = { type: 'number' };
export type PercentForConvert = { type: 'percent' };
export type PhoneNumberForConvert = { type: 'phoneNumber' };
export type RatingForConvert = { type: 'rating' };
export type RichTextForConvert = { type: 'richText' };
export type RollupForConvert = {
    type: 'rollup';
    options: { result: Omit<FieldSchemaRead, "id" | "name" | "description"> };
};
export type SingleCollaboratorForConvert = { type: 'singleCollaborator' };
export type SingleLineTextForConvert = { type: 'singleLineText' };
export type SingleSelectForConvert<C extends types.SelectChoiceSchemaRead = types.SelectChoiceSchemaRead> = {
    type: 'singleSelect';
    options: { choices: ReadonlyArray<C> };
};
export type UrlForConvert = { type: 'url' };

export type FieldForConvert =
    | AiTextForConvert
    | AutoNumberForConvert
    | BarcodeForConvert
    | ButtonForConvert
    | CheckboxForConvert
    | CountForConvert
    | CreatedByForConvert
    | CreatedTimeForConvert
    | CurrencyForConvert
    | DateForConvert
    | DateTimeForConvert
    | DurationForConvert
    | EmailForConvert
    | ExternalSyncSourceForConvert
    | FormulaForConvert
    | LastModifiedByForConvert
    | LastModifiedTimeForConvert
    | MultilineTextForConvert
    | MultipleAttachmentsForConvert
    | MultipleCollaboratorsForConvert
    | MultipleLookupValuesForConvert
    | MultipleRecordLinksForConvert
    | MultipleSelectsForConvert
    | NumberForConvert
    | PercentForConvert
    | PhoneNumberForConvert
    | RatingForConvert
    | RichTextForConvert
    | RollupForConvert
    | SingleCollaboratorForConvert
    | SingleLineTextForConvert
    | SingleSelectForConvert
    | UrlForConvert;

type ToAirtableConverter<T> = (value: T) => unknown;
type FromAirtableConverter<T> = (value: any) => T;
interface IConverters<
    ToArg,
    FromResult,
    F extends FieldForConvert,
> {
    type: F["type"];
    /** null implies the field can't be written to (eg is createdTime or formula) */
    makeTo: null | ((fieldSchema: F) => ToAirtableConverter<ToArg>);
    /** null implies the field can't be read from (eg is a button) */
    makeFrom: null | ((fieldSchema: F) => FromAirtableConverter<FromResult>);
}

type FieldOfType<T extends FieldType> = Extract<FieldSchemaRead, { type: T }>;
type FieldForConvertOfType<T extends FieldType> = Extract<FieldForConvert, { type: T }>;

const AiTextConverters = {
    type: "aiText",
    makeTo: null,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"aiText">) =>
            (value: types.AiTextValueRead): types.AiTextValueRead => value,
} as const satisfies IConverters<never, types.AiTextValueRead, FieldForConvertOfType<"aiText">>;

const AutoNumberConverters = {
    type: "autoNumber",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldForConvertOfType<"autoNumber">) => (value: number): number => {
            if (!value && value !== 0) {
                const e = new Error(`an autoNumber field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema as FieldSchemaRead, e);
            }
            return value;
        }
} as const satisfies IConverters<
    never,
    number,
    FieldForConvertOfType<"autoNumber">
>;

export interface BarcodeValue {
    text: string;
    type: string;
}
const BarcodeConverters = {
    type: "barcode",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"barcode">) =>
            (value: BarcodeValue | null | undefined): BarcodeValue | null | undefined => value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"barcode">) =>
            (value: unknown): BarcodeValue => value as BarcodeValue,
} as const satisfies IConverters<
    BarcodeValue | null | undefined,
    BarcodeValue | null,
    FieldForConvertOfType<"barcode">
>;

const ButtonConverters = {
    type: "button",
    makeTo: null,
    makeFrom: null,
} as const satisfies IConverters<never, never, FieldForConvertOfType<"button">>;

const CheckboxConverters = {
    type: "checkbox",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"checkbox">) => (value: boolean | null | undefined): boolean | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"checkbox">) =>
            // Airtable has no notion of undefined for checkboxes, it only stores true/false,
            // so during read, if the API omits the field, we convert that to false. 
            (value: boolean | null): boolean => value ?? false
} as const satisfies IConverters<
    boolean | null | undefined,
    boolean,
    FieldForConvertOfType<"checkbox">
>;

const CountConverters = {
    type: "count",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldForConvertOfType<"count">) => (value: number): number => {
            if (!value && value !== 0) {
                const e = new Error(`a count field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema as FieldSchemaRead, e);
            }
            return value;
        }
} as const satisfies IConverters<never, number, FieldForConvertOfType<"count">>;

interface User {
    /** User ID or group ID */
    id: string;
    /** User's email address */
    email?: string;
    /** User's display name (may be omitted if the user hasn't created an account) */
    name?: string;
    /** User's collaborator permission Level
     *
     * This is only included if you're observing a webhooks response.
     */
    permissionLevel?: "none" | "read" | "comment" | "edit" | "create";
    /** User's profile picture URL
     *
     * This is only included if it exists for the user and you're observing a webhooks response.
     */
    profilePicUrl?: string;
}
interface UserWrite {
    /** User ID or group ID */
    id: string;
    email: string;
}
const CreatedByConverters = {
    type: "createdBy",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldForConvertOfType<"createdBy">) => (value: User): User => {
            if (!value) {
                const e = new Error(`a createdBy field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema as FieldSchemaRead, e);
            }
            return value;
        }
} as const satisfies IConverters<never, User, FieldForConvertOfType<"createdBy">>;

const CreatedTimeConverters = {
    type: "createdTime",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldForConvertOfType<"createdTime">) =>
            (value: UtcTimestamp): UtcTimestamp => {
                if (value === null || value === undefined) {
                    const e = new Error(`a createdTime field must have a value, got: ${value}`);
                    throw new exceptions.ReadValueConversionError(value, fieldSchema as FieldSchemaRead, e);
                }
                return value;
            }
} as const satisfies IConverters<
    never,
    UtcTimestamp,
    FieldForConvertOfType<"createdTime">
>;

const CurrencyConverters = {
    type: "currency",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"currency">) => (value: number | null | undefined): number | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"currency">) => (value: number | null): number | null => value
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldForConvertOfType<"currency">
>;

type TDateString = `${number}-${number}-${number}`;
const DateConverters = {
    type: "date",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"date">) =>
            (value: globalThis.Date | TDateString | null | undefined): string | null | undefined => {
                if (value instanceof globalThis.Date) {
                    return value.toISOString().split("T")[0];
                }
                return value;
            },
    makeFrom: (_fieldSchema: FieldForConvertOfType<"date">) => (value: string | null): string | null => value,
} as const satisfies IConverters<
    globalThis.Date | TDateString | null | undefined,
    string | null,
    FieldForConvertOfType<"date">
>;

const DateTimeConverters = {
    type: "dateTime",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"dateTime">) =>
            (value: globalThis.Date | string | null | undefined): string | null | undefined => {
                if (value instanceof globalThis.Date) {
                    return value.toISOString();
                }
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"dateTime">) =>
            (value: UtcTimestamp | null): UtcTimestamp | null => value,
} as const satisfies IConverters<
    globalThis.Date | string | null | undefined,
    UtcTimestamp | null,
    FieldForConvertOfType<"dateTime">
>;

const DurationConverters = {
    type: "duration",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"duration">) => (value: number | null | undefined): number | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"duration">) => (value: number | null): number | null => value,
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldForConvertOfType<"duration">
>;

const EmailConverters = {
    type: "email",
    makeTo: (_: FieldForConvert) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldForConvert) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<string | null | undefined, string, FieldForConvertOfType<"email">>;

const ExternalSyncSourceConverters = {
    type: "externalSyncSource",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"externalSyncSource">) =>
            (value: unknown): unknown => value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"externalSyncSource">) =>
            (value: unknown): unknown => value,
} as const satisfies IConverters<
    unknown,
    unknown,
    FieldForConvertOfType<"externalSyncSource">
>;

type FormulaResultType<F extends FieldForConvertOfType<"formula">> = F["options"]["result"]
type FormulaReadType<F extends FieldForConvertOfType<"formula">> = ValueFromRead<FormulaResultType<F>>;
const FormulaConverters = {
    type: "formula",
    makeTo: null,
    makeFrom:
        <F extends FieldForConvertOfType<"formula">>(_fieldSchema: F) => (value: FormulaReadType<F>): FormulaReadType<F> => {
            return value;
        }
} as const;

const LastModifiedByConverters = {
    type: "lastModifiedBy",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldForConvertOfType<"lastModifiedBy">) => (value: unknown): User => {
            if (!value) {
                const e = new Error(`a lastModifiedBy field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema as FieldSchemaRead, e);
            }
            return value as User;
        }
} as const satisfies IConverters<
    never,
    User,
    FieldForConvertOfType<"lastModifiedBy">
>;

const LastModifiedTimeConverters = {
    type: "lastModifiedTime",
    makeTo: null,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"lastModifiedTime">) =>
            (value: UtcTimestamp): UtcTimestamp => {
                if (value === null || value === undefined) {
                    const e = new Error(`a lastModifiedTime field must have a value, got: ${value}`);
                    throw new exceptions.ReadValueConversionError(value, _fieldSchema as FieldSchemaRead, e);
                }
                return value;
            }
} as const satisfies IConverters<
    never,
    UtcTimestamp,
    FieldForConvertOfType<"lastModifiedTime">
>;

const MultilineTextConverters = {
    type: "multilineText",
    makeTo: (_: FieldForConvert) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldForConvert) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldForConvertOfType<"multilineText">
>;

type Thumbnail = {
    url: string;
    height: number;
    width: number;
}

// https://airtable.com/developers/web/api/field-model#multipleattachment
export type MultipleAttachmentReadType = {
    id: AttachmentId;
    /** MIME type, e.g. "image/png" */
    type: string;
    filename: string;
    url: string;
    /** in bytes */
    size: number;
    /** Only available for images. In pixels */
    width?: number;
    /** Only available for images. In pixels */
    height?: number;
    /** Only available for images and certain documents. */
    thumbnails?: {
        full?: Thumbnail;
        large?: Thumbnail;
        small?: Thumbnail;
    };
};
// When writing multiple attachments, you can either provide an existing attachment
// by its ID, or for new attachments, provide a URL (and optionally a filename) to upload from.
export type MultipleAttachmentWriteType = {
    id: AttachmentId;
} | {
    url: string;
    filename?: string;
};
const MultipleAttachmentsConverters = {
    type: "multipleAttachments",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"multipleAttachments">) =>
            (value: ReadonlyArray<MultipleAttachmentWriteType> | null | undefined): ReadonlyArray<MultipleAttachmentWriteType> | null | undefined => {
                if (!value) return value;
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"multipleAttachments">) =>
            (value: Array<MultipleAttachmentReadType> | null): Array<MultipleAttachmentReadType> => value ? value : [],
} as const satisfies IConverters<
    ReadonlyArray<MultipleAttachmentReadType> | null | undefined,
    Array<MultipleAttachmentReadType>,
    FieldForConvertOfType<"multipleAttachments">
>;
const MultipleCollaboratorsConverters = {
    type: "multipleCollaborators",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"multipleCollaborators">) =>
            (value: User[] | null | undefined): User[] => {
                if (!value) return [];
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"multipleCollaborators">) =>
            (value: User[] | null): User[] => value ? value : [],
} as const satisfies IConverters<
    User[],
    User[],
    FieldForConvertOfType<"multipleCollaborators">
>;

type MultipleLookupValuesResultType<F extends MultipleLookupValuesForConvert> = F["options"]["result"]
// Like ValueFromRead, but if the result type is null, then the output type is null
type ValueFromReadNullable<F extends null | Omit<FieldSchemaRead, "id" | "name">> = F extends null ? null : ValueFromRead<Exclude<F, null>>;
type MultipleLookupValuesReadType<F extends MultipleLookupValuesForConvert> = ValueFromReadNullable<MultipleLookupValuesResultType<F>>;
const MultipleLookupValuesConverters = {
    type: "multipleLookupValues",
    makeTo: null,
    makeFrom:
        <T extends FieldForConvertOfType<"multipleLookupValues">>(_fieldSchema: T) =>
            (value: null | MultipleLookupValuesReadType<T>[]): MultipleLookupValuesReadType<T>[] => value ? value : [],
} as const;

const MultipleRecordLinksConverters = {
    type: "multipleRecordLinks",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"multipleRecordLinks">) =>
            (value: RecordId[] | null | undefined): RecordId[] => {
                if (!value) return [];
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"multipleRecordLinks">) =>
            (value: null | RecordId[]): RecordId[] => {
                return value ? value : [];
            },
} as const satisfies IConverters<
    RecordId[] | null | undefined,
    RecordId[],
    FieldForConvertOfType<"multipleRecordLinks">
>;
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
    fieldSchema: MultipleSelectsForConvert<C> | SingleSelectForConvert<C>
): C["name"] {
    const foundChoiceByName = fieldSchema.options.choices.find((c) => c.name === raw);
    if (foundChoiceByName) {
        return raw;
    }
    throw new Error(`Choice "${raw}" not found in ${fieldSchema.type} field. Available choices: ${fieldSchema.options.choices.map((c) => c.name).join(", ")}`);
}

const MultipleSelectsConverters = {
    type: "multipleSelects",
    makeTo:
        <C extends types.SelectChoiceSchemaRead>(fieldSchema: MultipleSelectsForConvert<C>) =>
            (idsOrValues: Array<C["id"] | C["name"]> | null | undefined): Array<C["id"]> => {
                if (!idsOrValues) return [];
                const choices = fieldSchema.options.choices;
                return idsOrValues.map((idOrValue) => {
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
            },
    makeFrom:
        <C extends types.SelectChoiceSchemaRead>(fieldSchema: MultipleSelectsForConvert<C>) =>
            (value: unknown): Array<C["name"]> => {
                if (!value) return [];
                return (value as Array<string>).map((item) => convertFromReadSelectValue(item, fieldSchema));
            },
} as const;

const NumberConverters = {
    type: "number",
    makeTo: (_fieldSchema: FieldForConvertOfType<"number">) => (value: number | null | undefined): number | null | undefined =>
        value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"number">) => (value: number | null): number | null => value,
} as const satisfies IConverters<number | null | undefined, number | null | undefined, FieldForConvertOfType<"number">>;

const PercentConverters = {
    type: "percent",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"percent">) => (value: number | null | undefined): number | null | undefined => value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"percent">) => (value: number | null): number | null => value,
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldForConvertOfType<"percent">
>;

const PhoneNumberConverters = {
    type: "phoneNumber",
    makeTo: (_: FieldForConvert) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldForConvert) => (value: string | null): string | null => value,
} as const satisfies IConverters<
    string | null | undefined,
    string | null,
    FieldForConvertOfType<"phoneNumber">
>;

const RatingConverters = {
    type: "rating",
    makeTo: (_fieldSchema: FieldForConvertOfType<"rating">) => (value: number | null | undefined): number | null | undefined =>
        value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"rating">) => (value: number | null): number | null => value,
} as const satisfies IConverters<number | null | undefined, number | null, FieldForConvertOfType<"rating">>;

const RichTextConverters = {
    type: "richText",
    makeTo: (_: FieldForConvert) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldForConvert) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldForConvertOfType<"richText">
>;

type RollupResultType<F extends FieldForConvertOfType<"rollup">> = F["options"]["result"]
type RollupReadType<F extends FieldForConvertOfType<"rollup">> = ValueFromRead<RollupResultType<F>>;
const RollupConverters = {
    type: "rollup",
    makeTo: null,
    makeFrom:
        <T extends FieldForConvertOfType<"rollup">>(_fieldSchema: T) => (value: RollupReadType<T>): RollupReadType<T> => {
            return value;
        },
} as const;

const SingleCollaboratorConverters = {
    type: "singleCollaborator",
    makeTo:
        (_fieldSchema: FieldForConvertOfType<"singleCollaborator">) =>
            (value: UserWrite | null | undefined): UserWrite | null | undefined => value,
    makeFrom:
        (_fieldSchema: FieldForConvertOfType<"singleCollaborator">) =>
            (value: unknown): User | null => value as User | null,
} as const satisfies IConverters<
    UserWrite | null | undefined,
    User | null,
    FieldForConvertOfType<"singleCollaborator">
>;

const SingleLineTextConverters = {
    type: "singleLineText",
    makeTo: (_: FieldForConvert) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldForConvert) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldForConvertOfType<"singleLineText">
>;

const SingleSelectConverters = {
    type: "singleSelect",
    makeTo:
        <C extends types.SelectChoiceSchemaRead>(fieldSchema: SingleSelectForConvert<C>) =>
            (idOrValue: C["id"] | C["name"] | null | undefined): C["id"] | null | undefined => {
                if (idOrValue === null || idOrValue === undefined) {
                    return idOrValue;
                }
                const choices = fieldSchema.options.choices;
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
                    `No option found for value '${idOrValue}' in ${fieldSchema.type} field. Available options: ${availableOptions.join(", ")
                    }`,
                );
            },
    makeFrom:
        <C extends types.SelectChoiceSchemaRead>(fieldSchema: SingleSelectForConvert<C>) =>
            (value: unknown): C["name"] | null => {
                if (value === null || value === undefined) {
                    return null;
                }
                return convertFromReadSelectValue(value as string, fieldSchema);
            },
} as const;

const UrlConverters = {
    type: "url",
    makeTo: (_: FieldForConvert) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldForConvert) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<string | null | undefined, string, FieldForConvertOfType<"url">>;

export const CONVERTERS = {
    [AiTextConverters.type]: AiTextConverters,
    [AutoNumberConverters.type]: AutoNumberConverters,
    [BarcodeConverters.type]: BarcodeConverters,
    [ButtonConverters.type]: ButtonConverters,
    [CheckboxConverters.type]: CheckboxConverters,
    [CountConverters.type]: CountConverters,
    [CreatedByConverters.type]: CreatedByConverters,
    [CreatedTimeConverters.type]: CreatedTimeConverters,
    [CurrencyConverters.type]: CurrencyConverters,
    [DateConverters.type]: DateConverters,
    [DateTimeConverters.type]: DateTimeConverters,
    [DurationConverters.type]: DurationConverters,
    [EmailConverters.type]: EmailConverters,
    [ExternalSyncSourceConverters.type]: ExternalSyncSourceConverters,
    [FormulaConverters.type]: FormulaConverters,
    [LastModifiedByConverters.type]: LastModifiedByConverters,
    [LastModifiedTimeConverters.type]: LastModifiedTimeConverters,
    [MultilineTextConverters.type]: MultilineTextConverters,
    [MultipleAttachmentsConverters.type]: MultipleAttachmentsConverters,
    [MultipleCollaboratorsConverters.type]: MultipleCollaboratorsConverters,
    [MultipleLookupValuesConverters.type]: MultipleLookupValuesConverters,
    [MultipleRecordLinksConverters.type]: MultipleRecordLinksConverters,
    [MultipleSelectsConverters.type]: MultipleSelectsConverters,
    [NumberConverters.type]: NumberConverters,
    [PercentConverters.type]: PercentConverters,
    [PhoneNumberConverters.type]: PhoneNumberConverters,
    [RatingConverters.type]: RatingConverters,
    [RichTextConverters.type]: RichTextConverters,
    [RollupConverters.type]: RollupConverters,
    [SingleCollaboratorConverters.type]: SingleCollaboratorConverters,
    [SingleLineTextConverters.type]: SingleLineTextConverters,
    [SingleSelectConverters.type]: SingleSelectConverters,
    [UrlConverters.type]: UrlConverters,
} as const;

export type Converters = typeof CONVERTERS[keyof typeof CONVERTERS];

/** Given a FieldSchema, return the typescript type will be returned when you read from it */
export type ValueFromRead<F extends Omit<FieldForConvert, "id" | "name">> =
    F extends FieldForConvertOfType<"aiText"> ? types.AiTextValueRead
    : F extends FieldForConvertOfType<"autoNumber"> ? number | null
    : F extends FieldForConvertOfType<"barcode"> ? BarcodeValue | null
    : F extends FieldForConvertOfType<"button"> ? never
    : F extends FieldForConvertOfType<"checkbox"> ? boolean
    : F extends FieldForConvertOfType<"count"> ? number | null
    : F extends FieldForConvertOfType<"createdBy"> ? User | null
    : F extends FieldForConvertOfType<"createdTime"> ? UtcTimestamp
    : F extends FieldForConvertOfType<"currency"> ? number | null
    : F extends FieldForConvertOfType<"date"> ? string | null
    : F extends FieldForConvertOfType<"dateTime"> ? UtcTimestamp
    : F extends FieldForConvertOfType<"duration"> ? number | null
    : F extends FieldForConvertOfType<"email"> ? string
    : F extends FieldForConvertOfType<"externalSyncSource"> ? unknown
    : F extends FieldForConvertOfType<"formula"> ? FormulaReadType<F>
    : F extends FieldForConvertOfType<"lastModifiedBy"> ? User | null
    : F extends FieldForConvertOfType<"lastModifiedTime"> ? UtcTimestamp
    : F extends FieldForConvertOfType<"multilineText"> ? string
    : F extends FieldForConvertOfType<"multipleAttachments"> ? Array<MultipleAttachmentReadType>
    : F extends FieldForConvertOfType<"multipleCollaborators"> ? User[]
    : F extends FieldForConvertOfType<"multipleLookupValues"> ? MultipleLookupValuesReadType<F>
    : F extends FieldForConvertOfType<"multipleRecordLinks"> ? Array<RecordId>
    : F extends MultipleSelectsForConvert<infer C> ? Array<C["name"]>
    : F extends FieldForConvertOfType<"number"> ? number | null
    : F extends FieldForConvertOfType<"percent"> ? number | null
    : F extends FieldForConvertOfType<"phoneNumber"> ? string
    : F extends FieldForConvertOfType<"rating"> ? number | null
    : F extends FieldForConvertOfType<"richText"> ? string
    : F extends FieldForConvertOfType<"rollup"> ? RollupReadType<F>
    : F extends FieldForConvertOfType<"singleCollaborator"> ? User | null
    : F extends FieldForConvertOfType<"singleLineText"> ? string
    : F extends SingleSelectForConvert<infer C> ? C["name"] | null
    : F extends FieldForConvertOfType<"url"> ? string
    : never;

/** Given a FieldSchema, return the typescript type that can be written to it */
export type ValueForWrite<F extends FieldForConvert> = F extends FieldForConvertOfType<"aiText">
    ? never
    : F extends FieldForConvertOfType<"autoNumber"> ? never
    : F extends FieldForConvertOfType<"barcode"> ? BarcodeValue | null | undefined
    : F extends FieldForConvertOfType<"button"> ? never
    : F extends FieldForConvertOfType<"checkbox"> ? boolean | null | undefined
    : F extends FieldForConvertOfType<"count"> ? never
    : F extends FieldForConvertOfType<"createdBy"> ? never
    : F extends FieldForConvertOfType<"createdTime"> ? never
    : F extends FieldForConvertOfType<"currency"> ? number | null | undefined
    : F extends FieldForConvertOfType<"date"> ? globalThis.Date | TDateString | null | undefined
    : F extends FieldForConvertOfType<"dateTime"> ? globalThis.Date | UtcTimestamp | null | undefined
    : F extends FieldForConvertOfType<"duration"> ? number | null | undefined
    : F extends FieldForConvertOfType<"email"> ? string | null | undefined
    : F extends FieldForConvertOfType<"externalSyncSource"> ? unknown
    : F extends FieldForConvertOfType<"formula"> ? never
    : F extends FieldForConvertOfType<"lastModifiedBy"> ? never
    : F extends FieldForConvertOfType<"lastModifiedTime"> ? never
    : F extends FieldForConvertOfType<"multilineText"> ? string | null | undefined
    : F extends FieldForConvertOfType<"multipleAttachments"> ? ReadonlyArray<MultipleAttachmentWriteType> | null | undefined
    : F extends FieldForConvertOfType<"multipleCollaborators"> ? ReadonlyArray<User> | null | undefined
    : F extends FieldForConvertOfType<"multipleLookupValues"> ? never
    : F extends FieldForConvertOfType<"multipleRecordLinks"> ? ReadonlyArray<RecordId> | null | undefined
    : F extends MultipleSelectsForConvert<infer C> ? ReadonlyArray<C["id"] | C["name"]> | null | undefined
    : F extends FieldForConvertOfType<"number"> ? number | null | undefined
    : F extends FieldForConvertOfType<"percent"> ? number | null | undefined
    : F extends FieldForConvertOfType<"phoneNumber"> ? string | null | undefined
    : F extends FieldForConvertOfType<"rating"> ? number | null | undefined
    : F extends FieldForConvertOfType<"richText"> ? string | null | undefined
    : F extends FieldForConvertOfType<"rollup"> ? never
    : F extends FieldForConvertOfType<"singleCollaborator"> ? UserWrite | null | undefined
    : F extends FieldForConvertOfType<"singleLineText"> ? string | null | undefined
    : F extends SingleSelectForConvert<infer C> ? C["id"] | C["name"] | null | undefined
    : F extends FieldForConvertOfType<"url"> ? string | null | undefined
    : never;

/**
 * Convert a value from the appropriate TypeScript type into the raw value for writing to Airtable for the given field schema.
 * @param value The value in the appropriate TypeScript type
 * @param fieldSchema The {@link FieldForConvert} describing the field
 * @returns The raw value to write to Airtable
 *
 * @throws {@link FieldNotWritableError} if the field type cannot be written to.
 * @throws {@link WriteValueConversionError} if the value could not be converted for writing.
 */
export function convertValueForWrite<F extends FieldForConvert>(
    value: ValueForWrite<F>,
    fieldSchema: F,
): unknown {
    const type = fieldSchema.type;
    const converterObj = CONVERTERS[type];
    if (!converterObj) {
        throw new Error(`No converter found for field type: ${type}`);
    }
    type AnyConverter = {
        makeTo: null | ((fs: FieldForConvert) => ((v: unknown) => unknown));
    };
    const makeTo = (converterObj as AnyConverter).makeTo;
    if (makeTo === null) {
        throw new exceptions.FieldNotWritableError(fieldSchema);
    }
    const converter = makeTo(fieldSchema);
    try {
        return converter(value);
    } catch (e) {
        throw new exceptions.WriteValueConversionError(value, fieldSchema, e as Error);
    }
}

/**
 * Convert a value from the Airtable into the appropriate TypeScript type for the given field schema.
 * 
 * @param value The raw value from Airtable
 * @param fieldSchema The {@link FieldForConvert} describing the field
 * @returns The converted value in the appropriate TypeScript type
 * @throws {@link FieldNotReadableError} if the field type cannot be read from.
 * @throws {@link ReadValueConversionError} if the value could not be converted for reading.
 */
export function convertValueFromRead<F extends FieldForConvert>(
    value: unknown,
    fieldSchema: F,
): ValueFromRead<F> {
    const type = fieldSchema.type;
    const converterObj = CONVERTERS[type];
    if (!converterObj) {
        throw new Error(`No converter found for field type: ${type}`);
    }
    const makeFrom = (converterObj as any).makeFrom;
    if (makeFrom === null) {
        throw new exceptions.FieldNotReadableError(fieldSchema);
    }
    const converter = makeFrom(fieldSchema);
    try {
        return converter(value) as ValueFromRead<F>;
    } catch (e) {
        throw new exceptions.ReadValueConversionError(value, fieldSchema, e as Error);
    }
}