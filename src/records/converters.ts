import { FieldSchemaRead } from "../fields/types.ts";
import { FieldId } from "../types.ts";
import { convertValueFromRead, convertValueForWrite, ValueFromRead, ValueForWrite } from "../fields/converters.ts";
import * as exceptions from "../exceptions.ts";

export type WriteValuesById<T extends FieldSchemaRead> = {
    [K in T["id"]]?: ValueForWrite<Extract<T, { id: K }>>;
};

/**
 * Given the {@link FieldSchemaRead}s for a table, return the format of the values a {@link TableClient} accepts for writing, eg for creating or updating records.
 * 
 * Each key can be either the field name or field ID, and the value is the appropriate type for writing to that field.
 */
export type ValuesForWrite<T extends FieldSchemaRead> = {
    [K in T["name"] | T["id"]]?: K extends T["name"]
    ? Extract<T, { name: K }> extends infer F
    ? F extends FieldSchemaRead ? ValueForWrite<F>
    : never
    : never
    : K extends T["id"]
    ? Extract<T, { id: K }> extends infer F
    ? F extends FieldSchemaRead ? ValueForWrite<F>
    : never
    : never
    : never;
};

/**
 * Given the {@link FieldSchemaRead}s for a table, return the format of the values a {@link TableClient} returns when reading records.
 * 
 * Each key is the field name, and the value is the appropriate type for reading from that field.
 */
export type ValuesFromRead<T extends FieldSchemaRead> = {
    [K in T["name"]]: ValueFromRead<Extract<T, { name: K }>>;
};

/**
 * Convert raw field values, freshly read from Airtable, into the appropriate TypeScript types, keyed by field names.
 * @param values The raw field values from Airtable, keyed by field IDs
 * @param fieldSchemas The array of {@link FieldSchemaRead} objects describing the fields in the table
 * @param onUnexpectedField Behavior when encountering a field in the values that is not described by the provided fieldSchemas.
 *                         This usually happens when someone adds a new field to a table after you've fetched the schema.
 *                         Defaults to { warn: true, keep: true }.
 *                         - "throw": throw an error
 *                         - { warn: boolean; keep: boolean; }:
 *                             - if warn is true, log a warning to the console.
 *                             - if keep is true, keep the unexpected field in the output record with its original field ID as the key. Otherwise, it will be omitted.
 * @returns The converted values with field names as keys and appropriate TypeScript types as values.
 * 
 * The airtable API omits empty fields. This function fills in these missing fields with default values,
 * which is null for most field types, but an empty array for some.
 */
export function convertValuesFromRead<
    F extends FieldSchemaRead,
>(
    rawValues: Readonly<Record<FieldId, unknown>>,
    fieldSchemas: ReadonlyArray<F>,
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; }
): ValuesFromRead<F> {
    onUnexpectedField = onUnexpectedField ?? { warn: true, keep: true };
    const result: Record<string, unknown> = {};
    const lookup = makeFieldLookup(fieldSchemas);
    const errors: exceptions.AirtableKitError[] = [];
    for (const [fieldId, rawValue] of Object.entries(rawValues)) {
        const fieldSchema = lookup.get(fieldId);
        if (fieldSchema) {
            try {
                result[fieldSchema.name] = convertValueFromRead(rawValue, fieldSchema);
            } catch (e) {
                if (e instanceof exceptions.ReadValueConversionError) {
                    errors.push(e as exceptions.ReadValueConversionError);
                    continue
                }
                throw e;
            }
        } else {
            if (onUnexpectedField === "throw") {
                errors.push(new exceptions.UnexpectedFieldReadError(fieldId as FieldId, rawValue));
                continue
            }
            if (onUnexpectedField.warn) {
                console.warn(`Warning: Unknown field in values for read: ${fieldId}. Known fields: ${fieldSchemas.map((f) => `${f.name} (id: ${f.id})`).join(", ")}`);
            }
            if (onUnexpectedField.keep) {
                result[fieldId] = rawValue;
            }
        }
    }
    // Sometimes, there is a field defined in the schema that isn't returned in the values from Airtable.
    // This can happen in two scenarios:
    //    1. The field is simply empty in airtable, so Airtable omits it.
    //    2. The field was deleted in the upstream airtable, but we still expect it in our code/schema.
    // Sometimes we can differentiate these cases, sometimes we can't:
    // If someone deleted a `singleLineText` field,
    // we can't differentiate that from an empty `singleLineText` field.
    // So the best we can do is assume that the field still exists, our schema is correct, and return a default value for it.
    // However, if there is a field that ALWAYS has a value (eg a createdTime or an autonumber),
    // the airtable API always returns it in the values.
    // So if it's missing, we can be sure that the field was deleted upstream,
    // and we should throw an error to alert the user of this fact.
    for (const fieldSchema of fieldSchemas) {
        if (!(fieldSchema.id in rawValues)) {
            try {
                const defaultValue = convertValueFromRead(null, fieldSchema);
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
            rawValues,
            fieldSchemas: fieldSchemas,
        });
    }
    return result as ValuesFromRead<F>;
}

/**
 * Convert a user-provided field values into the appropriate format for writing to Airtable.
 * @param values The user-provided field values, keyed by either field names or IDs as keys and appropriate javascript types as values
 * @param fieldSchemas The array of {@link FieldSchemaRead} objects describing the fields in the table
 * @returns The converted values with field IDs as keys and Airtable-compatible values
 */
export function convertValuesForWrite<
    V extends ValuesForWrite<F>,
    F extends FieldSchemaRead,
>(
    values: V,
    fieldSchemas: ReadonlyArray<F>,
): Partial<WriteValuesById<F>> {
    const result: Record<string, unknown> = {};
    const lookup = makeFieldLookup(fieldSchemas);
    for (const [k, v] of Object.entries(values)) {
        const fieldSchema = lookup.get(k);
        if (!fieldSchema) {
            throw new Error(`Unknown field in values for write: ${k}. Known fields: ${fieldSchemas.map((f) => `${f.name} (id: ${f.id})`).join(", ")}`);
        }
        const airtableValue = convertValueForWrite(
            v as ValueForWrite<typeof fieldSchema>,
            fieldSchema,
        );
        result[fieldSchema.id] = airtableValue;
    }
    return result as Partial<WriteValuesById<F>>;
}

function makeFieldLookup(fieldSchemas: readonly FieldSchemaRead[]) {
    const toField = new Map<string, FieldSchemaRead>();
    for (const fs of fieldSchemas) {
        // Set ID second so ID lookup takes precedence if there's a name/ID clash
        toField.set(fs.name, fs);
        toField.set(fs.id, fs);
    }
    return toField
}
