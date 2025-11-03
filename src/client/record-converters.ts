import { FieldSchema } from "../fields/types";
import { convertFieldForRead, convertFieldForWrite, FieldRead, FieldWrite } from "./field-converters";

export type ReadRecordByName<T extends FieldSchema> = {
    [K in T["name"]]: FieldRead<Extract<T, { name: K }>>;
};
export type ReadRecordById<T extends FieldSchema> = {
    [K in T["id"]]: FieldRead<Extract<T, { id: K }>>;
};
export type WriteRecordById<T extends FieldSchema> = {
    [K in T["id"]]?: FieldWrite<Extract<T, { id: K }>>;
};

export function convertFieldIdKeysToNames<T extends FieldSchema>(
    record: ReadRecordById<T>,
    fieldSpecs: ReadonlyArray<T>,
): ReadRecordByName<T> {
    return Object.fromEntries(Object.entries(record).map(([fieldId, value]) => {
        const fieldSchema = fieldSpecs.find((f) => f.id === fieldId);
        if (!fieldSchema) {
            throw new Error(`Unknown field ID in response: ${fieldId}`);
        }
        const fieldName = fieldSchema.name;
        if (fieldName === 'id') {
            throw new Error(`Field name "id" is not allowed`);
        }
        return [fieldName, value];
    })) as ReadRecordByName<T>;
}

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
 * Convert a record from Airtable into the appropriate TypeScript types for reading.
 * @param record The raw record from Airtable
 * @param fieldSchemas The array of {@link FieldSchema} objects describing the fields in the table
 * @returns The converted record with field names as keys and appropriate TypeScript types as values
 */
export function convertRecordForRead<
    F extends FieldSchema,
>(
    record: Record<string, unknown>,
    fieldSchemas: ReadonlyArray<F>,
): RecordRead<F> {
    const result: Record<string, unknown> = {};
    const lookup = makeFieldLookup(fieldSchemas);
    for (const [fieldId, airtableValue] of Object.entries(record)) {
        const fieldSchema = lookup(fieldId);
        const value = convertFieldForRead(airtableValue, fieldSchema);
        result[fieldSchema.name] = value;
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
        const fieldSchema = lookup(k);
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
    return (k: string) => {
        const fieldSchema = toField.get(k);
        if (!fieldSchema) {
            throw new Error(`No field schema found for key: ${k}`);
        }
        return fieldSchema;
    };
}