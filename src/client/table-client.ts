import { type RecordId, type BaseId, type TableId, type TableSchema, type FieldSchema, FieldId, AttachmentId, BaseSchema } from "../types.ts";
import { Fetcher, IntoFetcher } from "./fetcher.ts";
import {
    convertRecordForWrite,
    type RecordWrite,
    type RecordRead,
    type WriteRecordById,
    convertRecordForRead,
} from "./record-converters.ts";
import { makeFetcher } from "./fetcher.ts";
import { Timezone } from "../fields/timezones.ts";
import { Formula, formulaToString } from "../formula/formula.ts";
import { FieldRead } from "./field-converters.ts";

type FieldNameOrId<T extends FieldSchema> = T['name'] | T['id'];

/**
 * Options for listing records
 */
export interface ListRecordsOptions<T extends FieldSchema> {
    /** Time zone for formatting dates when using cellFormat: "string" */
    timeZone?: Timezone;
    /** User locale for formatting dates when using cellFormat: "string" */
    userLocale?: string;
    /** Number of records per page (max 100, default 100) */
    pageSize?: number;
    /** Maximum total number of records to return */
    maxRecords?: number;
    /** Offset for pagination */
    offset?: string;
    /** View name or ID to filter by */
    view?: string;
    /** Sort configuration */
    sort?: Array<{ field: FieldNameOrId<T>; direction?: 'asc' | 'desc' }>;
    /** Formula to filter records, either a string or a {@link Formula} object */
    filterByFormula?: string | Formula<T>;
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
    /** Fields to include (names or IDs) */
    fields?: FieldNameOrId<T>[];
    /** Include metadata like comment count */
    recordMetadata?: Array<'commentCount'>;
}

/**
 * Response from listing records
 */
export interface ListRecordsResponse<T extends FieldSchema> {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: RecordRead<T>;
        commentCount?: number;
    }>;
    offset?: RecordId;
}

/**
 * Options for getting a single record
 */
export interface GetRecordOptions {
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
}

export interface GetRecordResponse<T extends FieldSchema> {
    id: RecordId;
    createdTime: Timestamp;
    fields: RecordRead<T>;
}

/**
 * Options for updating records
 */
export interface UpdateRecordsOptions<T extends FieldSchema> {
    /**
     * If not destructive (the default), then only the fields included in the update will be modified; all other fields will remain unchanged.
     * If destructive, then ALL fields in the target record will be updated, meaning that any fields not included in the update will be cleared. 
    */
    destructive?: boolean;
    /** Enable upsert behavior */
    performUpsert?: {
        /** Fields to use as external ID for matching (1-3 fields) */
        fieldsToMergeOn: T['name'][];
    };
    /** Enable typecasting for string values */
    typecast?: boolean;
}

/**
 * Response from updating records
 */
export interface UpdateRecordsResponse<T extends FieldSchema> {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: RecordRead<T>;
    }>;
    details?: {
        message: 'partialSuccess';
        reasons: Array<'attachmentsFailedUploading' | 'attachmentUploadRateIsTooHigh'>;
    };
    createdRecords?: RecordId[];
    updatedRecords?: RecordId[];
}

/**
 * Response from deleting records
 */
export interface DeleteRecordsResponse {
    records: Array<{
        id: RecordId;
        deleted: true;
    }>;
}

/**
 * Options for uploading an attachment
 */
export interface UploadAttachmentOptions {
    /** Content type (e.g., "image/jpeg") */
    contentType: string;
    /** Base64 encoded file data */
    file: string;
    /** Filename (e.g., "photo.jpg") */
    filename: string;
}

// type CreateRecordArgs<T extends ReadonlyArray<FieldSchema>> = Partial<WriteRecord<T>>;
// type CreateRecordsArgs<T extends ReadonlyArray<FieldSchema>> = Array<CreateRecordArgs<T>>;
type CreateRecordResult<T extends FieldSchema> = {
    id: RecordId,
    fields: RecordRead<T>,
    createdTime: Timestamp,
}
// type CreateRecordsResult<T extends ReadonlyArray<FieldSchema>> = Array<CreateRecordResult<T>>;

type FieldType<T extends TableSchema> = T['fields'][number];
/**
 * A client to interact with a specific table within an Airtable base.
 * 
 * Usually created via {@link makeTableClient}.
 */
export interface TableClient<T extends TableSchema> {
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
    createOne(record: RecordWrite<FieldType<T>>): Promise<CreateRecordResult<FieldType<T>>>;

    /** Create multiple records into the table
     * 
     * @param records - An array of records to create, keyed by either field names or field IDs
     * @returns A promise that resolves to an array of created records with their IDs, createdTimes, and field values
     * 
     * Any values of `null` or `undefined` in the input records will not be passed
     * to Airtable, effectively leaving those fields blank on creation.
     */
    createMany(values: ReadonlyArray<RecordWrite<FieldType<T>>>): Promise<Array<{
        id: RecordId,
        fields: RecordRead<FieldType<T>>,
        createdTime: Timestamp,
    }>>;

    /** List records from the table with optional filtering and pagination */
    list(options?: ListRecordsOptions<FieldType<T>>): Promise<ListRecordsResponse<FieldType<T>>>;

    /** Get a single record by ID */
    get(recordId: RecordId, options?: GetRecordOptions): Promise<GetRecordResponse<FieldType<T>>>;

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
        records: Array<{ id?: string; fields: Partial<RecordWrite<FieldType<T>>> }>,
        options?: UpdateRecordsOptions<FieldType<T>>
    ): Promise<UpdateRecordsResponse<FieldType<T>>>;

    /** Delete records by IDs */
    delete(recordIds: ReadonlyArray<RecordId>): Promise<DeleteRecordsResponse>;

    /** Upload an attachment to a record */
    uploadAttachment(
        recordId: RecordId,
        attachmentFieldIdOrName: string,
        options: UploadAttachmentOptions
    ): Promise<{
        id: RecordId;
        createdTime: Timestamp;
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
    const fieldSpecs = tableSchema.fields;
    return {
        baseId,
        tableSchema,
        createMany(records: ReadonlyArray<RecordWrite<FieldType<T>>>) {
            return createMany<FieldType<T>>(records, {
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        async createOne(records: RecordWrite<FieldType<T>>) {
            const raw = await createMany<FieldType<T>>([records], {
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
            return raw[0];
        },
        list(options?: ListRecordsOptions<FieldType<T>>) {
            return list<FieldType<T>>({
                options,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        get(recordId: RecordId, options?: GetRecordOptions) {
            return getRecord<FieldType<T>>({
                recordId,
                fieldSpecs,
                options,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        update(
            records: Array<{ id?: string; fields: Partial<RecordWrite<FieldType<T>>> }>,
            options?: UpdateRecordsOptions<FieldType<T>>
        ) {
            return update<FieldType<T>>({
                records,
                options,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
                onUnexpectedField: clientOptions?.onReadUnexpectedField,
            });
        },
        delete(recordIds: ReadonlyArray<RecordId>) {
            return deleteRecords({
                recordIds,
                baseId,
                tableId,
                fetcher,
            });
        },
        uploadAttachment(
            recordId: RecordId,
            attachmentFieldIdOrName: FieldId | string,
            options: UploadAttachmentOptions
        ) {
            return uploadAttachment({
                recordId,
                attachmentFieldIdOrName,
                options,
                baseId,
                tableId,
                fetcher,
            });
        },
        formulaToString(formula: Formula<FieldType<T>>): string {
            return formulaToString(tableSchema.fields, formula);
        }
    };
}

// https://airtable.com/developers/web/api/create-records
type RawReadRecord<T extends FieldSchema> = {
    [K in T["id"]]: FieldRead<Extract<T, { id: K }>>;
}
type CreateRawResponse<T extends FieldSchema> = {
    records: Array<{
        id: `rec${string}`;
        createdTime: string;
        fields: RawReadRecord<T>;
    }>;
};

export async function createMany<T extends FieldSchema>(
    records: ReadonlyArray<RecordWrite<T>>,
    {
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField
    }: {
        fieldSpecs: ReadonlyArray<T>;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
        onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
    },
) {
    if (records.length === 0) {
        return [];
    }
    const convertedToAirtable = records.map((record) => {
        const withoutUndefinedAndNulls = Object.fromEntries(
            Object.entries(record).filter(([_, v]) => v !== undefined && v !== null)
        );
        return {
            fields: convertRecordForWrite(
                withoutUndefinedAndNulls as Partial<RecordWrite<T>>,
                fieldSpecs,
            ),
        };
    });
    const raw = await fetcher.fetch<CreateRawResponse<T>>({
        path: `/${baseId}/${tableId}`,
        method: "POST",
        data: {
            records: convertedToAirtable,
            returnFieldsByFieldId: true,
        },
    });
    const result = raw.records.map((record) => ({
        id: record.id,
        fields: convertRecordForRead(record.fields, fieldSpecs, onUnexpectedField),
        createdTime: record.createdTime,
    }));
    return result;
}

/** ISO 8601 format in UTC, eg `2024-01-01T12:00:00.000Z` */
type Timestamp = string;
type ListRawResponse<T extends FieldSchema> = {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: RawReadRecord<T>;
        commentCount: number;
    }>;
    offset?: RecordId;
};

export async function list<T extends FieldSchema>(
    {
        options,
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: {
        options?: ListRecordsOptions<T>;
        fieldSpecs: ReadonlyArray<T>;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
        onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
    },
): Promise<ListRecordsResponse<T>> {
    const queryParams = new URLSearchParams();
    queryParams.append('returnFieldsByFieldId', 'true');

    if (options?.timeZone) queryParams.append('timeZone', options.timeZone);
    if (options?.userLocale) queryParams.append('userLocale', options.userLocale);
    if (options?.pageSize) queryParams.append('pageSize', String(options.pageSize));
    if (options?.maxRecords) queryParams.append('maxRecords', String(options.maxRecords));
    if (options?.offset) queryParams.append('offset', options.offset);
    if (options?.view) queryParams.append('view', options.view);
    if (options?.filterByFormula) queryParams.append('filterByFormula', typeof options.filterByFormula === 'string' ? options.filterByFormula : formulaToString(fieldSpecs, options.filterByFormula));
    if (options?.cellFormat) queryParams.append('cellFormat', options.cellFormat);

    if (options?.sort) {
        options.sort.forEach((s, i) => {
            queryParams.append(`sort[${i}][field]`, s.field);
            if (s.direction) queryParams.append(`sort[${i}][direction]`, s.direction);
        });
    }

    if (options?.fields) {
        options.fields.forEach(field => {
            queryParams.append('fields[]', field);
        });
    }

    if (options?.recordMetadata) {
        options.recordMetadata.forEach(meta => {
            queryParams.append('recordMetadata[]', meta);
        });
    }

    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}${query ? `?${query}` : ''}`;

    const raw = await fetcher.fetch<ListRawResponse<T>>({
        path,
        method: "GET",
    });

    return {
        records: raw.records.map((record) => {
            return {
                id: record.id,
                createdTime: record.createdTime,
                fields: convertRecordForRead(record.fields, fieldSpecs, onUnexpectedField),
                commentCount: record.commentCount,
            };
        }),
    } as ListRecordsResponse<T>;
}

type GetRawResponse<T extends FieldSchema> = {
    id: RecordId;
    createdTime: Timestamp;
    fields: RawReadRecord<T>;
};

export async function getRecord<T extends FieldSchema>(
    {
        recordId,
        fieldSpecs,
        options,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: {
        recordId: RecordId;
        fieldSpecs: ReadonlyArray<T>;
        options?: GetRecordOptions;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
        onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
    },
): Promise<{
    id: RecordId;
    createdTime: Timestamp;
    fields: RecordRead<T>;
}> {
    const queryParams = new URLSearchParams();
    queryParams.append('returnFieldsByFieldId', 'true');

    if (options?.cellFormat) queryParams.append('cellFormat', options.cellFormat);

    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}/${recordId}${query ? `?${query}` : ''}`;

    const result = await fetcher.fetch<GetRawResponse<T>>({
        path,
        method: "GET",
    });

    return {
        id: result.id,
        createdTime: result.createdTime,
        fields: convertRecordForRead(result.fields, fieldSpecs, onUnexpectedField),
    }
}

// https://airtable.com/developers/web/api/update-multiple-records
type UpdateRawRequestBody<T extends FieldSchema> = {
    records: Array<{
        id?: string;
        fields: WriteRecordById<T>;
    }>;
    performUpsert?: {
        fieldsToMergeOn: string[];
    };
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
};
type UpdateRawResponse<T extends FieldSchema> = {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: RawReadRecord<T>;
    }>;
    details?: {
        message: 'partialSuccess';
        reasons: Array<'attachmentsFailedUploading' | 'attachmentUploadRateIsTooHigh'>;
    };
    createdRecords?: RecordId[];
    updatedRecords?: RecordId[];
};
export async function update<T extends FieldSchema>(
    {
        records,
        options,
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: {
        records: Array<{ id?: string; fields: RecordWrite<T> }>;
        options?: UpdateRecordsOptions<T>;
        fieldSpecs: ReadonlyArray<T>;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
        onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
    },
): Promise<UpdateRecordsResponse<T>> {
    if (records.length === 0) {
        return {
            records: [],
        };
    }
    const rawRequestBody: UpdateRawRequestBody<T> = {
        records: records.map((record) => {
            const withoutUndefined = Object.fromEntries(
                Object.entries(record.fields).filter(([_, v]) => v !== undefined)
            );
            const converted: UpdateRawRequestBody<T>['records'][number] = {
                fields: convertRecordForWrite(
                    withoutUndefined as Partial<RecordWrite<T>>,
                    fieldSpecs,
                ),
            };
            if (record.id) {
                converted.id = record.id;
            }
            return converted;
        }),
        returnFieldsByFieldId: true,
    };
    if (options?.typecast) rawRequestBody.typecast = true;
    if (options?.performUpsert) {
        rawRequestBody.performUpsert = {
            fieldsToMergeOn: options.performUpsert.fieldsToMergeOn,
        };
    }

    const path = `/${baseId}/${tableId}`;
    const method = options?.destructive ? "PUT" : "PATCH";
    const rawResponse = await fetcher.fetch<UpdateRawResponse<T>>({
        path,
        method,
        data: rawRequestBody,
    });

    return {
        records: rawResponse.records.map((record: any) => {
            const converted = convertRecordForRead(record.fields, fieldSpecs, onUnexpectedField);
            return {
                id: record.id,
                createdTime: record.createdTime,
                fields: converted,
            };
        }),
        details: rawResponse.details,
        createdRecords: rawResponse.createdRecords,
        updatedRecords: rawResponse.updatedRecords,
    } as UpdateRecordsResponse<T>;
}

type DeleteRawResponse = DeleteRecordsResponse;
export async function deleteRecords(
    {
        recordIds,
        fetcher,
        baseId,
        tableId,
    }: {
        recordIds: ReadonlyArray<RecordId>;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<DeleteRecordsResponse> {
    const queryParams = new URLSearchParams();
    recordIds.forEach(id => {
        queryParams.append('records[]', id);
    });

    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}${query ? `?${query}` : ''}`;

    const result = await fetcher.fetch<DeleteRawResponse>({
        path,
        method: "DELETE",
    });

    return result;
}

export async function uploadAttachment<T extends FieldId | string>(
    {
        recordId,
        attachmentFieldIdOrName,
        options,
        fetcher,
        baseId,
        tableId,
    }: {
        recordId: RecordId;
        attachmentFieldIdOrName: T;
        options: UploadAttachmentOptions;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<{
    id: RecordId;
    createdTime: Timestamp;
    fields: { FieldId: [AttachmentDetails] };
}> {
    const path = `/${baseId}/${tableId}/${recordId}/${attachmentFieldIdOrName}/uploadAttachment`;

    const result = await fetcher.fetch({
        path,
        method: "POST",
        data: {
            contentType: options.contentType,
            file: options.file,
            filename: options.filename,
        },
    });

    return result as {
        id: RecordId;
        createdTime: Timestamp;
        fields: { FieldId: [AttachmentDetails] };
    };
}

// {
// "filename": "sample.txt",
// "id": "att00000000000000",
// "size": 11,
// "type": "text/plain",
// "url": "https://v5.airtableusercontent.com/v3/u/29/29/1716940800000/ffhiecnieIwxisnIBDSAln/foDeknw_G5CdkdPW1j-U0yUCX9YSaE1EJft3wvXb85pnTY1sKZdYeFvKpsM-fqOa6Bnu5MQVPA_ApINEUXL_E3SAZn6z01VN9Pn9SluhSy4NoakZGapcvl4tuN3jktO2Dt7Ck_gh4oMdsrcV8J-t_A/53m17XmDDHsNtIqzM1PQVnRKutK6damFgNNS5WCaTbI"
// }
type AttachmentDetails = {
    filename: string;
    id: AttachmentId;
    size: number;
    type: string;
    url: string;
}