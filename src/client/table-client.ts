import { type RecordId, type BaseId, type TableId, type TableSchema, type FieldSchema, FieldId, AttachmentId } from "../types.ts";
import { Fetcher, IntoFetcher } from "./fetcher.ts";
import {
    inferRead,
    type ReadRecordByName,
    type ReadRecordById,
    recordToAirtableRecord,
    type WriteRecord,
    WriteRecordById,
} from "./converters.ts";
import { makeFetcher } from "./fetcher.ts";
import { Timezone } from "../fields/timezones.ts";

type FieldNameOrId<T extends ReadonlyArray<FieldSchema>> = T[number]['name'] | T[number]['id'];

/**
 * Options for listing records
 */
export interface ListRecordsOptions<T extends ReadonlyArray<FieldSchema>> {
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
    /** Formula to filter records */
    filterByFormula?: string;
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
export interface ListRecordsResponse<T extends ReadonlyArray<FieldSchema>> {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: ReadRecordByName<T>;
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

export interface GetRecordResponse<T extends ReadonlyArray<FieldSchema>> {
    id: RecordId;
    createdTime: Timestamp;
    fields: ReadRecordByName<T>;
}

/**
 * Options for updating records
 */
export interface UpdateRecordsOptions {
    /** Enable upsert behavior */
    performUpsert?: {
        /** Fields to use as external ID for matching (1-3 fields) */
        fieldsToMergeOn: string[];
    };
    /** Enable typecasting for string values */
    typecast?: boolean;
    /** Use destructive update (PUT) instead of partial update (PATCH) */
    destructive?: boolean;
}

/**
 * Response from updating records
 */
export interface UpdateRecordsResponse<T extends ReadonlyArray<FieldSchema>> {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: ReadRecordByName<T>;
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

export type CreateArgs<T extends ReadonlyArray<FieldSchema>> = Array<Partial<WriteRecord<T>>>;

export type CreateResult<T extends ReadonlyArray<FieldSchema>> = {
    id: RecordId,
    fields: ReadRecordByName<T>,
    createdTime: Timestamp,
}[];

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

    /** Insert records into the table */
    create(values: CreateArgs<T["fields"]>): Promise<CreateResult<T["fields"]>>;

    /** List records from the table with optional filtering and pagination */
    list(options?: ListRecordsOptions<T["fields"]>): Promise<ListRecordsResponse<T["fields"]>>;

    /** Get a single record by ID */
    get(recordId: RecordId, options?: GetRecordOptions): Promise<GetRecordResponse<T["fields"]>>;

    /** Update records (PATCH by default, PUT if destructive=true) */
    update(
        records: Array<{ id?: string; fields: Partial<WriteRecord<T["fields"]>> }>,
        options?: UpdateRecordsOptions
    ): Promise<UpdateRecordsResponse<T["fields"]>>;

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
}

/**
 * Options for creating a {@link TableClient} using {@link makeTableClient}.
 */
export type TableClientOptions<T extends TableSchema> = {
    baseId: BaseId;
    tableSchema: T;
    fetcher?: IntoFetcher;
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
    }: TableClientOptions<T>,
): TableClient<T> {
    const fetcher = makeFetcher(intoFetcher);
    const tableId = tableSchema.id;
    const fieldSpecs = tableSchema.fields;
    return {
        baseId,
        tableSchema,
        create(records: CreateArgs<T["fields"]>) {
            return create<T["fields"]>({
                records,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
            });
        },
        list(options?: ListRecordsOptions<T["fields"]>) {
            return list<T["fields"]>({
                options,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
            });
        },
        get(recordId: RecordId, options?: GetRecordOptions) {
            return getRecord<T["fields"]>({
                recordId,
                fieldSpecs,
                options,
                baseId,
                tableId,
                fetcher,
            });
        },
        update(
            records: Array<{ id?: string; fields: Partial<WriteRecord<T["fields"]>> }>,
            options?: UpdateRecordsOptions
        ) {
            return update<T["fields"]>({
                records,
                options,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
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
    };
}

// https://airtable.com/developers/web/api/create-records
type RawReadRecord<T extends ReadonlyArray<FieldSchema>> = {
    [K in T[number]["id"]]: inferRead<Extract<T[number], { id: K }>>;
}
type CreateRawResponse<T extends ReadonlyArray<FieldSchema>> = {
    records: Array<{
        id: `rec${string}`;
        createdTime: string;
        fields: RawReadRecord<T>;
    }>;
};

export async function create<T extends ReadonlyArray<FieldSchema>>(
    {
        records,
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
    }: {
        records: Partial<WriteRecord<T>>[];
        fieldSpecs: T;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<CreateResult<T>> {
    const convertedToAirtable = records.map((record) => {
        return {
            fields: recordToAirtableRecord(
                record as Partial<WriteRecord<T>>,
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
        fields: convertFieldIdKeysToNames(record.fields, fieldSpecs),
        createdTime: record.createdTime,
    }));
    return result;
}

function convertFieldIdKeysToNames<T extends ReadonlyArray<FieldSchema>>(
    record: ReadRecordById<T>,
    fieldSpecs: T,
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

/** ISO 8601 format, eg `2024-01-01T12:00:00.000Z` */
type Timestamp = string;
type ListRawResponse<T extends ReadonlyArray<FieldSchema>> = {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: RawReadRecord<T>;
        commentCount: number;
    }>;
    offset?: RecordId;
};

export async function list<T extends ReadonlyArray<FieldSchema>>(
    {
        options,
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
    }: {
        options?: ListRecordsOptions<T>;
        fieldSpecs: T;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
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
    if (options?.filterByFormula) queryParams.append('filterByFormula', options.filterByFormula);
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
                fields: convertFieldIdKeysToNames(record.fields, fieldSpecs),
                commentCount: record.commentCount,
            };
        }),
    } as ListRecordsResponse<T>;
}

type GetRawResponse<T extends ReadonlyArray<FieldSchema>> = {
    id: RecordId;
    createdTime: Timestamp;
    fields: RawReadRecord<T>;
};

export async function getRecord<T extends ReadonlyArray<FieldSchema>>(
    {
        recordId,
        fieldSpecs,
        options,
        fetcher,
        baseId,
        tableId,
    }: {
        recordId: RecordId;
        fieldSpecs: T;
        options?: GetRecordOptions;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<{
    id: RecordId;
    createdTime: Timestamp;
    fields: ReadRecordByName<T>;
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
        fields: convertFieldIdKeysToNames(result.fields, fieldSpecs),
    }
}

// https://airtable.com/developers/web/api/update-multiple-records
type UpdateRawRequestBody<T extends ReadonlyArray<FieldSchema>> = {
    records: Array<{
        id?: string;
        fields: Partial<WriteRecordById<T>>;
    }>;
    performUpsert?: {
        fieldsToMergeOn: string[];
    };
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
};
type UpdateRawResponse<T extends ReadonlyArray<FieldSchema>> = {
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
export async function update<T extends ReadonlyArray<FieldSchema>>(
    {
        records,
        options,
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
    }: {
        records: Array<{ id?: string; fields: Partial<WriteRecord<T>> }>;
        options?: UpdateRecordsOptions;
        fieldSpecs: T;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<UpdateRecordsResponse<T>> {
    const rawRequestBody: UpdateRawRequestBody<T> = {
        records: records.map((record) => {
            const converted: UpdateRawRequestBody<T>['records'][number] = {
                fields: recordToAirtableRecord(
                    record.fields as Partial<WriteRecord<T>>,
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
            return {
                id: record.id,
                createdTime: record.createdTime,
                fields: convertFieldIdKeysToNames(record.fields, fieldSpecs),
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