import { type RecordId, type BaseId, type TableSchema, FieldId } from "../types.ts";
import { IntoFetcher } from "../fetcher.ts";
import * as r from "../records/index.ts";
import { makeFetcher } from "../fetcher.ts";
import { Formula, formulaToString } from "../formula/formula.ts";

type FieldType<T extends TableSchema> = T['fields'][number];
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

    /** Create a record in the table
     * 
     * @param record - A record to create, keyed by either field names or field IDs
     * @returns A promise that resolves to the created record with its ID, createdTime, and field values
     * 
     * Any values of `null` or `undefined` in the input record will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createOne(record: r.RecordWrite<FieldType<T>>): Promise<r.CreateRecordsRawResponse<FieldType<T>>[number]>;

    /** Create multiple records into the table
     * 
     * @param records - An array of records to create, keyed by either field names or field IDs
     * @returns A promise that resolves to an array of created records with their IDs, createdTimes, and field values
     * 
     * Any values of `null` or `undefined` in the input records will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createMany(values: ReadonlyArray<r.RecordWrite<FieldType<T>>>): Promise<r.CreateRecordsResponse<FieldType<T>>>;

    /** List records from the table with optional filtering. Pagination is handled automatically. */
    list(options?: r.ListRecordsOptions<FieldType<T>>): Promise<r.ListRecordsResponse<FieldType<T>>>;

    /** List records, but you are responsible for pagination */
    listRaw(options?: r.ListRecordsRawOptions<FieldType<T>>): Promise<r.ListRecordsRawResponse<FieldType<T>>>;

    /** Get a single record by ID */
    get(recordId: RecordId, options?: r.GetRecordOptions): Promise<r.GetRecordResponse<FieldType<T>>>;

    /**
     * Update records in the table.
     * 
     * @param records - An array of records to update, each with an optional ID and fields to update
     * @param options - Optional settings for the update operation
     * 
     * Any values of `undefined` in a record will be not be sent to Airtable, leaving those fields unchanged.
     * To explicitly clear a field, set its value to `null`.
     */
    update(
        records: Array<{ id?: string; fields: Partial<r.RecordWrite<FieldType<T>>> }>,
        options?: r.UpdateRecordsOptions<FieldType<T>>
    ): Promise<r.UpdateRecordsResponse<FieldType<T>>>;

    /** Delete records by IDs */
    delete(recordIds: ReadonlyArray<RecordId>): Promise<r.DeleteRecordsResponse>;
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
        fetcher: intoFetcher,
        options: clientOptions,
    }: TableClientOptions<T>,
): TableClient<T> {
    const fetcher = makeFetcher(intoFetcher);
    const tableId = tableSchema.id;
    const fields = tableSchema.fields;
    return {
        baseId,
        tableSchema,
        createMany(records: ReadonlyArray<r.RecordWrite<FieldType<T>>>) {
            return r.createRecords<FieldType<T>>({
                records,
                fields,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        async createOne(record: r.RecordWrite<FieldType<T>>) {
            const raw = await r.createRecordsRaw<FieldType<T>>({
                records: [record],
                fields,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
            return raw[0];
        },
        list(options?: r.ListRecordsOptions<FieldType<T>>) {
            return r.listRecords<FieldType<T>>({
                options,
                fields,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        async listRaw(options?: r.ListRecordsRawOptions<FieldType<T>>) {
            return await r.listRecordsRaw<FieldType<T>>({
                options,
                fields,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        async get(recordId: RecordId, options?: r.GetRecordOptions) {
            return await r.getRecord<FieldType<T>>({
                recordId,
                fields,
                options,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        async update(
            records: Array<{ id?: string; fields: Partial<r.RecordWrite<FieldType<T>>> }>,
            options?: r.UpdateRecordsOptions<FieldType<T>>
        ) {
            return await r.updateRecords<FieldType<T>>({
                records,
                options,
                fields,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        async delete(recordIds: ReadonlyArray<RecordId>) {
            return await r.deleteRecords({
                recordIds,
                baseId,
                tableId,
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