import { FieldSchema } from "../fields/types.ts";
import { FieldId } from "../types.ts";
import { convertFieldForRead, convertFieldForWrite, FieldRead, FieldWrite } from "./field-converters.ts";
import * as exceptions from "../exceptions.ts";

export type WriteRecordById<T extends FieldSchema> = {
    [K in T["id"]]?: FieldWrite<Extract<T, { id: K }>>;
};

/**
 * Given the {@link FieldSchema}s for a table, return the format of a record a {@link TableClient} accepts for writing, eg for creating or updating records.
 * 
 * Each key can be either the field name or field ID, and the value is the appropriate type for writing to that field.
 */
export type RecordWrite<T extends FieldSchema> = {
    [K in T["name"] | T["id"]]?: K extends T["name"]
    ? Extract<T, { name: K }> extends infer F
    ? F extends FieldSchema ? FieldWrite<F>
    : never
    : never
    : K extends T["id"]
    ? Extract<T, { id: K }> extends infer F
    ? F extends FieldSchema ? FieldWrite<F>
    : never
    : never
    : never;
};

/**
 * Given the {@link FieldSchema}s for a table, return the format of a record a {@link TableClient} returns when reading records.
 * 
 * Each key is the field name, and the value is the appropriate type for reading from that field.
 */
export type RecordRead<T extends FieldSchema> = {
    [K in T["name"]]: FieldRead<Extract<T, { name: K }>>;
};

/**
 * Convert a record, freshly read from Airtable, into the appropriate TypeScript types, keyed by field names.
 * @param record The raw record from Airtable, keyed by field IDs
 * @param fieldSchemas The array of {@link FieldSchema} objects describing the fields in the table
 * @param onUnexpectedField Behavior when encountering a field in the record that is not described by the provided fieldSchemas.
 *                         This usually happens when someone adds a new field to a table after you've fetched the schema.
 *                         Defaults to { warn: true, keep: true }.
 *                         - "throw": throw an error
 *                         - { warn: boolean; keep: boolean; }:
 *                             - if warn is true, log a warning to the console.
 *                             - if keep is true, keep the unexpected field in the output record with its original field ID as the key. Otherwise, it will be omitted.
 * @returns The converted record with field names as keys and appropriate TypeScript types as values.
 * 
 * The airtable API omits empty fields. This function fills in these missing fields with default values,
 * which is null for most field types, but an empty array for some.
 */
export function convertRecordForRead<
    F extends FieldSchema,
>(
    record: Readonly<Record<FieldId, unknown>>,
    fieldSchemas: ReadonlyArray<F>,
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; }
): RecordRead<F> {
    onUnexpectedField = onUnexpectedField ?? { warn: true, keep: true };
    const result: Record<string, unknown> = {};
    const lookup = makeFieldLookup(fieldSchemas);
    const errors: exceptions.AirtableKitError[] = [];
    for (const [fieldId, airtableValue] of Object.entries(record)) {
        const fieldSchema = lookup.get(fieldId);
        if (fieldSchema) {
            try {
                const value = convertFieldForRead(airtableValue, fieldSchema);
                result[fieldSchema.name] = value;
            } catch (e) {
                if (e instanceof exceptions.ReadValueConversionError) {
                    errors.push(e as exceptions.ReadValueConversionError);
                    continue
                }
                throw e;
            }
        } else {
            if (onUnexpectedField === "throw") {
                errors.push(new exceptions.UnexpectedFieldReadError(fieldId as FieldId, airtableValue));
                continue
            }
            if (onUnexpectedField.warn) {
                console.warn(`Warning: Unknown field in record for read: ${fieldId}. Known fields: ${fieldSchemas.map((f) => `${f.name} (id: ${f.id})`).join(", ")}`);
            }
            if (onUnexpectedField.keep) {
                result[fieldId] = airtableValue;
            }
        }
    }
    // Sometimes, there is a field defined in the schema that isn't returned in the record from Airtable.
    // This can happen in two scenarios:
    //    1. The field is simply empty in airtable, so Airtable omits it from the record.
    //    2. The field was deleted in the upstream airtable, but we still expect it in our code/schema.
    // Sometimes we can differentiate these cases, sometimes we can't:
    // If someone deleted a `singleLineText` field,
    // we can't differentiate that from an empty `singleLineText` field.
    // So the best we can do is assume that the field still exists, our schema is correct, and return a default value for it.
    // However, if there is a field that ALWAYS has a value (eg a createdTime or an autonumber),
    // the airtable API always returns it in the record.
    // So if it's missing, we can be sure that the field was deleted upstream,
    // and we should throw an error to alert the user of this fact.
    for (const fieldSchema of fieldSchemas) {
        if (!(fieldSchema.id in record)) {
            try {
                const defaultValue = convertFieldForRead(null, fieldSchema);
                result[fieldSchema.name] = defaultValue;
            } catch (e) {
                if (e instanceof exceptions.ReadValueConversionError) {
                    errors.push(new exceptions.MissingFieldReadError(fieldSchema));
                    continue;
                } else {
                    throw e;
                }
            }
        }
    }
    if (errors.length > 0) {
        throw new exceptions.RecordReadError({
            errors,
            rawRecord: record,
            fieldSchemas: fieldSchemas,
        });
    }
    return result as RecordRead<F>;
}

/**
 * Convert a user-provided record into the appropriate format for writing to Airtable.
 * @param record The user-provided record, keyed by either field names or IDs as keys and appropriate TypeScript types as values
 * @param fieldSchemas The array of {@link FieldSchema} objects describing the fields in the table
 * @returns The converted record with field IDs as keys and Airtable-compatible values
 */
export function convertRecordForWrite<
    V extends RecordWrite<F>,
    F extends FieldSchema,
>(
    record: V,
    fieldSchemas: ReadonlyArray<F>,
): Partial<WriteRecordById<F>> {
    const result: Record<string, unknown> = {};
    const lookup = makeFieldLookup(fieldSchemas);
    for (const [k, v] of Object.entries(record)) {
        const fieldSchema = lookup.get(k);
        if (!fieldSchema) {
            throw new Error(`Unknown field in record for write: ${k}. Known fields: ${fieldSchemas.map((f) => `${f.name} (id: ${f.id})`).join(", ")}`);
        }
        const airtableValue = convertFieldForWrite(
            v as FieldWrite<typeof fieldSchema>,
            fieldSchema,
        );
        result[fieldSchema.id] = airtableValue;
    }
    return result as Partial<WriteRecordById<F>>;
}

function makeFieldLookup(fieldSchemas: readonly FieldSchema[]) {
    const toField = new Map<string, FieldSchema>();
    for (const fs of fieldSchemas) {
        // Set ID second so ID lookup takes precedence if there's a name/ID clash
        toField.set(fs.name, fs);
        toField.set(fs.id, fs);
    }
    return toField
}
