import { type Airtable, type IntoAirtable, createAirtable } from "../client.ts";
import type * as raw from "../records/api.ts";
import type { RequestOptions } from "../request.ts";
import { Formula, formulaToString } from "../formula/formula.ts";
import { FieldSchemaCreate, FieldSchemaRead, type FieldId } from "../fields/types.ts";
import { Timezone } from "../fields/timezones.ts";
import { TableSchema } from "../tables/types.ts";
import { BaseId } from "../bases/types.ts";
import { RecordId } from "../records/types.ts";
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
> extends RequestOptions {
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
export type ListRecordsResponse<F extends ConvertibleFieldSchema, M extends RecordMetadata = never> = Array<TypedRecord<F, M>>;

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
export interface GetRecordOptions extends RequestOptions {
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
}

/** Response from {@link TableClient.createRecords}. */
export interface CreateRecordsResponse<F extends ConvertibleFieldSchema> {
    /** The created records, in the same order as the input. */
    records: Array<TypedRecord<F>>;
    /** Problems Airtable reported for an otherwise successful write. Empty if there were none. */
    warnings: raw.WriteWarning[];
}

/** Options for {@link TableClient.updateRecords}. */
export interface UpdateRecordsOptions<F extends ConvertibleFieldSchema> extends RequestOptions {
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

/** Options for {@link TableClient.uploadAttachment}. */
export interface UploadAttachmentOptions extends RequestOptions {
    /** Content type (e.g., "image/jpeg") */
    contentType: string;
    /** Base64 encoded file data */
    file: string;
    /** Filename (e.g., "photo.jpg") */
    filename: string;
}

/**
 * A typed client for one table, which converts field values using the table's schema.
 *
 * Usually accessed as `baseClient.tables.<name>`, or created with {@link createTableClient}.
 */
export interface TableClient<T extends TableClientSchema = TableSchema> {
    /** The ID of the base this table belongs to, e.g. "appXXXXXXXXXXXXXXX" */
    baseId: BaseId;
    /** The schema of the table this client interacts with */
    tableSchema: T;
    /** An object mapping field names to their field schemas */
    fields: FieldsByName<T["fields"]>;
    /** The {@link Airtable} client used to make requests */
    airtable: Airtable;

    /** Create a field in the table
     * 
     * @param field - A field schema to create
     * @param requestOptions - eg `{ signal }` to cancel the request
     * @returns A promise that resolves to the created field schema
     */
    createField(field: FieldSchemaCreate, requestOptions?: RequestOptions): Promise<FieldSchemaRead>;
    /** Update a field in the table
     * 
     * @param field - A field schema to update
     * @param requestOptions - eg `{ signal }` to cancel the request
     * @returns A promise that resolves to the updated field schema
     */
    updateField<F extends FieldIdInTable<T>>(
        field: { id: F; name?: string; description?: string },
        requestOptions?: RequestOptions,
    ): Promise<FieldSchemaRead>;

    /**
     * Update the name and/or description of the table.
     */
    updateTable(params: { name?: string; description?: string }, requestOptions?: RequestOptions): Promise<TableSchema>;

    /** Create a record in the table
     * 
     * @param record - A record to create, keyed by either field name or field ID
     * @param requestOptions - eg `{ signal }` to cancel the request
     * @returns A promise that resolves to the created `record`, with its ID, createdTime, and field values,
     *   and the `warnings` Airtable reported, if any.
     * 
     * Any values of `null` or `undefined` in the input record will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createRecord(record: ValuesForWrite<FieldType<T>>, requestOptions?: RequestOptions): Promise<{
        record: TypedRecord<FieldType<T>>;
        warnings: raw.WriteWarning[];
    }>;

    /** Create multiple records in the table, sending them in batches of up to 25.
     * 
     * @param records - An array of records to create, each keyed by either field name or field ID
     * @param requestOptions - eg `{ signal }` to cancel the requests
     * @returns A promise that resolves to the created records, in input order, and the `warnings` Airtable reported, if any.
     * 
     * Any values of `null` or `undefined` in the input records will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createRecords(
        records: ReadonlyArray<ValuesForWrite<FieldType<T>>>,
        requestOptions?: RequestOptions,
    ): Promise<CreateRecordsResponse<FieldType<T>>>;

    /**
     * List records from the table with optional filtering. Pagination is handled automatically.
     *
     * If `options.fields` is given, only those fields are returned, and the record type is narrowed to them.
     * If `options.recordMetadata` is given, the record type includes the requested metadata, eg `commentCount`.
     */
    listRecords<
        K extends FieldNameOrIdInTable<T> = FieldNameOrIdInTable<T>,
        M extends RecordMetadata = never,
    >(
        options?: ListRecordsOptions<FieldType<T>, K, M>
    ): Promise<ListRecordsResponse<SelectedFields<FieldType<T>, K>, M>>;

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
        records: ReadonlyArray<{ id?: string; fields: Partial<ValuesForWrite<FieldType<T>>> }>,
        options?: UpdateRecordsOptions<FieldType<T>>
    ): Promise<UpdateRecordsResponse<FieldType<T>>>;

    /** Delete records by IDs, sending them in batches of up to 10 */
    deleteRecords(recordIds: ReadonlyArray<RecordId>, requestOptions?: RequestOptions): Promise<raw.DeleteRecordsResponse>;

    /** Upload an attachment to a record */
    uploadAttachment(
        recordId: RecordId,
        attachmentFieldIdOrName: FieldNameOrIdInTable<T>,
        options: UploadAttachmentOptions
    ): Promise<raw.UploadAttachmentResponse>;

    /** Convert a {@link Formula} object for this table to a string */
    formulaToString(formula: Formula<FieldType<T>>): string;
}

/** Options for {@link createTableClient} and {@link createBaseClient}. */
export interface TableClientOptions {
    /** When reading from the Airtable API, behavior when encountering a field in a record that is not described by the table schema. */
    onReadUnexpectedField?: OnReadUnexpectedField;
}

/**
 * Create a typed {@link TableClient}, which converts field values using the table's schema.
 *
 * ```typescript
 * import { createTableClient } from 'airtable-kit/typed';
 * import myBaseSchema from './schemas/myBase';
 *
 * const tasks = createTableClient(myBaseSchema.id, myBaseSchema.tables[0], { apiKey: "patXXX" });
 * const records = await tasks.listRecords();
 * ```
 *
 * @param baseId - The ID of the base the table belongs to
 * @param tableSchema - The table's ID and the fields to read and write, eg a {@link TableSchema}. The client only reads and writes the fields it lists.
 * @param airtable - An {@link Airtable} client, or options to create one. Defaults to `createAirtable()`.
 * @param options - See {@link TableClientOptions}
 */
export function createTableClient<T extends TableClientSchema>(
    baseId: BaseId,
    tableSchema: T,
    airtable?: IntoAirtable,
    options?: TableClientOptions,
): TableClient<T> {
    type F = FieldType<T>;
    const client = createAirtable(airtable);
    const tableId = tableSchema.id;
    const fields: ReadonlyArray<F> = tableSchema.fields;
    const onUnexpectedField = options?.onReadUnexpectedField;
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
        const { sort, filterByFormula, fields: selected, signal: _signal, ...rest } = listOptions ?? {};
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

    const createRecords: TableClient<T>["createRecords"] = async (records, requestOptions) => {
        const response = await client.records.create({
            baseId,
            tableId,
            records: records.map((record) => ({
                fields: convertValuesForWrite(
                    Object.fromEntries(Object.entries(record).filter(([_, v]) => v !== undefined && v !== null)) as ValuesForWrite<F>,
                    fields,
                ),
            })),
            returnFieldsByFieldId: true,
            signal: requestOptions?.signal,
        });
        return {
            records: response.records.map((record) => fromRaw(record, fields)),
            warnings: response.warnings,
        };
    };

    return {
        baseId,
        tableSchema,
        fields: fieldsByName,
        airtable: client,
        createField(field, requestOptions) {
            return client.fields.create({ baseId, tableId, field, signal: requestOptions?.signal });
        },
        updateField(field: { id: FieldId; name?: string; description?: string }, requestOptions?: RequestOptions) {
            return client.fields.update({ baseId, tableId, field, signal: requestOptions?.signal });
        },
        updateTable(params, requestOptions) {
            return client.tables.update({ baseId, table: { id: tableId, ...params }, signal: requestOptions?.signal });
        },
        createRecords,
        async createRecord(record, requestOptions) {
            const response = await createRecords([record], requestOptions);
            return { record: response.records[0], warnings: response.warnings };
        },
        async listRecords(listOptions) {
            const { rawOptions, toRecord } = toRawListOptions(listOptions);
            const records = await client.records.list({ baseId, tableId, ...rawOptions, signal: listOptions?.signal });
            return records.map(toRecord);
        },
        async listRecordsPage(listOptions) {
            const { rawOptions, toRecord } = toRawListOptions(listOptions);
            const page = await client.records.listPage({
                baseId,
                tableId,
                ...rawOptions,
                signal: listOptions?.signal,
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
                signal: getRecordOptions?.signal,
            });
            return fromRaw(record, fields);
        },
        async updateRecords(records, updateOptions) {
            const response = await client.records.update({
                baseId,
                tableId,
                records: records.map((record) => {
                    const converted: { id?: string; fields: raw.RawFields } = {
                        fields: convertValuesForWrite(withoutUndefined(record.fields) as ValuesForWrite<F>, fields),
                    };
                    if (record.id) {
                        converted.id = record.id;
                    }
                    return converted;
                }),
                destructive: updateOptions?.destructive,
                performUpsert: updateOptions?.performUpsert,
                typecast: updateOptions?.typecast,
                returnFieldsByFieldId: true,
                signal: updateOptions?.signal,
            });
            return {
                records: response.records.map((record) => ({ ...fromRaw(record, fields), operation: record.operation })),
                warnings: response.warnings,
            };
        },
        deleteRecords(recordIds, requestOptions) {
            return client.records.delete({ baseId, tableId, recordIds, signal: requestOptions?.signal });
        },
        uploadAttachment(recordId, attachmentFieldIdOrName, uploadOptions) {
            return client.records.uploadAttachment({
                baseId,
                recordId,
                field: toFieldSchema(attachmentFieldIdOrName).id,
                ...uploadOptions,
            });
        },
        formulaToString(formula) {
            return formulaToString(fields, formula);
        },
    };
}
