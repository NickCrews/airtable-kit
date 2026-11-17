import { type Airtable, type IntoAirtable, toAirtable } from "../client.ts";
import type * as raw from "../records/api.ts";
import { Formula, formulaToString } from "../formula/formula.ts";
import { FieldSchemaCreate, FieldSchemaRead, type FieldId } from "../fields/types.ts";
import { Timezone } from "../fields/timezones.ts";
import { TableSchema } from "../tables/types.ts";
import { BaseId } from "../bases/types.ts";
import { RecordId } from "../records/types.ts";
import { convertValuesForWrite, convertValuesFromRead, type ValuesForWrite, type ValuesFromRead } from "../records/converters.ts";

type FieldsByName<T extends ReadonlyArray<FieldSchemaRead>> = {
    [K in T[number]as K["name"]]: K;
};

type FieldType<T extends TableSchema> = T['fields'][number];
type FieldIdInTable<T extends TableSchema> = FieldType<T>['id'];
type FieldNameOrId<F extends FieldSchemaRead> = F['name'] | F['id'];
type FieldNameOrIdInTable<T extends TableSchema> = FieldNameOrId<FieldType<T>>;

/** The field schemas in `F` selected by the field names or IDs `K`. */
export type SelectedFields<F extends FieldSchemaRead, K extends FieldNameOrId<F>> =
    Extract<F, { name: K }> | Extract<F, { id: K }>;

/** Behavior when a record read from Airtable has a field that is not in the table schema. See {@link convertValuesFromRead}. */
export type OnReadUnexpectedField = "throw" | { warn: boolean; keep: boolean; };

/** A record with values converted according to the table schema, keyed by field name. */
export interface TypedRecord<F extends FieldSchemaRead> {
    id: RecordId;
    createdTime: raw.Timestamp;
    fields: ValuesFromRead<F>;
    /** Only present when `recordMetadata: ["commentCount"]` is requested */
    commentCount?: number;
}

/** Options for {@link TableClient.listRecords}. */
export interface ListRecordsOptions<
    F extends FieldSchemaRead,
    K extends FieldNameOrId<F> = FieldNameOrId<F>,
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
    /** Include metadata like comment count */
    recordMetadata?: ReadonlyArray<'commentCount'>;
}
export type ListRecordsResponse<F extends FieldSchemaRead> = Array<TypedRecord<F>>;

/** Options for {@link TableClient.listRecordsPage}. */
export type ListRecordsPageOptions<
    F extends FieldSchemaRead,
    K extends FieldNameOrId<F> = FieldNameOrId<F>,
> = ListRecordsOptions<F, K> & {
    /** Number of records per page, at most 100 */
    pageSize?: number;
    /** The `offset` returned by the previous page */
    offset?: string;
};
export interface ListRecordsPageResponse<F extends FieldSchemaRead> {
    records: Array<TypedRecord<F>>;
    /** Pass to the next call to get the next page. Absent on the last page. */
    offset?: string;
}

/** Options for {@link TableClient.getRecord}. */
export interface GetRecordOptions {
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
}

/** Response from {@link TableClient.createRecords}. */
export interface CreateRecordsResponse<F extends FieldSchemaRead> {
    /** The created records, in the same order as the input. */
    records: Array<TypedRecord<F>>;
    /** Problems Airtable reported for an otherwise successful write. Empty if there were none. */
    warnings: raw.WriteWarning[];
}

/** Options for {@link TableClient.updateRecords}. */
export interface UpdateRecordsOptions<F extends FieldSchemaRead> {
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
export interface UpdateRecordsResponse<F extends FieldSchemaRead> {
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
export interface UploadAttachmentOptions {
    /** Content type (e.g., "image/jpeg") */
    contentType: string;
    /** Base64 encoded file data */
    file: string;
    /** Filename (e.g., "photo.jpg") */
    filename: string;
}

/**
 * A client for one table, which converts values according to the table's schema.
 *
 * Usually accessed as `baseClient.tables.<name>`, or created with {@link createTableClient}.
 */
export interface TableClient<T extends TableSchema = TableSchema> {
    /** The ID of the base this table belongs to, e.g. "appXXXXXXXXXXXXXXX" */
    baseId: BaseId;
    /** The {@link TableSchema} of the table this client interacts with */
    tableSchema: T;
    /** An object mapping field names to their respective {@link FieldSchemaRead} */
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
    createRecord(record: ValuesForWrite<FieldType<T>>): Promise<{
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
    createRecords(records: ReadonlyArray<ValuesForWrite<FieldType<T>>>): Promise<CreateRecordsResponse<FieldType<T>>>;

    /**
     * List records from the table with optional filtering. Pagination is handled automatically.
     *
     * If `options.fields` is given, only those fields are returned, and the record type is narrowed to them.
     */
    listRecords<K extends FieldNameOrIdInTable<T> = FieldNameOrIdInTable<T>>(
        options?: ListRecordsOptions<FieldType<T>, K>
    ): Promise<ListRecordsResponse<SelectedFields<FieldType<T>, K>>>;

    /** List a single page of records. Pass the returned `offset` to get the next page. */
    listRecordsPage<K extends FieldNameOrIdInTable<T> = FieldNameOrIdInTable<T>>(
        options?: ListRecordsPageOptions<FieldType<T>, K>
    ): Promise<ListRecordsPageResponse<SelectedFields<FieldType<T>, K>>>;

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

    /** Delete records by IDs */
    deleteRecords(recordIds: ReadonlyArray<RecordId>): Promise<raw.DeleteRecordsResponse>;

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
 * Create a {@link TableClient} for a table, which converts values according to the table's schema.
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
 * @param tableSchema - The table's schema. The client only reads and writes the fields it lists.
 * @param airtable - An {@link Airtable} client, or options to create one. Defaults to `createAirtable()`.
 * @param options - See {@link TableClientOptions}
 */
export function createTableClient<T extends TableSchema>(
    baseId: BaseId,
    tableSchema: T,
    airtable?: IntoAirtable,
    options?: TableClientOptions,
): TableClient<T> {
    type F = FieldType<T>;
    const client = toAirtable(airtable);
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
    const fromRaw = <S extends FieldSchemaRead>(record: raw.RawRecord, readFields: ReadonlyArray<S>): TypedRecord<S> => {
        const result: TypedRecord<S> = {
            id: record.id,
            createdTime: record.createdTime,
            fields: convertValuesFromRead(record.fields as Record<S['id'], unknown>, readFields, onUnexpectedField),
        };
        if (record.commentCount !== undefined) {
            result.commentCount = record.commentCount;
        }
        return result;
    };
    const toRawListOptions = <K extends FieldNameOrId<F>>(listOptions: ListRecordsOptions<F, K> | undefined) => {
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
        return { rawOptions, readFields };
    };
    const withoutUndefined = (values: object) =>
        Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== undefined));

    const createRecords: TableClient<T>["createRecords"] = async (records) => {
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
        async createRecord(record) {
            const response = await createRecords([record]);
            return { record: response.records[0], warnings: response.warnings };
        },
        async listRecords(listOptions) {
            const { rawOptions, readFields } = toRawListOptions(listOptions);
            const records = await client.records.list({ baseId, tableId, ...rawOptions });
            return records.map((record) => fromRaw(record, readFields));
        },
        async listRecordsPage(listOptions) {
            const { rawOptions, readFields } = toRawListOptions(listOptions);
            const page = await client.records.listPage({
                baseId,
                tableId,
                ...rawOptions,
                pageSize: listOptions?.pageSize,
                offset: listOptions?.offset,
            });
            return {
                records: page.records.map((record) => fromRaw(record, readFields)),
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
            });
            return {
                records: response.records.map((record) => ({ ...fromRaw(record, fields), operation: record.operation })),
                warnings: response.warnings,
            };
        },
        deleteRecords(recordIds) {
            return client.records.delete({ baseId, tableId, recordIds });
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
