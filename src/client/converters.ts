import {
    MultipleSelects,
    SelectChoice,
    SingleSelect,
} from "../fields/index.ts";
import { RecordId, type FieldSchema, type FieldType } from "../types.ts";

type ToAirtableConverter<T> = (value: T) => unknown;
type FromAirtableConverter<T> = (value: unknown) => T;
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
        (_fieldSchema: FieldOfType<"aiText">) => (value: unknown): string =>
            value as string,
} as const satisfies IConverters<never, string, FieldOfType<"aiText">>;

const AutoNumberConverters = {
    type: "autoNumber",
    makeTo: null,
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
        (_fieldSchema: FieldOfType<"checkbox">) => (value: unknown): boolean | null =>
            value as boolean | null,
} as const satisfies IConverters<
    boolean | null | undefined,
    boolean | null,
    FieldOfType<"checkbox">
>;

const CountConverters = {
    type: "count",
    makeTo: null,
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
    makeTo: null,
    makeFrom:
        (_fieldSchema: FieldOfType<"createdBy">) => (value: unknown): User =>
            value as User,
} as const satisfies IConverters<never, User, FieldOfType<"createdBy">>;

const CreatedTimeConverters = {
    type: "createdTime",
    makeTo: null,
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
        (_fieldSchema: FieldOfType<"currency">) => (value: number | null | undefined): number | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"currency">) => (value: unknown): number | null =>
            value as number | null,
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
    makeFrom: (_fieldSchema: FieldOfType<"date">) => (value: unknown): string | null =>
        value as string | null,
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
            (value: unknown): globalThis.Date | null => {
                if (value === null) return null;
                return new globalThis.Date(value as string);
            },
} as const satisfies IConverters<
    globalThis.Date | string | null | undefined,
    globalThis.Date | null,
    FieldOfType<"dateTime">
>;

const DurationConverters = {
    type: "duration",
    makeTo:
        (_fieldSchema: FieldOfType<"duration">) => (value: number | null | undefined): number | null | undefined =>
            value,
    makeFrom:
        (_fieldSchema: FieldOfType<"duration">) => (value: unknown): number | null =>
            value as number | null,
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldOfType<"duration">
>;

const EmailConverters = {
    type: "email",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
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

type FormulaReadType<F extends FieldOfType<"formula">> = F["options"] extends { result: infer R } ? R : never;
const FormulaConverters = {
    type: "formula",
    makeTo: null,
    makeFrom:
        <F extends FieldOfType<"formula">>(_fieldSchema: F) => (value: unknown): FormulaReadType<F> => {
            return value as FormulaReadType<F>;
        }
} as const satisfies IConverters<never, string | number, FieldOfType<"formula">>;

const LastModifiedByConverters = {
    type: "lastModifiedBy",
    makeTo: null,
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
    makeTo: null,
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
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
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
            (value: unknown): Array<MultipleAttachment> => value as Array<MultipleAttachment>,
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
            (value: unknown): User[] => value as User[],
} as const satisfies IConverters<
    User[],
    User[],
    FieldOfType<"multipleCollaborators">
>;

const MultipleLookupValuesConverters = {
    type: "multipleLookupValues",
    makeTo: null,
    makeFrom:
        (_fieldSchema: FieldOfType<"multipleLookupValues">) =>
            (value: unknown): unknown[] => value as unknown[],
} as const satisfies IConverters<
    never,
    unknown[],
    FieldOfType<"multipleLookupValues">
>;

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
            (value: unknown): RecordId[] => value as RecordId[],
} as const satisfies IConverters<
    RecordId[] | null | undefined,
    RecordId[],
    FieldOfType<"multipleRecordLinks">
>;

const MultipleSelectsConverters = {
    type: "multipleSelects",
    makeTo:
        <C extends SelectChoice>(fieldSchema: MultipleSelects<C>) =>
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
    makeTo: (_fieldSchema: FieldOfType<"percent">) => (value: number | null | undefined): number | null | undefined =>
        value,
    makeFrom:
        (_fieldSchema: FieldOfType<"percent">) => (value: unknown): number | null =>
            value as number | null,
} as const satisfies IConverters<
    number | null | undefined,
    number | null,
    FieldOfType<"percent">
>;

const PhoneNumberConverters = {
    type: "phoneNumber",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldOfType<"phoneNumber">
>;

const RatingConverters = {
    type: "rating",
    makeTo: (_fieldSchema: FieldOfType<"rating">) => (value: number | null | undefined): number | null | undefined =>
        value,
    makeFrom:
        (_fieldSchema: FieldOfType<"rating">) => (value: unknown): number | null =>
            value as number | null,
} as const satisfies IConverters<number | null | undefined, number | null, FieldOfType<"rating">>;

const RichTextConverters = {
    type: "richText",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldOfType<"richText">
>;

const RollupConverters = {
    type: "rollup",
    makeTo: null,
    makeFrom:
        (_fieldSchema: FieldOfType<"rollup">) => (value: unknown): unknown =>
            value,
} as const satisfies IConverters<never, unknown, FieldOfType<"rollup">>;

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
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
} as const satisfies IConverters<
    string | null | undefined,
    string,
    FieldOfType<"singleLineText">
>;

const SingleSelectConverters = {
    type: "singleSelect",
    makeTo:
        <C extends SelectChoice>(fieldSchema: SingleSelect<C>) =>
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
        <C extends SelectChoice>(_fieldSchema: SingleSelect<C>) =>
            (value: unknown): C => value as C,
} as const;

const UrlConverters = {
    type: "url",
    makeTo: (_: FieldSchema) => (value: string | null | undefined): string | null | undefined => value,
    makeFrom: (_: FieldSchema) => (value: unknown): string => value as string,
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
export type inferRead<F extends FieldSchema> = F extends FieldOfType<"aiText">
    ? string
    : F extends FieldOfType<"autoNumber"> ? number | null
    : F extends FieldOfType<"barcode"> ? BarcodeValue | null
    : F extends FieldOfType<"button"> ? string | null
    : F extends FieldOfType<"checkbox"> ? boolean | null
    : F extends FieldOfType<"count"> ? number | null
    : F extends FieldOfType<"createdBy"> ? User | null
    : F extends FieldOfType<"createdTime"> ? globalThis.Date
    : F extends FieldOfType<"currency"> ? number | null
    : F extends FieldOfType<"date"> ? string | null // ISO date string or null
    : F extends FieldOfType<"dateTime"> ? globalThis.Date | null
    : F extends FieldOfType<"duration"> ? number | null
    : F extends FieldOfType<"email"> ? string
    : F extends FieldOfType<"externalSyncSource"> ? unknown
    : F extends FieldOfType<"formula"> ? FormulaReadType<F>
    : F extends FieldOfType<"lastModifiedBy"> ? User | null
    : F extends FieldOfType<"lastModifiedTime"> ? globalThis.Date | null
    : F extends FieldOfType<"multilineText"> ? string
    : F extends FieldOfType<"multipleAttachments"> ? ReadonlyArray<MultipleAttachment> | null
    : F extends FieldOfType<"multipleCollaborators"> ? User[]
    : F extends FieldOfType<"multipleLookupValues"> ? unknown[]
    : F extends FieldOfType<"multipleRecordLinks"> ? RecordId[]
    : F extends MultipleSelects<infer C> ? C[]
    : F extends FieldOfType<"number"> ? number | null
    : F extends FieldOfType<"percent"> ? number | null
    : F extends FieldOfType<"phoneNumber"> ? string
    : F extends FieldOfType<"rating"> ? number | null
    : F extends FieldOfType<"richText"> ? string
    : F extends FieldOfType<"rollup"> ? unknown
    : F extends FieldOfType<"singleCollaborator"> ? User | null
    : F extends FieldOfType<"singleLineText"> ? string
    : F extends SingleSelect<infer C> ? C | null
    : F extends FieldOfType<"url"> ? string
    : never;

/** Given a FieldSchema, return the typescript type that can be written to it */
export type inferWrite<F extends FieldSchema> = F extends FieldOfType<"aiText">
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
    : F extends FieldOfType<"dateTime"> ? globalThis.Date | string | null | undefined
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
    : F extends MultipleSelects<infer C> ? ReadonlyArray<C["id"] | C["name"]> | null | undefined
    : F extends FieldOfType<"number"> ? number | null | undefined
    : F extends FieldOfType<"percent"> ? number | null | undefined
    : F extends FieldOfType<"phoneNumber"> ? string | null | undefined
    : F extends FieldOfType<"rating"> ? number | null | undefined
    : F extends FieldOfType<"richText"> ? string | null | undefined
    : F extends FieldOfType<"rollup"> ? never
    : F extends FieldOfType<"singleCollaborator"> ? UserWrite | null | undefined
    : F extends FieldOfType<"singleLineText"> ? string | null | undefined
    : F extends SingleSelect<infer C> ? C["id"] | C["name"] | null | undefined
    : F extends FieldOfType<"url"> ? string | null | undefined
    : never;

export type ReadRecordByName<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["name"]]: inferRead<Extract<T[number], { name: K }>>;
};
export type ReadRecordById<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["id"]]: inferRead<Extract<T[number], { id: K }>>;
};
export type WriteRecordById<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["id"]]?: inferWrite<Extract<T[number], { id: K }>>;
};

export type WriteRecord<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["name"] | T[number]["id"]]?: K extends T[number]["name"]
    ? Extract<T[number], { name: K }> extends infer F
    ? F extends FieldSchema ? inferWrite<F>
    : never
    : never
    : K extends T[number]["id"]
    ? Extract<T[number], { id: K }> extends infer F
    ? F extends FieldSchema ? inferWrite<F>
    : never
    : never
    : never;
};

export function convertForWrite<F extends FieldSchema>(
    value: inferWrite<F>,
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
        throw new Error(
            `Field type "${fieldSchema.type}" is read-only and cannot be written to.`,
        );
    }
    const converter = makeTo(fieldSchema);
    return converter(value);
}

export function convertForRead<F extends FieldSchema>(
    value: unknown,
    fieldSchema: F,
): inferRead<F> {
    const type = fieldSchema.type;
    const converterObj = CONVERTERS[type];
    if (!converterObj) {
        throw new Error(`No converter found for field type: ${type}`);
    }
    type AnyConverter = {
        makeFrom: null | ((fs: FieldSchema) => ((v: unknown) => unknown));
    };
    const makeFrom = (converterObj as AnyConverter).makeFrom;
    if (makeFrom === null) {
        throw new Error(
            `Field type "${fieldSchema.type}" is write-only and cannot be read from.`,
        );
    }
    const converter = makeFrom(fieldSchema);
    return converter(value) as inferRead<F>;
}

export function recordToAirtableRecord<
    V extends Partial<WriteRecord<F>>,
    F extends ReadonlyArray<FieldSchema>,
>(
    record: V,
    fieldSchemas: F,
): Partial<WriteRecordById<F>> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) {
        const fieldSchema = lookupFieldSchema(k, fieldSchemas);
        const airtableValue = convertForWrite(
            v as inferWrite<typeof fieldSchema>,
            fieldSchema,
        );
        result[fieldSchema.id] = airtableValue;
    }
    return result as Partial<WriteRecordById<F>>;
}

function lookupFieldSchema(k: string, fieldSchemas: readonly FieldSchema[]) {
    let fieldSchema = fieldSchemas.find((fs) => fs.id === k);
    if (fieldSchema) return fieldSchema;
    fieldSchema = fieldSchemas.find((fs) => fs.name === k);
    if (fieldSchema) return fieldSchema;
    throw new Error(`No field schema found for key: ${k}`);
}
