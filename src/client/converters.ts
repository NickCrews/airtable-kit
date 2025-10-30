import {
    MultipleSelects,
    SelectChoice,
    SingleSelect,
} from "../fields/index.ts";
import { type FieldSchema, type FieldType } from "../types.ts";

type ToAirtableConverter<T> = (value: T) => unknown;
type FromAirtableConverter<T> = (value: unknown) => T;
interface IConverters<
    ToArg,
    FromResult,
    F extends FieldSchema,
> {
    type: F["type"];
    /** null implies the field is read-only */
    makeTo(fieldSchema: F): ToAirtableConverter<ToArg> | null;
    makeFrom(fieldSchema: F): FromAirtableConverter<FromResult>;
}

type FieldOfType<T extends FieldType> = Extract<FieldSchema, { type: T }>;

const AiTextConverters = {
    type: "aiText",
    makeTo: (_fieldSchema: FieldOfType<"aiText">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"aiText">) => (value: unknown): string =>
            value as string,
} as const satisfies IConverters<never, string, FieldOfType<"aiText">>;

const AutoNumberConverters = {
    type: "autoNumber",
    makeTo: (_fieldSchema: FieldOfType<"autoNumber">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"autoNumber">) => (value: unknown): number =>
            value as number,
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
            (value: BarcodeValue): BarcodeValue => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"barcode">) =>
            (value: unknown): BarcodeValue => value as BarcodeValue,
} as const satisfies IConverters<
    BarcodeValue,
    BarcodeValue,
    FieldOfType<"barcode">
>;

const ButtonConverters = {
    type: "button",
    makeTo: (_fieldSchema: FieldOfType<"button">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"button">) => (value: unknown): string =>
            value as string,
} as const satisfies IConverters<never, string, FieldOfType<"button">>;

const CheckboxConverters = {
    type: "checkbox",
    makeTo:
        (_fieldSchema: FieldOfType<"checkbox">) => (value: boolean): boolean =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"checkbox">) => (value: unknown): boolean =>
            value as boolean,
} as const satisfies IConverters<
    boolean,
    boolean,
    FieldOfType<"checkbox">
>;

const CountConverters = {
    type: "count",
    makeTo: (_fieldSchema: FieldOfType<"count">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"count">) => (value: unknown): number =>
            value as number,
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
    makeTo: (_fieldSchema: FieldOfType<"createdBy">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"createdBy">) => (value: unknown): User =>
            value as User,
} as const satisfies IConverters<never, User, FieldOfType<"createdBy">>;

const CreatedTimeConverters = {
    type: "createdTime",
    makeTo: (_fieldSchema: FieldOfType<"createdTime">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"createdTime">) =>
            (value: unknown): globalThis.Date =>
                new globalThis.Date(value as string),
} as const satisfies IConverters<
    never,
    globalThis.Date,
    FieldOfType<"createdTime">
>;

const CurrencyConverters = {
    type: "currency",
    makeTo:
        (_fieldSchema: FieldOfType<"currency">) => (value: number): number =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"currency">) => (value: unknown): number =>
            value as number,
} as const satisfies IConverters<
    number,
    number,
    FieldOfType<"currency">
>;

type TDateString = `${number}-${number}-${number}`;
const DateConverters = {
    type: "date",
    makeTo:
        (_fieldSchema: FieldOfType<"date">) =>
            (value: globalThis.Date | TDateString): string => {
                if (value instanceof globalThis.Date) {
                    return value.toISOString().split("T")[0];
                }
                return value;
            },
    makeFrom: (_fieldSchema: FieldOfType<"date">) => (value: unknown): string =>
        value as string,
} as const satisfies IConverters<
    globalThis.Date | TDateString,
    string,
    FieldOfType<"date">
>;

const DateTimeConverters = {
    type: "dateTime",
    makeTo:
        (_fieldSchema: FieldOfType<"dateTime">) =>
            (value: globalThis.Date | string): string => {
                if (value instanceof globalThis.Date) {
                    return value.toISOString();
                }
                return value;
            },
    makeFrom:
        (_fieldSchema: FieldOfType<"dateTime">) =>
            (value: unknown): globalThis.Date =>
                new globalThis.Date(value as string),
} as const satisfies IConverters<
    globalThis.Date | string,
    globalThis.Date,
    FieldOfType<"dateTime">
>;

const DurationConverters = {
    type: "duration",
    makeTo:
        (_fieldSchema: FieldOfType<"duration">) => (value: number): number =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"duration">) => (value: unknown): number =>
            value as number,
} as const satisfies IConverters<
    number,
    number,
    FieldOfType<"duration">
>;

const EmailConverters = {
    type: "email",
    makeTo: (_: FieldSchema) => (value: string): string => String(value),
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<string, string, FieldOfType<"email">>;

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

const FormulaConverters = {
    type: "formula",
    makeTo: (_fieldSchema: FieldOfType<"formula">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"formula">) => (value: unknown): string =>
            value as string,
} as const satisfies IConverters<never, string, FieldOfType<"formula">>;

const LastModifiedByConverters = {
    type: "lastModifiedBy",
    makeTo: (_fieldSchema: FieldOfType<"lastModifiedBy">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"lastModifiedBy">) =>
            (value: unknown): User => value as User,
} as const satisfies IConverters<
    never,
    User,
    FieldOfType<"lastModifiedBy">
>;

const LastModifiedTimeConverters = {
    type: "lastModifiedTime",
    makeTo: (_fieldSchema: FieldOfType<"lastModifiedTime">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"lastModifiedTime">) =>
            (value: unknown): globalThis.Date =>
                new globalThis.Date(value as string),
} as const satisfies IConverters<
    never,
    globalThis.Date,
    FieldOfType<"lastModifiedTime">
>;

const MultilineTextConverters = {
    type: "multilineText",
    makeTo: (_: FieldSchema) => (value: string): string => String(value),
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<
    string,
    string,
    FieldOfType<"multilineText">
>;

export type MultipleAttachment = {
    url: string;
    filename?: string;
}[];
const MultipleAttachmentsConverters = {
    type: "multipleAttachments",
    makeTo:
        (_fieldSchema: FieldOfType<"multipleAttachments">) =>
            (value: MultipleAttachment): MultipleAttachment => {
                return value.map(({ url, filename }) => ({
                    url,
                    filename,
                }));
            },
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleAttachments">) =>
            (value: unknown): MultipleAttachment => value as MultipleAttachment,
} as const satisfies IConverters<
    MultipleAttachment,
    MultipleAttachment,
    FieldOfType<"multipleAttachments">
>;
const MultipleCollaboratorsConverters = {
    type: "multipleCollaborators",
    makeTo:
        (_fieldSchema: FieldOfType<"multipleCollaborators">) =>
            (value: User[]): User[] => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleCollaborators">) =>
            (value: unknown): User[] => value as User[],
} as const satisfies IConverters<
    User[],
    User[],
    FieldOfType<"multipleCollaborators">
>;

const MultipleLookupValuesConverters = {
    type: "multipleLookupValues",
    makeTo:
        (_fieldSchema: FieldOfType<"multipleLookupValues">) =>
            (value: unknown[]): unknown[] => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleLookupValues">) =>
            (value: unknown): unknown[] => value as unknown[],
} as const satisfies IConverters<
    unknown[],
    unknown[],
    FieldOfType<"multipleLookupValues">
>;

const MultipleRecordLinksConverters = {
    type: "multipleRecordLinks",
    makeTo:
        (_fieldSchema: FieldOfType<"multipleRecordLinks">) =>
            (value: string[]): string[] => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleRecordLinks">) =>
            (value: unknown): string[] => value as string[],
} as const satisfies IConverters<
    string[],
    string[],
    FieldOfType<"multipleRecordLinks">
>;

const MultipleSelectsConverters = {
    type: "multipleSelects",
    makeTo:
        <C extends SelectChoice>(fieldSchema: MultipleSelects<C>) =>
            (idsOrValues: Array<C["id"] | C["name"]>): Array<C["id"]> => {
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
        <C extends SelectChoice>(_fieldSchema: MultipleSelects<C>) =>
            (value: unknown): C[] => value as C[],
} as const;

const NumberConverters = {
    type: "number",
    makeTo: (_fieldSchema: FieldOfType<"number">) => (value: number): number =>
        value,
    makeFrom:
        (_fieldSchema: FieldOfType<"number">) => (value: unknown): number =>
            value as number,
} as const satisfies IConverters<number, number, FieldOfType<"number">>;

const PercentConverters = {
    type: "percent",
    makeTo: (_fieldSchema: FieldOfType<"percent">) => (value: number): number =>
        value,
    makeFrom:
        (_fieldSchema: FieldOfType<"percent">) => (value: unknown): number =>
            value as number,
} as const satisfies IConverters<number, number, FieldOfType<"percent">>;

const PhoneNumberConverters = {
    type: "phoneNumber",
    makeTo: (_: FieldSchema) => (value: string): string => String(value),
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<
    string,
    string,
    FieldOfType<"phoneNumber">
>;

const RatingConverters = {
    type: "rating",
    makeTo: (_fieldSchema: FieldOfType<"rating">) => (value: number): number =>
        value,
    makeFrom:
        (_fieldSchema: FieldOfType<"rating">) => (value: unknown): number =>
            value as number,
} as const satisfies IConverters<number, number, FieldOfType<"rating">>;

const RichTextConverters = {
    type: "richText",
    makeTo: (_: FieldSchema) => (value: string): string => String(value),
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<
    string,
    string,
    FieldOfType<"richText">
>;

const RollupConverters = {
    type: "rollup",
    makeTo: (_fieldSchema: FieldOfType<"rollup">) => null,
    makeFrom:
        (_fieldSchema: FieldOfType<"rollup">) => (value: unknown): unknown =>
            value,
} as const satisfies IConverters<never, unknown, FieldOfType<"rollup">>;

const SingleCollaboratorConverters = {
    type: "singleCollaborator",
    makeTo:
        (_fieldSchema: FieldOfType<"singleCollaborator">) =>
            (value: UserWrite): UserWrite => value,
    makeFrom:
        (_fieldSchema: FieldOfType<"singleCollaborator">) =>
            (value: unknown): User => value as User,
} as const satisfies IConverters<
    UserWrite,
    User,
    FieldOfType<"singleCollaborator">
>;

const SingleLineTextConverters = {
    type: "singleLineText",
    makeTo: (_: FieldSchema) => (value: string): string => String(value),
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<
    string,
    string,
    FieldOfType<"singleLineText">
>;

const SingleSelectConverters = {
    type: "singleSelect",
    makeTo:
        <C extends SelectChoice>(fieldSchema: SingleSelect<C>) =>
            (idOrValue: C["id"] | C["name"]): C["id"] => {
                // If already an ID in the spec, return it.
                // Otherwise, try to lookup the ID from the value.
                // If not found, error.
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
        <C extends SelectChoice>(_fieldSchema: SingleSelect<C>) =>
            (value: unknown): C => value as C,
} as const;

const UrlConverters = {
    type: "url",
    makeTo: (_: FieldSchema) => (value: string): string => String(value),
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<string, string, FieldOfType<"url">>;

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

export type inferRead<F extends FieldSchema> = F extends FieldOfType<"aiText">
    ? string
    : F extends FieldOfType<"autoNumber"> ? number
    : F extends FieldOfType<"barcode"> ? BarcodeValue
    : F extends FieldOfType<"button"> ? string
    : F extends FieldOfType<"checkbox"> ? boolean
    : F extends FieldOfType<"count"> ? number
    : F extends FieldOfType<"createdBy"> ? User
    : F extends FieldOfType<"createdTime"> ? globalThis.Date
    : F extends FieldOfType<"currency"> ? number
    : F extends FieldOfType<"date"> ? string
    : F extends FieldOfType<"dateTime"> ? globalThis.Date
    : F extends FieldOfType<"duration"> ? number
    : F extends FieldOfType<"email"> ? string
    : F extends FieldOfType<"externalSyncSource"> ? unknown
    : F extends FieldOfType<"formula"> ? string
    : F extends FieldOfType<"lastModifiedBy"> ? User
    : F extends FieldOfType<"lastModifiedTime"> ? globalThis.Date
    : F extends FieldOfType<"multilineText"> ? string
    : F extends FieldOfType<"multipleAttachments"> ? MultipleAttachment
    : F extends FieldOfType<"multipleCollaborators"> ? User[]
    : F extends FieldOfType<"multipleLookupValues"> ? unknown[]
    : F extends FieldOfType<"multipleRecordLinks"> ? string[]
    : F extends MultipleSelects<infer C> ? C[]
    : F extends FieldOfType<"number"> ? number
    : F extends FieldOfType<"percent"> ? number
    : F extends FieldOfType<"phoneNumber"> ? string
    : F extends FieldOfType<"rating"> ? number
    : F extends FieldOfType<"richText"> ? string
    : F extends FieldOfType<"rollup"> ? unknown
    : F extends FieldOfType<"singleCollaborator"> ? User
    : F extends FieldOfType<"singleLineText"> ? string
    : F extends SingleSelect<infer C> ? C
    : F extends FieldOfType<"url"> ? string
    : never;

export type inferWrite<F extends FieldSchema> = F extends FieldOfType<"aiText">
    ? never
    : F extends FieldOfType<"autoNumber"> ? never
    : F extends FieldOfType<"barcode"> ? BarcodeValue
    : F extends FieldOfType<"button"> ? never
    : F extends FieldOfType<"checkbox"> ? boolean
    : F extends FieldOfType<"count"> ? never
    : F extends FieldOfType<"createdBy"> ? never
    : F extends FieldOfType<"createdTime"> ? never
    : F extends FieldOfType<"currency"> ? number
    : F extends FieldOfType<"date"> ? globalThis.Date | TDateString
    : F extends FieldOfType<"dateTime"> ? globalThis.Date | string
    : F extends FieldOfType<"duration"> ? number
    : F extends FieldOfType<"email"> ? string
    : F extends FieldOfType<"externalSyncSource"> ? unknown
    : F extends FieldOfType<"formula"> ? never
    : F extends FieldOfType<"lastModifiedBy"> ? never
    : F extends FieldOfType<"lastModifiedTime"> ? never
    : F extends FieldOfType<"multilineText"> ? string
    : F extends FieldOfType<"multipleAttachments"> ? MultipleAttachment
    : F extends FieldOfType<"multipleCollaborators"> ? User[]
    : F extends FieldOfType<"multipleLookupValues"> ? unknown[]
    : F extends FieldOfType<"multipleRecordLinks"> ? string[]
    : F extends MultipleSelects<infer C> ? Array<C["id"] | C["name"]>
    : F extends FieldOfType<"number"> ? number
    : F extends FieldOfType<"percent"> ? number
    : F extends FieldOfType<"phoneNumber"> ? string
    : F extends FieldOfType<"rating"> ? number
    : F extends FieldOfType<"richText"> ? string
    : F extends FieldOfType<"rollup"> ? never
    : F extends FieldOfType<"singleCollaborator"> ? UserWrite
    : F extends FieldOfType<"singleLineText"> ? string
    : F extends SingleSelect<infer C> ? C["id"] | C["name"]
    : F extends FieldOfType<"url"> ? string
    : never;

export type ReadRecordByName<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["name"]]: inferRead<Extract<T[number], { name: K }>>;
};
export type ReadRecordById<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["id"]]: inferRead<Extract<T[number], { id: K }>>;
};

type FieldValue<F extends FieldSchema> = inferWrite<F>;

export type WriteRecord<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["name"] | T[number]["id"]]?: K extends T[number]["name"]
    ? Extract<T[number], { name: K }> extends infer F
    ? F extends FieldSchema ? FieldValue<F>
    : never
    : never
    : K extends T[number]["id"]
    ? Extract<T[number], { id: K }> extends infer F
    ? F extends FieldSchema ? FieldValue<F>
    : never
    : never
    : never;
};

function toAirtableValue<F extends FieldSchema>(
    value: inferWrite<F>,
    fieldSchema: F,
): unknown {
    const type = fieldSchema.type;
    const converterObj = CONVERTERS[type];
    if (!converterObj) {
        throw new Error(`No converter found for field type: ${type}`);
    }
    type AnyConverter = {
        makeTo: (fs: FieldSchema) => ((v: unknown) => unknown) | null;
    };
    const converter = (converterObj as AnyConverter).makeTo(fieldSchema);
    if (converter === null) {
        throw new Error(
            `Field type "${fieldSchema.type}" is read-only and cannot be written to.`,
        );
    }
    return converter(value);
}

export type AirtableNativeRecord<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["id"]]: inferWrite<Extract<T[number], { id: K }>>;
};

export function recordToAirtableRecord<
    V extends Partial<WriteRecord<F>>,
    F extends ReadonlyArray<FieldSchema>,
>(
    record: V,
    fieldSchemas: F,
): Partial<AirtableNativeRecord<F>> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) {
        const fieldSchema = lookupFieldSchema(k, fieldSchemas);
        const airtableValue = toAirtableValue(
            v as inferWrite<typeof fieldSchema>,
            fieldSchema,
        );
        result[fieldSchema.id] = airtableValue;
    }
    return result as Partial<AirtableNativeRecord<F>>;
}

function lookupFieldSchema(k: string, fieldSchemas: readonly FieldSchema[]) {
    let fieldSchema = fieldSchemas.find((fs) => fs.id === k);
    if (fieldSchema) return fieldSchema;
    fieldSchema = fieldSchemas.find((fs) => fs.name === k);
    if (fieldSchema) return fieldSchema;
    throw new Error(`No field schema found for key: ${k}`);
}
