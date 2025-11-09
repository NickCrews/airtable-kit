import * as fields from "../fields/index.ts";
import { RecordId, type FieldSchema, type FieldType } from "../types.ts";
import * as exceptions from "../exceptions.ts";

/** ISO 8601 string in UTC, e.g. "2024-01-01T00:00:00.000Z" */
type UtcTimestamp = string;

type ToAirtableConverter<T> = (value: T) => unknown;
type FromAirtableConverter<T> = (value: any) => T;
interface IConverters<
    ToArg,
    FromResult,
    F extends FieldSchema,
> {
    type: F["type"];
    /** null implies the field can't be written to (eg is createdTime or formula) */
    makeTo: null | ((fieldSchema: F) => ToAirtableConverter<ToArg>);
    /** null implies the field can't be read from (eg is a button) */
    makeFrom: null | ((fieldSchema: F) => FromAirtableConverter<FromResult>);
}

type FieldOfType<T extends FieldType> = Extract<FieldSchema, { type: T }>;

const AiTextConverters = {
    type: "aiText",
    makeTo: null,
    makeFrom:
        (_fieldSchema: FieldOfType<"aiText">) =>
            (value: fields.AiTextValueRead): fields.AiTextValueRead => value,
} as const satisfies IConverters<never, fields.AiTextValueRead, FieldOfType<"aiText">>;

const AutoNumberConverters = {
    type: "autoNumber",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldOfType<"autoNumber">) => (value: number): number => {
            if (!value && value !== 0) {
                const e = new Error(`an autoNumber field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema, e);
            }
            return value;
        }
} as const satisfies IConverters<
    never,
    number,
    FieldOfType<"autoNumber">
>;

export interface BarcodeValue {
    text: string;
    type: string;
}
const BarcodeConverters = {
    type: "barcode",
    makeTo:
        (_fieldSchema: FieldOfType<"barcode">) =>
            (value: BarcodeValue | null | undefined): BarcodeValue | null | undefined => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"barcode">) =>
            (value: unknown): BarcodeValue => value as BarcodeValue,
} as const satisfies IConverters<
    BarcodeValue | null | undefined,
    BarcodeValue | null,
    FieldOfType<"barcode">
>;

const ButtonConverters = {
    type: "button",
    makeTo: null,
    makeFrom: null,
} as const satisfies IConverters<never, never, FieldOfType<"button">>;

const CheckboxConverters = {
    type: "checkbox",
    makeTo:
        (_fieldSchema: FieldOfType<"checkbox">) => (value: boolean | null | undefined): boolean | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"checkbox">) =>
            // Airtable has no notion of undefined for checkboxes, it only stores true/false,
            // so during read, if the API omits the field, we convert that to false. 
            (value: boolean | null): boolean => value ?? false
} as const satisfies IConverters<
    boolean | null | undefined,
    boolean,
    FieldOfType<"checkbox">
>;

const CountConverters = {
    type: "count",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldOfType<"count">) => (value: number): number => {
            if (!value && value !== 0) {
                const e = new Error(`a count field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema, e);
            }
            return value;
        }
} as const satisfies IConverters<never, number, FieldOfType<"count">>;

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
        (fieldSchema: FieldOfType<"createdBy">) => (value: User): User => {
            if (!value) {
                const e = new Error(`a createdBy field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema, e);
            }
            return value;
        }
} as const satisfies IConverters<never, User, FieldOfType<"createdBy">>;

const CreatedTimeConverters = {
    type: "createdTime",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldOfType<"createdTime">) =>
            (value: UtcTimestamp): UtcTimestamp => {
                if (value === null || value === undefined) {
                    const e = new Error(`a createdTime field must have a value, got: ${value}`);
                    throw new exceptions.ReadValueConversionError(value, fieldSchema, e);
                }
                return value;
            }
} as const satisfies IConverters<
    never,
    UtcTimestamp,
    FieldOfType<"createdTime">
>;

const CurrencyConverters = {
    type: "currency",
    makeTo:
        (_fieldSchema: FieldOfType<"currency">) => (value: number | null | undefined): number | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"currency">) => (value: number | null): number | null => value
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldOfType<"currency">
>;

type TDateString = `${number}-${number}-${number}`;
const DateConverters = {
    type: "date",
    makeTo:
        (_fieldSchema: FieldOfType<"date">) =>
            (value: globalThis.Date | TDateString | null | undefined): string | null | undefined => {
                if (value instanceof globalThis.Date) {
                    return value.toISOString().split("T")[0];
                }
                return value;
            },
    makeFrom: (_fieldSchema: FieldOfType<"date">) => (value: string | null): string | null => value,
} as const satisfies IConverters<
    globalThis.Date | TDateString | null | undefined,
    string | null,
    FieldOfType<"date">
>;

const DateTimeConverters = {
    type: "dateTime",
    makeTo:
        (_fieldSchema: FieldOfType<"dateTime">) =>
            (value: globalThis.Date | string | null | undefined): string | null | undefined => {
                if (value instanceof globalThis.Date) {
                    return value.toISOString();
                }
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldOfType<"dateTime">) =>
            (value: UtcTimestamp | null): UtcTimestamp | null => value,
} as const satisfies IConverters<
    globalThis.Date | string | null | undefined,
    UtcTimestamp | null,
    FieldOfType<"dateTime">
>;

const DurationConverters = {
    type: "duration",
    makeTo:
        (_fieldSchema: FieldOfType<"duration">) => (value: number | null | undefined): number | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"duration">) => (value: number | null): number | null => value,
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldOfType<"duration">
>;

const EmailConverters = {
    type: "email",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<string | null | undefined, string, FieldOfType<"email">>;

const ExternalSyncSourceConverters = {
    type: "externalSyncSource",
    makeTo:
        (_fieldSchema: FieldOfType<"externalSyncSource">) =>
            (value: unknown): unknown => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"externalSyncSource">) =>
            (value: unknown): unknown => value,
} as const satisfies IConverters<
    unknown,
    unknown,
    FieldOfType<"externalSyncSource">
>;

type FormulaResultType<F extends FieldOfType<"formula">> = F["options"]["result"]
type FormulaReadType<F extends FieldOfType<"formula">> = FieldRead<FormulaResultType<F>>;
const FormulaConverters = {
    type: "formula",
    makeTo: null,
    makeFrom:
        <F extends FieldOfType<"formula">>(_fieldSchema: F) => (value: FormulaReadType<F>): FormulaReadType<F> => {
            return value;
        }
} as const;

const LastModifiedByConverters = {
    type: "lastModifiedBy",
    makeTo: null,
    makeFrom:
        (fieldSchema: FieldOfType<"lastModifiedBy">) => (value: unknown): User => {
            if (!value) {
                const e = new Error(`a lastModifiedBy field must have a value, got: ${value}`);
                throw new exceptions.ReadValueConversionError(value, fieldSchema, e);
            }
            return value as User;
        }
} as const satisfies IConverters<
    never,
    User,
    FieldOfType<"lastModifiedBy">
>;

const LastModifiedTimeConverters = {
    type: "lastModifiedTime",
    makeTo: null,
    makeFrom:
        (_fieldSchema: FieldOfType<"lastModifiedTime">) =>
            (value: UtcTimestamp): UtcTimestamp => {
                if (value === null || value === undefined) {
                    const e = new Error(`a lastModifiedTime field must have a value, got: ${value}`);
                    throw new exceptions.ReadValueConversionError(value, _fieldSchema, e);
                }
                return value;
            }
} as const satisfies IConverters<
    never,
    UtcTimestamp,
    FieldOfType<"lastModifiedTime">
>;

const MultilineTextConverters = {
    type: "multilineText",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldOfType<"multilineText">
>;

export type MultipleAttachment = {
    url: string;
    filename?: string;
};
const MultipleAttachmentsConverters = {
    type: "multipleAttachments",
    makeTo:
        (_fieldSchema: FieldOfType<"multipleAttachments">) =>
            (value: ReadonlyArray<MultipleAttachment> | null | undefined): ReadonlyArray<MultipleAttachment> | null | undefined => {
                if (!value) return value;
                return value.map(({ url, filename }) => ({
                    url,
                    filename,
                }));
            },
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleAttachments">) =>
            (value: Array<MultipleAttachment> | null): Array<MultipleAttachment> => value ? value : [],
} as const satisfies IConverters<
    ReadonlyArray<MultipleAttachment> | null | undefined,
    Array<MultipleAttachment>,
    FieldOfType<"multipleAttachments">
>;
const MultipleCollaboratorsConverters = {
    type: "multipleCollaborators",
    makeTo:
        (_fieldSchema: FieldOfType<"multipleCollaborators">) =>
            (value: User[] | null | undefined): User[] => {
                if (!value) return [];
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleCollaborators">) =>
            (value: User[] | null): User[] => value ? value : [],
} as const satisfies IConverters<
    User[],
    User[],
    FieldOfType<"multipleCollaborators">
>;

type MultipleLookupValuesResultType<F extends fields.MultipleLookupValues> = F["options"]["result"]
type MultipleLookupValuesReadType<F extends fields.MultipleLookupValues> = FieldRead<MultipleLookupValuesResultType<F>>;
const MultipleLookupValuesConverters = {
    type: "multipleLookupValues",
    makeTo: null,
    makeFrom:
        <T extends fields.MultipleLookupValues>(_fieldSchema: T) =>
            (value: null | MultipleLookupValuesReadType<T>[]): MultipleLookupValuesReadType<T>[] => value ? value : [],
} as const;

const MultipleRecordLinksConverters = {
    type: "multipleRecordLinks",
    makeTo:
        (_fieldSchema: FieldOfType<"multipleRecordLinks">) =>
            (value: RecordId[] | null | undefined): RecordId[] => {
                if (!value) return [];
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleRecordLinks">) =>
            (value: null | RecordId[]): RecordId[] => {
                return value ? value : [];
            },
} as const satisfies IConverters<
    RecordId[] | null | undefined,
    RecordId[],
    FieldOfType<"multipleRecordLinks">
>;

const MultipleSelectsConverters = {
    type: "multipleSelects",
    makeTo:
        <C extends fields.SelectChoice>(fieldSchema: fields.MultipleSelects<C>) =>
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
        <C extends fields.SelectChoice>(_fieldSchema: fields.MultipleSelects<C>) =>
            (value: unknown): C[] => {
                if (!value) return [];
                return value as C[];
            },
} as const;

const NumberConverters = {
    type: "number",
    makeTo: (_fieldSchema: FieldOfType<"number">) => (value: number | null | undefined): number | null | undefined =>
        value,
    makeFrom:
        (_fieldSchema: FieldOfType<"number">) => (value: number | null): number | null => value,
} as const satisfies IConverters<number | null | undefined, number | null | undefined, FieldOfType<"number">>;

const PercentConverters = {
    type: "percent",
    makeTo:
        (_fieldSchema: FieldOfType<"percent">) => (value: number | null | undefined): number | null | undefined => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"percent">) => (value: number | null): number | null => value,
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldOfType<"percent">
>;

const PhoneNumberConverters = {
    type: "phoneNumber",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: string | null): string | null => value,
} as const satisfies IConverters<
    string | null | undefined,
    string | null,
    FieldOfType<"phoneNumber">
>;

const RatingConverters = {
    type: "rating",
    makeTo: (_fieldSchema: FieldOfType<"rating">) => (value: number | null | undefined): number | null | undefined =>
        value,
    makeFrom:
        (_fieldSchema: FieldOfType<"rating">) => (value: number | null): number | null => value,
} as const satisfies IConverters<number | null | undefined, number | null, FieldOfType<"rating">>;

const RichTextConverters = {
    type: "richText",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldOfType<"richText">
>;

type RollupResultType<F extends FieldOfType<"rollup">> = F["options"]["result"]
type RollupReadType<F extends FieldOfType<"rollup">> = FieldRead<RollupResultType<F>>;
const RollupConverters = {
    type: "rollup",
    makeTo: null,
    makeFrom:
        <T extends FieldOfType<"rollup">>(_fieldSchema: T) => (value: RollupReadType<T>): RollupReadType<T> => {
            return value;
        },
} as const;

const SingleCollaboratorConverters = {
    type: "singleCollaborator",
    makeTo:
        (_fieldSchema: FieldOfType<"singleCollaborator">) =>
            (value: UserWrite | null | undefined): UserWrite | null | undefined => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"singleCollaborator">) =>
            (value: unknown): User | null => value as User | null,
} as const satisfies IConverters<
    UserWrite | null | undefined,
    User | null,
    FieldOfType<"singleCollaborator">
>;

const SingleLineTextConverters = {
    type: "singleLineText",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldOfType<"singleLineText">
>;

const SingleSelectConverters = {
    type: "singleSelect",
    makeTo:
        <C extends fields.SelectChoice>(fieldSchema: fields.SingleSelect<C>) =>
            (idOrValue: C["id"] | C["name"] | null | undefined): C["id"] | null | undefined => {
                // If already an ID in the spec, return it.
                // Otherwise, try to lookup the ID from the value.
                // If not found, error.
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
                    `No option found for value '${idOrValue}' in field '${fieldSchema.name}'. Available options: ${availableOptions.join(", ")
                    }`,
                );
            },
    makeFrom:
        <C extends fields.SelectChoice>(_fieldSchema: fields.SingleSelect<C>) =>
            (value: unknown): C => value as C,
} as const;

const UrlConverters = {
    type: "url",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: string | null): string => value ? value : "",
} as const satisfies IConverters<string | null | undefined, string, FieldOfType<"url">>;

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
export type FieldRead<F extends Omit<FieldSchema, "id" | "name">> =
    F extends FieldOfType<"aiText"> ? fields.AiTextValueRead
    : F extends FieldOfType<"autoNumber"> ? number | null
    : F extends FieldOfType<"barcode"> ? BarcodeValue | null
    : F extends FieldOfType<"button"> ? never
    : F extends FieldOfType<"checkbox"> ? boolean // Airtable checkboxes always return true/false, they can't store null
    : F extends FieldOfType<"count"> ? number | null
    : F extends FieldOfType<"createdBy"> ? User | null
    : F extends FieldOfType<"createdTime"> ? UtcTimestamp
    : F extends FieldOfType<"currency"> ? number | null
    : F extends FieldOfType<"date"> ? string | null // ISO date string or null
    : F extends FieldOfType<"dateTime"> ? UtcTimestamp
    : F extends FieldOfType<"duration"> ? number | null
    : F extends FieldOfType<"email"> ? string
    : F extends FieldOfType<"externalSyncSource"> ? unknown
    : F extends FieldOfType<"formula"> ? FormulaReadType<F>
    : F extends FieldOfType<"lastModifiedBy"> ? User | null
    : F extends FieldOfType<"lastModifiedTime"> ? UtcTimestamp
    : F extends FieldOfType<"multilineText"> ? string
    : F extends FieldOfType<"multipleAttachments"> ? MultipleAttachment[]
    : F extends FieldOfType<"multipleCollaborators"> ? User[]
    : F extends FieldOfType<"multipleLookupValues"> ? MultipleLookupValuesReadType<F>
    : F extends FieldOfType<"multipleRecordLinks"> ? RecordId[]
    : F extends fields.MultipleSelects<infer C> ? C[]
    : F extends FieldOfType<"number"> ? number | null
    : F extends FieldOfType<"percent"> ? number | null
    : F extends FieldOfType<"phoneNumber"> ? string
    : F extends FieldOfType<"rating"> ? number | null
    : F extends FieldOfType<"richText"> ? string
    : F extends FieldOfType<"rollup"> ? RollupReadType<F>
    : F extends FieldOfType<"singleCollaborator"> ? User | null
    : F extends FieldOfType<"singleLineText"> ? string
    : F extends fields.SingleSelect<infer C> ? C | null
    : F extends FieldOfType<"url"> ? string
    : never;

/** Given a FieldSchema, return the typescript type that can be written to it */
export type FieldWrite<F extends FieldSchema> = F extends FieldOfType<"aiText">
    ? never
    : F extends FieldOfType<"autoNumber"> ? never
    : F extends FieldOfType<"barcode"> ? BarcodeValue | null | undefined
    : F extends FieldOfType<"button"> ? never
    : F extends FieldOfType<"checkbox"> ? boolean | null | undefined
    : F extends FieldOfType<"count"> ? never
    : F extends FieldOfType<"createdBy"> ? never
    : F extends FieldOfType<"createdTime"> ? never
    : F extends FieldOfType<"currency"> ? number | null | undefined
    : F extends FieldOfType<"date"> ? globalThis.Date | TDateString | null | undefined
    : F extends FieldOfType<"dateTime"> ? globalThis.Date | UtcTimestamp | null | undefined
    : F extends FieldOfType<"duration"> ? number | null | undefined
    : F extends FieldOfType<"email"> ? string | null | undefined
    : F extends FieldOfType<"externalSyncSource"> ? unknown
    : F extends FieldOfType<"formula"> ? never
    : F extends FieldOfType<"lastModifiedBy"> ? never
    : F extends FieldOfType<"lastModifiedTime"> ? never
    : F extends FieldOfType<"multilineText"> ? string | null | undefined
    : F extends FieldOfType<"multipleAttachments"> ? ReadonlyArray<MultipleAttachment> | null | undefined
    : F extends FieldOfType<"multipleCollaborators"> ? ReadonlyArray<User> | null | undefined
    : F extends FieldOfType<"multipleLookupValues"> ? never
    : F extends FieldOfType<"multipleRecordLinks"> ? ReadonlyArray<RecordId> | null | undefined
    : F extends fields.MultipleSelects<infer C> ? ReadonlyArray<C["id"] | C["name"]> | null | undefined
    : F extends FieldOfType<"number"> ? number | null | undefined
    : F extends FieldOfType<"percent"> ? number | null | undefined
    : F extends FieldOfType<"phoneNumber"> ? string | null | undefined
    : F extends FieldOfType<"rating"> ? number | null | undefined
    : F extends FieldOfType<"richText"> ? string | null | undefined
    : F extends FieldOfType<"rollup"> ? never
    : F extends FieldOfType<"singleCollaborator"> ? UserWrite | null | undefined
    : F extends FieldOfType<"singleLineText"> ? string | null | undefined
    : F extends fields.SingleSelect<infer C> ? C["id"] | C["name"] | null | undefined
    : F extends FieldOfType<"url"> ? string | null | undefined
    : never;

/**
 * Convert a value from the appropriate TypeScript type into the raw value for writing to Airtable for the given field schema.
 * @param value The value in the appropriate TypeScript type
 * @param fieldSchema The {@link FieldSchema} describing the field
 * @returns The raw value to write to Airtable
 *
 * @throws {@link FieldNotWritableError} if the field type cannot be written to.
 * @throws {@link WriteValueConversionError} if the value could not be converted for writing.
 */
export function convertFieldForWrite<F extends FieldSchema>(
    value: FieldWrite<F>,
    fieldSchema: F,
): unknown {
    const type = fieldSchema.type;
    const converterObj = CONVERTERS[type];
    if (!converterObj) {
        throw new Error(`No converter found for field type: ${type}`);
    }
    type AnyConverter = {
        makeTo: null | ((fs: FieldSchema) => ((v: unknown) => unknown));
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
 * @param fieldSchema The {@link FieldSchema} describing the field
 * @returns The converted value in the appropriate TypeScript type
 * @throws {@link FieldNotReadableError} if the field type cannot be read from.
 * @throws {@link ReadValueConversionError} if the value could not be converted for reading.
 */
export function convertFieldForRead<F extends FieldSchema>(
    value: unknown,
    fieldSchema: F,
): FieldRead<F> {
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
        return converter(value) as FieldRead<F>;
    } catch (e) {
        throw new exceptions.ReadValueConversionError(value, fieldSchema, e as Error);
    }
}