import { type RecordId, type BaseId, type TableSchema, FieldId } from "../types.ts";
import { IntoFetcher } from "../fetcher.ts";
import * as r from "../records/index.ts";
import { updateTable } from "../tables/index.ts";
import { createField, updateField } from "../fields/api.ts";
import { Formula, formulaToString } from "../formula/formula.ts";
import { FieldSchemaCreate, FieldSchemaRead } from "../fields/types.ts";

type FieldsByName<T extends Array<FieldSchemaRead> | ReadonlyArray<FieldSchemaRead>> = {
    [K in T[number]as K["name"]]: K;
};

type FieldType<T extends TableSchema> = T['fields'][number];

type FieldIdInTable<T extends TableSchema> = T['fields'][number]['id'];
/**
 * A client to interact with a specific table within an Airtable base.
 * 
 * Usually created via {@link makeTableClient}.
 */
export interface TableClient<T extends TableSchema = TableSchema> {
    /** The ID of the base this table belongs to, e.g. "appXXXXXXXXXXXXXXX" */
    baseId: BaseId;
    /** The {@link TableSchema} of the table this client interacts with */
    tableSchema: T;
    /** An object mapping field names to their respective {@link FieldSchemaRead} */
    fields: FieldsByName<T["fields"]>;

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
     * @returns A promise that resolves to the created record with its ID, createdTime, and field values
     * 
     * Any values of `null` or `undefined` in the input record will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createRecord(record: r.ValuesForWrite<FieldType<T>>): Promise<r.CreateRecordsRawResponse<FieldType<T>>[number]>;

    /** Create multiple records into the table
     * 
     * @param records - An array of records to create, each keyed by either field name or field ID
     * @returns A promise that resolves to an array of created records with their IDs, createdTimes, and field values
     * 
     * Any values of `null` or `undefined` in the input records will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createRecords(records: ReadonlyArray<r.ValuesForWrite<FieldType<T>>>): Promise<r.CreateRecordsResponse<FieldType<T>>>;

    /** List records from the table with optional filtering. Pagination is handled automatically. */
    listRecords(options?: r.ListRecordsOptions<FieldType<T>>): Promise<r.ListRecordsResponse<FieldType<T>>>;

    /** List records, but you are responsible for pagination */
    listRecordsRaw(options?: r.ListRecordsRawOptions<FieldType<T>>): Promise<r.ListRecordsRawResponse<FieldType<T>>>;

    /** Get a single record by ID */
    getRecord(recordId: RecordId, options?: r.GetRecordOptions): Promise<r.GetRecordResponse<FieldType<T>>>;

    /**
     * Update records in the table.
     * 
     * @param records - An array of records to update, each with an optional ID and fields to update
     * @param options - Optional settings for the update operation
     * 
     * Any values of `undefined` in a record will be not be sent to Airtable, leaving those fields unchanged.
     * To explicitly clear a field, set its value to `null`.
     */
    updateRecords(
        records: Array<{ id?: string; fields: Partial<r.ValuesForWrite<FieldType<T>>> }>,
        options?: r.UpdateRecordsOptions<FieldType<T>>
    ): Promise<r.UpdateRecordsResponse<FieldType<T>>>;

    /** Delete records by IDs */
    deleteRecords(recordIds: ReadonlyArray<RecordId>): Promise<r.DeleteRecordsResponse>;

    /** Upload an attachment to a record */
    uploadAttachment(
        recordId: RecordId,
        attachmentFieldIdOrName: string,
        options: r.UploadAttachmentOptions
    ): Promise<{
        id: RecordId;
        createdTime: r.Timestamp;
        fields: Record<string, unknown>;
    }>;

    /** Convert a {@link Formula} object for this table to a string */
    formulaToString(formula: Formula<FieldType<T>>): string;
}

/**
 * Options for creating a {@link TableClient} using {@link makeTableClient}.
 */
export type TableClientOptions<T extends TableSchema> = {
    baseId: BaseId;
    tableSchema: T;
    fetcher?: IntoFetcher;
    options?: {
        /** When reading from the Airtable API, behavior when encountering a field in a record that is not described by the provided tableSchema. */
        onReadUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
    };
};

/**
 * Create a {@link TableClient} for a specific table within an Airtable base.
 * 
 * Example usage:
 * ```typescript
 * import { makeTableClient } from 'airtable-kit';
 * import myBaseSchema from './schemas/myBase';
 * 
 * const tableSchema = myBaseSchema.tables.find(t => t.name === 'tasks');
 * if (!tableSchema) throw new Error('Table not found');
 * 
 * const tasksClient = makeTableClient({
 *   baseId: myBaseSchema.id,
 *   tableSchema,
 *   fetcher: YOUR_API_KEY,
 * });
 * const tasks = await tasksClient.list();
 * console.log(tasks);
 * ```
 */
export function makeTableClient<T extends TableSchema>(
    {
        baseId,
        tableSchema,
        fetcher,
        options,
    }: TableClientOptions<T>,
): TableClient<T> {
    const fieldsByName = Object.fromEntries(
        tableSchema.fields.map(fieldSchema => [fieldSchema.name, fieldSchema,])
    ) as FieldsByName<T["fields"]>

    return {
        baseId,
        tableSchema,
        fields: fieldsByName,
        createField(field: FieldSchemaCreate): Promise<FieldSchemaRead> {
            return createField({
                baseId,
                tableId: tableSchema.id,
                field,
                fetcher,
            });
        },
        updateField(field: { id: FieldId; name?: string; description?: string }): Promise<FieldSchemaRead> {
            return updateField({
                baseId,
                tableId: tableSchema.id,
                field,
                fetcher,
            });
        },
        updateTable(params: { name?: string; description?: string }): Promise<TableSchema> {
            return updateTable({
                baseId,
                table: {
                    id: tableSchema.id,
                    ...params,
                },
                fetcher,
            });
        },
        createRecords(records: ReadonlyArray<r.ValuesForWrite<FieldType<T>>>) {
            return r.createRecords<FieldType<T>>({
                records,
                baseId,
                tableId: tableSchema.id,
                fields: tableSchema.fields,
                fetcher,
                onUnexpectedField: options?.onReadUnexpectedField,
            });
        },
        async createRecord(record: r.ValuesForWrite<FieldType<T>>) {
            const raw = await r.createRecordsRaw<FieldType<T>>({
                records: [record],
                baseId,
                tableId: tableSchema.id,
                fields: tableSchema.fields,
                fetcher,
                onUnexpectedField: options?.onReadUnexpectedField,
            });
            return raw[0];
        },
        listRecords(listOptions?: r.ListRecordsOptions<FieldType<T>>) {
            return r.listRecords<FieldType<T>>({
                options: listOptions,
                baseId,
                tableId: tableSchema.id,
                fields: tableSchema.fields,
                fetcher,
                onUnexpectedField: options?.onReadUnexpectedField,
            });
        },
        async listRecordsRaw(listOptions?: r.ListRecordsRawOptions<FieldType<T>>) {
            return await r.listRecordsRaw<FieldType<T>>({
                options: listOptions,
                baseId,
                tableId: tableSchema.id,
                fields: tableSchema.fields,
                fetcher,
                onUnexpectedField: options?.onReadUnexpectedField,
            });
        },
        async getRecord(recordId: RecordId, getRecordOptions?: r.GetRecordOptions) {
            return await r.getRecord<FieldType<T>>({
                recordId,
                baseId,
                tableId: tableSchema.id,
                fields: tableSchema.fields,
                fetcher,
                options: getRecordOptions,
                onUnexpectedField: options?.onReadUnexpectedField,
            });
        },
        async updateRecords(
            records: Array<{ id?: string; fields: Partial<r.ValuesForWrite<FieldType<T>>> }>,
            updateRecordsOptions?: r.UpdateRecordsOptions<FieldType<T>>
        ) {
            return await r.updateRecords<FieldType<T>>({
                records,
                baseId,
                tableId: tableSchema.id,
                fields: tableSchema.fields,
                fetcher,
                options: updateRecordsOptions,
                onUnexpectedField: options?.onReadUnexpectedField,
            });
        },
        async deleteRecords(recordIds: ReadonlyArray<RecordId>) {
            return await r.deleteRecords({
                recordIds,
                baseId,
                tableId: tableSchema.id,
                fetcher,
            });
        },
        async uploadAttachment(
            recordId: RecordId,
            attachmentFieldIdOrName: FieldId | string,
            options: r.UploadAttachmentOptions
        ) {
            return await r.uploadAttachment({
                recordId,
                attachmentFieldIdOrName,
                options,
                baseId,
                fetcher,
            });
        },
        formulaToString(formula: Formula<FieldType<T>>): string {
            return formulaToString(tableSchema.fields, formula);
        }
    };
}