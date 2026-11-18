import { type Airtable, type IntoAirtable, createAirtable } from "../client.ts";
import type * as raw from "../records/api.ts";
import { Formula, formulaToString } from "../formula/formula.ts";
import { FieldSchemaCreate, FieldSchemaRead, type FieldId } from "../fields/types.ts";
import { Timezone } from "../fields/timezones.ts";
import { TableSchema } from "../tables/types.ts";
import { BaseId } from "../bases/types.ts";
import { RecordId } from "../records/types.ts";
import { type ListResult, makeListResult } from "../list-result.ts";
import { convertValuesForWrite, convertValuesFromRead, type ConvertibleFieldSchema, type ValuesForWrite, type ValuesFromRead } from "../records/converters.ts";

type FieldsByName<T extends ReadonlyArray<ConvertibleFieldSchema>> = {
    [K in T[number]as K["name"]]: K;
};

/**
 * The parts of a {@link TableSchema} a {@link TableClient} needs: the table ID and the fields it reads and writes,
 * each described by a {@link ConvertibleFieldSchema}.
 * A full {@link TableSchema} also satisfies this.
 */
export type TableClientSchema = {
    id: TableSchema["id"];
    fields: ReadonlyArray<ConvertibleFieldSchema>;
} & Partial<Omit<TableSchema, "id" | "fields">>;

type FieldType<T extends TableClientSchema> = T['fields'][number];
type FieldIdInTable<T extends TableClientSchema> = FieldType<T>['id'];
type FieldNameOrId<F extends ConvertibleFieldSchema> = F['name'] | F['id'];
type FieldNameOrIdInTable<T extends TableClientSchema> = FieldNameOrId<FieldType<T>>;

/** The field schemas in `F` selected by the field names or IDs `K`. */
export type SelectedFields<F extends ConvertibleFieldSchema, K extends FieldNameOrId<F>> =
    Extract<F, { name: K }> | Extract<F, { id: K }>;

/** Behavior when a record read from Airtable has a field that is not in the table schema. See {@link convertValuesFromRead}. */
export type OnReadUnexpectedField = "throw" | { warn: boolean; keep: boolean; };

/** Metadata that can be requested for each record with `recordMetadata` when listing records. */
export type RecordMetadata = 'commentCount';

/**
 * A record with field values converted using the table schema, keyed by field name.
 * See {@link raw.RawRecord} for the unconverted form.
 *
 * `M` is the {@link RecordMetadata} that was requested. Each requested kind adds its property,
 * eg `commentCount` when `M` includes `"commentCount"`.
 */
export type TypedRecord<F extends ConvertibleFieldSchema, M extends RecordMetadata = never> = {
    id: RecordId;
    createdTime: raw.Timestamp;
    fields: ValuesFromRead<F>;
} & ('commentCount' extends M ? {
    /** The number of comments on the record */
    commentCount: number;
} : {});

/** Options for {@link TableClient.listRecords}. */
export interface ListRecordsOptions<
    F extends ConvertibleFieldSchema,
    K extends FieldNameOrId<F> = FieldNameOrId<F>,
    M extends RecordMetadata = never,
> {
    /** Time zone for formatting dates when using cellFormat: "string" */
    timeZone?: Timezone;
    /** User locale for formatting dates when using cellFormat: "string" */
    userLocale?: string;
    /** Maximum total number of records to return */
    maxRecords?: number;
    /** View name or ID to filter by */
    view?: string;
    /** Sort configuration */
    sort?: ReadonlyArray<{ field: FieldNameOrId<F>; direction?: 'asc' | 'desc' }>;
    /** Formula to filter records, either a string or a {@link Formula} object */
    filterByFormula?: string | Formula<F>;
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
    /**
     * Fields to include (names or IDs).
     * Only these fields are returned, and the returned record type is narrowed to them.
     */
    fields?: ReadonlyArray<K>;
    /**
     * Metadata to include with each record.
     * The returned record type includes a property for each kind requested.
     */
    recordMetadata?: ReadonlyArray<M>;
}

/** Options for {@link TableClient.listRecordsPage}. */
export type ListRecordsPageOptions<
    F extends ConvertibleFieldSchema,
    K extends FieldNameOrId<F> = FieldNameOrId<F>,
    M extends RecordMetadata = never,
> = ListRecordsOptions<F, K, M> & {
    /** Number of records per page, at most 100 */
    pageSize?: number;
    /** The `offset` returned by the previous page */
    offset?: string;
};
export interface ListRecordsPageResponse<F extends ConvertibleFieldSchema, M extends RecordMetadata = never> {
    records: Array<TypedRecord<F, M>>;
    /** Pass to the next call to get the next page. Absent on the last page. */
    offset?: string;
}

/** Options for {@link TableClient.getRecord}. */
export interface GetRecordOptions {
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
}

/** Options for {@link TableClient.createRecords} and {@link TableClient.createRecord}. */
export interface CreateRecordsOptions {
    /** Let Airtable convert string values to the appropriate cell values */
    typecast?: boolean;
}

/** Response from {@link TableClient.createRecords}. */
export interface CreateRecordsResponse<F extends ConvertibleFieldSchema> {
    /** The created records, in the same order as the input. */
    records: Array<TypedRecord<F>>;
    /** Problems Airtable reported for an otherwise successful write. Empty if there were none. */
    warnings: raw.WriteWarning[];
}

/** Options for {@link TableClient.updateRecords}. */
export interface UpdateRecordsOptions<F extends ConvertibleFieldSchema> {
    /**
     * If not destructive (the default), then only the fields included in the update will be modified; all other fields will remain unchanged.
     * If destructive, then ALL fields in the target record will be updated, meaning that any fields not included in the update will be cleared.
     */
    destructive?: boolean;
    /** Enable upsert behavior */
    performUpsert?: {
        /** Fields to use as an external ID for matching (1-3 fields) */
        fieldsToMergeOn: ReadonlyArray<FieldNameOrId<F>>;
    };
    /** Let Airtable convert string values to the appropriate cell values */
    typecast?: boolean;
}

/** Response from {@link TableClient.updateRecords}. */
export interface UpdateRecordsResponse<F extends ConvertibleFieldSchema> {
    /** The written records, in the same order as the input. */
    records: Array<TypedRecord<F> & {
        /**
         * Whether the record was created or updated.
         * Records are only created when upserting with `performUpsert` and no existing record matched.
         */
        operation: "created" | "updated";
    }>;
    /** Problems Airtable reported for an otherwise successful write. Empty if there were none. */
    warnings: raw.WriteWarning[];
}

/**
 * Parameters for {@link TableClient.uploadAttachment}.
 *
 * `file` is a `Blob` (including a `File`), binary data, or a base64 encoded string.
 * `filename` defaults to the name of a `File`, and `contentType` to the type of a `Blob`.
 */
export type UploadAttachmentParams<F extends string = string> = {
    /** The record to attach the file to */
    recordId: RecordId;
    /** The attachment field's name or ID */
    field: F;
    /** Filename (e.g., "photo.jpg") */
    filename?: string;
    /** Content type (e.g., "image/jpeg") */
    contentType?: string;
} & (
    | { file: Blob }
    | { file: ArrayBuffer | ArrayBufferView | string; filename: string; contentType: string }
);

/**
 * A typed client for one table, which converts field values using the table's schema.
 *
 * Usually accessed as `baseClient.tables.<name>`, or created with {@link createTableClient}.
 */
export interface TableClient<T extends TableClientSchema = TableSchema> {
    /** The ID of the base this table belongs to, e.g. "appXXXXXXXXXXXXXXX" */
    baseId: BaseId;
    /** The schema of the table this client interacts with */
    schema: T;
    /** An object mapping field names to their field schemas */
    fields: FieldsByName<T["fields"]>;
    /** The {@link Airtable} client used to make requests */
    airtable: Airtable;

    /** Create a field in the table
     * 
     * @param field - A field schema to create
     * @returns A promise that resolves to the created field schema
     */
    createField(field: FieldSchemaCreate): Promise<FieldSchemaRead>;
    /** Update a field in the table
     * 
     * @param field - A field schema to update
     * @returns A promise that resolves to the updated field schema
     */
    updateField<F extends FieldIdInTable<T>>(field: { id: F; name?: string; description?: string }): Promise<FieldSchemaRead>;

    /**
     * Update the name and/or description of the table.
     */
    updateTable(params: { name?: string; description?: string }): Promise<TableSchema>;

    /** Create a record in the table
     * 
     * @param record - A record to create, keyed by either field name or field ID
     * @returns A promise that resolves to the created `record`, with its ID, createdTime, and field values,
     *   and the `warnings` Airtable reported, if any.
     * 
     * Any values of `null` or `undefined` in the input record will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createRecord(record: ValuesForWrite<FieldType<T>>, options?: CreateRecordsOptions): Promise<{
        record: TypedRecord<FieldType<T>>;
        warnings: raw.WriteWarning[];
    }>;

    /** Create multiple records in the table, sending them in batches of up to 25.
     * 
     * @param records - An array of records to create, each keyed by either field name or field ID
     * @returns A promise that resolves to the created records, in input order, and the `warnings` Airtable reported, if any.
     * 
     * Any values of `null` or `undefined` in the input records will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createRecords(
        records: ReadonlyArray<ValuesForWrite<FieldType<T>>>,
        options?: CreateRecordsOptions,
    ): Promise<CreateRecordsResponse<FieldType<T>>>;

    /**
     * List records from the table with optional filtering. Pagination is handled automatically.
     *
     * Await the result for an array of every record, or iterate it with `for await`
     * to fetch one page at a time. See {@link ListResult}.
     *
     * ```typescript
     * const done = await tasks.listRecords({ filterByFormula: "{Done}" });
     * for await (const task of tasks.listRecords()) {
     *     console.log(task.fields.name);
     * }
     * ```
     *
     * If `options.fields` is given, only those fields are returned, and the record type is narrowed to them.
     * If `options.recordMetadata` is given, the record type includes the requested metadata, eg `commentCount`.
     */
    listRecords<
        K extends FieldNameOrIdInTable<T> = FieldNameOrIdInTable<T>,
        M extends RecordMetadata = never,
    >(
        options?: ListRecordsOptions<FieldType<T>, K, M>
    ): ListResult<TypedRecord<SelectedFields<FieldType<T>, K>, M>>;

    /** List a single page of records. Pass the returned `offset` to get the next page. */
    listRecordsPage<
        K extends FieldNameOrIdInTable<T> = FieldNameOrIdInTable<T>,
        M extends RecordMetadata = never,
    >(
        options?: ListRecordsPageOptions<FieldType<T>, K, M>
    ): Promise<ListRecordsPageResponse<SelectedFields<FieldType<T>, K>, M>>;

    /** Get a single record by ID */
    getRecord(recordId: RecordId, options?: GetRecordOptions): Promise<TypedRecord<FieldType<T>>>;

    /**
     * Update records in the table, sending them in batches of up to 10.
     * 
     * @param records - An array of records to update, each with an optional ID and fields to update
     * @param options - Optional settings for the update operation
     * 
     * Any values of `undefined` in a record will be not be sent to Airtable, leaving those fields unchanged.
     * To explicitly clear a field, set its value to `null`.
     */
    updateRecords(
        records: ReadonlyArray<{ id?: RecordId; fields: Partial<ValuesForWrite<FieldType<T>>> }>,
        options?: UpdateRecordsOptions<FieldType<T>>
    ): Promise<UpdateRecordsResponse<FieldType<T>>>;

    /**
     * Update a single record.
     *
     * Any values of `undefined` will be not be sent to Airtable, leaving those fields unchanged.
     * To explicitly clear a field, set its value to `null`.
     */
    updateRecord(
        record: { id: RecordId; fields: Partial<ValuesForWrite<FieldType<T>>> },
        options?: Omit<UpdateRecordsOptions<FieldType<T>>, "performUpsert">
    ): Promise<{
        record: TypedRecord<FieldType<T>>;
        warnings: raw.WriteWarning[];
    }>;

    /**
     * Delete records by ID, sending them in batches of up to 10.
     *
     * @returns The IDs of the deleted records
     */
    deleteRecords(recordIds: ReadonlyArray<RecordId>): Promise<RecordId[]>;

    /**
     * Delete a single record by ID.
     *
     * @returns The ID of the deleted record
     */
    deleteRecord(recordId: RecordId): Promise<RecordId>;

    /**
     * Upload a file to a record's attachment field.
     *
     * ```typescript
     * await tasks.uploadAttachment({ recordId, field: "attachments", file: fileFromInput });
     * await tasks.uploadAttachment({ recordId, field: "attachments", file: bytes, filename: "a.png", contentType: "image/png" });
     * ```
     */
    uploadAttachment(params: UploadAttachmentParams<FieldNameOrIdInTable<T>>): Promise<raw.UploadAttachmentResponse>;

    /** Convert a {@link Formula} object for this table to a string */
    formulaToString(formula: Formula<FieldType<T>>): string;
}

/** Options shared by {@link createTableClient} and `createBaseClient`. */
export interface TypedClientOptions {
    /** An {@link Airtable} client, or options to create one. Defaults to `createAirtable()`. */
    airtable?: IntoAirtable;
    /** When reading from the Airtable API, behavior when encountering a field in a record that is not described by the table schema. */
    onReadUnexpectedField?: OnReadUnexpectedField;
}

/** Options for {@link createTableClient}. */
export interface TableClientOptions extends TypedClientOptions {
    /** The ID of the base the table belongs to */
    baseId: BaseId;
}

/**
 * Create a typed {@link TableClient}, which converts field values using the table's schema.
 *
 * ```typescript
 * import { createTableClient } from 'airtable-kit/typed';
 * import myBaseSchema from './schemas/myBase';
 *
 * const tasks = createTableClient(myBaseSchema.tables[0], { baseId: myBaseSchema.id });
 * const records = await tasks.listRecords();
 * ```
 *
 * @param tableSchema - The table's ID and the fields to read and write, eg a {@link TableSchema}. The client only reads and writes the fields it lists.
 * @param options - The base ID, and optionally the {@link Airtable} client to use. See {@link TableClientOptions}.
 */
export function createTableClient<T extends TableClientSchema>(
    tableSchema: T,
    options: TableClientOptions,
): TableClient<T> {
    type F = FieldType<T>;
    const { baseId, onReadUnexpectedField: onUnexpectedField } = options;
    const client = createAirtable(options.airtable);
    const tableId = tableSchema.id;
    const fields: ReadonlyArray<F> = tableSchema.fields;
    const fieldsByName = Object.fromEntries(
        fields.map(fieldSchema => [fieldSchema.name, fieldSchema])
    ) as FieldsByName<T["fields"]>;

    const toFieldSchema = (field: FieldNameOrId<F>): F => {
        const spec = fields.find(f => f.id === field || f.name === field);
        if (!spec) {
            throw new Error(`Field "${field}" not found in table schema.`);
        }
        return spec;
    };
    const fromRaw = <S extends ConvertibleFieldSchema, M extends RecordMetadata = never>(
        record: raw.RawRecord,
        readFields: ReadonlyArray<S>,
        metadata?: ReadonlyArray<M>,
    ): TypedRecord<S, M> => {
        const result: TypedRecord<S> & { commentCount?: number } = {
            id: record.id,
            createdTime: record.createdTime,
            fields: convertValuesFromRead(record.fields as Record<S['id'], unknown>, readFields, onUnexpectedField),
        };
        if (metadata?.includes("commentCount" as M)) {
            result.commentCount = record.commentCount ?? 0;
        }
        return result as TypedRecord<S, M>;
    };
    const toRawListOptions = <K extends FieldNameOrId<F>, M extends RecordMetadata>(listOptions: ListRecordsOptions<F, K, M> | undefined) => {
        const { sort, filterByFormula, fields: selected, ...rest } = listOptions ?? {};
        // When a subset of fields is requested, Airtable only returns those fields,
        // so only validate the returned values against those fields' schemas.
        // Otherwise, fields that are always present (eg createdTime) would look like
        // they had been deleted upstream.
        const readFields = (selected
            ? [...new Set(selected.map(toFieldSchema))]
            : fields) as ReadonlyArray<SelectedFields<F, K>>;
        const rawOptions: raw.ListRecordsOptions = {
            ...rest,
            returnFieldsByFieldId: true,
            sort: sort?.map((s) => ({ field: toFieldSchema(s.field).id, direction: s.direction })),
            filterByFormula: filterByFormula === undefined || typeof filterByFormula === "string"
                ? filterByFormula
                : formulaToString(fields, filterByFormula),
            fields: selected ? readFields.map((f) => f.id) : undefined,
        };
        // Airtable returns every field when no fields are requested, so with an empty
        // selection, drop the returned values instead of reporting them as unexpected.
        const toRecord = (record: raw.RawRecord) =>
            fromRaw(selected?.length === 0 ? { ...record, fields: {} } : record, readFields, listOptions?.recordMetadata);
        return { rawOptions, toRecord };
    };
    const withoutUndefined = (values: object) =>
        Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== undefined));

    const createRecords: TableClient<T>["createRecords"] = async (records, createOptions) => {
        const response = await client.records.create({
            baseId,
            tableId,
            records: records.map((record) => ({
                fields: convertValuesForWrite(
                    Object.fromEntries(Object.entries(record).filter(([_, v]) => v !== undefined && v !== null)) as ValuesForWrite<F>,
                    fields,
                ),
            })),
            typecast: createOptions?.typecast,
            returnFieldsByFieldId: true,
        });
        return {
            records: response.records.map((record) => fromRaw(record, fields)),
            warnings: response.warnings,
        };
    };

    const updateRecords: TableClient<T>["updateRecords"] = async (records, updateOptions) => {
        const response = await client.records.update({
            baseId,
            tableId,
            records: records.map((record) => {
                const converted: { id?: RecordId; fields: raw.RawFields } = {
                    fields: convertValuesForWrite(withoutUndefined(record.fields) as ValuesForWrite<F>, fields),
                };
                if (record.id) {
                    converted.id = record.id;
                }
                return converted;
            }),
            destructive: updateOptions?.destructive,
            performUpsert: updateOptions?.performUpsert && {
                fieldsToMergeOn: updateOptions.performUpsert.fieldsToMergeOn.map((f) => toFieldSchema(f).id),
            },
            typecast: updateOptions?.typecast,
            returnFieldsByFieldId: true,
        });
        return {
            records: response.records.map((record) => ({ ...fromRaw(record, fields), operation: record.operation })),
            warnings: response.warnings,
        };
    };

    const deleteRecords: TableClient<T>["deleteRecords"] = async (recordIds) => {
        const response = await client.records.delete({ baseId, tableId, recordIds });
        return response.records.map((r) => r.id);
    };

    return {
        baseId,
        schema: tableSchema,
        fields: fieldsByName,
        airtable: client,
        createField(field) {
            return client.fields.create({ baseId, tableId, field });
        },
        updateField(field: { id: FieldId; name?: string; description?: string }) {
            return client.fields.update({ baseId, tableId, field });
        },
        updateTable(params) {
            return client.tables.update({ baseId, table: { id: tableId, ...params } });
        },
        createRecords,
        async createRecord(record, createOptions) {
            const response = await createRecords([record], createOptions);
            return { record: response.records[0], warnings: response.warnings };
        },
        listRecords(listOptions) {
            const { rawOptions, toRecord } = toRawListOptions(listOptions);
            return makeListResult(async function* () {
                for await (const record of client.records.list({ baseId, tableId, ...rawOptions })) {
                    yield toRecord(record);
                }
            }, "listRecords");
        },
        async listRecordsPage(listOptions) {
            const { rawOptions, toRecord } = toRawListOptions(listOptions);
            const page = await client.records.listPage({
                baseId,
                tableId,
                ...rawOptions,
            });
            return {
                records: page.records.map(toRecord),
                offset: page.offset,
            };
        },
        async getRecord(recordId, getRecordOptions) {
            const record = await client.records.get({
                baseId,
                tableId,
                recordId,
                cellFormat: getRecordOptions?.cellFormat,
                returnFieldsByFieldId: true,
            });
            return fromRaw(record, fields);
        },
        updateRecords,
        async updateRecord(record, updateOptions) {
            const response = await updateRecords([record], updateOptions);
            const { operation: _, ...updated } = response.records[0];
            return { record: updated, warnings: response.warnings };
        },
        deleteRecords,
        async deleteRecord(recordId) {
            const [deleted] = await deleteRecords([recordId]);
            return deleted;
        },
        async uploadAttachment(params) {
            const { recordId, field, file } = params;
            const filename = params.filename ?? (isNamedBlob(file) ? file.name : undefined);
            const contentType = params.contentType || (file instanceof Blob ? file.type : undefined);
            if (!filename) {
                throw new Error("uploadAttachment: `filename` is required unless `file` is a File.");
            }
            if (!contentType) {
                throw new Error("uploadAttachment: `contentType` is required unless `file` is a Blob with a type.");
            }
            return client.records.uploadAttachment({
                baseId,
                recordId,
                field: toFieldSchema(field).id,
                contentType,
                filename,
                file: await toBase64(file),
            });
        },
        formulaToString(formula) {
            return formulaToString(fields, formula);
        },
    };
}

function isNamedBlob(file: unknown): file is Blob & { name: string } {
    return file instanceof Blob && typeof (file as { name?: unknown }).name === "string";
}

/** Encode file data as base64. A string is assumed to already be base64 encoded. */
async function toBase64(file: Blob | ArrayBuffer | ArrayBufferView | string): Promise<string> {
    if (typeof file === "string") {
        return file;
    }
    let bytes: Uint8Array;
    if (file instanceof Blob) {
        bytes = new Uint8Array(await file.arrayBuffer());
    } else if (ArrayBuffer.isView(file)) {
        bytes = new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
    } else {
        bytes = new Uint8Array(file);
    }
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}
