import { BaseId } from "../schema/bases.js";
import { FieldSchema } from "../schema/fields.js";
import { TableId } from "../schema/tables.js";
import { Fetcher, IntoFetcher } from "./fetcher.js";
import {
    type ReadRecord,
    recordToAirtableRecord,
    type WriteRecord,
} from "./converters.js";
import { makeFetcher } from "./fetcher.js";

type InsertRecords<T extends ReadonlyArray<FieldSchema>> = Partial<
    WriteRecord<T>
>[];

/**
 * Options for listing records
 */
export interface ListRecordsOptions {
    /** Time zone for formatting dates when using cellFormat: "string" */
    timeZone?: string;
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
    sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    /** Formula to filter records */
    filterByFormula?: string;
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
    /** Fields to include (names or IDs) */
    fields?: string[];
    /** Return fields keyed by field ID instead of name */
    returnFieldsByFieldId?: boolean;
    /** Include metadata like comment count */
    recordMetadata?: Array<'commentCount'>;
}

/**
 * Response from listing records
 */
export interface ListRecordsResponse<T> {
    records: Array<{
        id: string;
        createdTime: string;
        fields: T;
        commentCount?: number;
    }>;
    offset?: string;
}

/**
 * Options for getting a single record
 */
export interface GetRecordOptions {
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
    /** Return fields keyed by field ID instead of name */
    returnFieldsByFieldId?: boolean;
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
    /** Return fields keyed by field ID instead of name */
    returnFieldsByFieldId?: boolean;
    /** Enable typecasting for string values */
    typecast?: boolean;
    /** Use destructive update (PUT) instead of partial update (PATCH) */
    destructive?: boolean;
}

/**
 * Response from updating records
 */
export interface UpdateRecordsResponse<T> {
    records: Array<{
        id: string;
        createdTime: string;
        fields: T;
    }>;
    details?: {
        message: 'partialSuccess';
        reasons: Array<'attachmentsFailedUploading' | 'attachmentUploadRateIsTooHigh'>;
    };
    createdRecords?: string[];
    updatedRecords?: string[];
}

/**
 * Response from deleting records
 */
export interface DeleteRecordsResponse {
    records: Array<{
        id: string;
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

/**
 * A client to interact with a specific table within an Airtable base.
 */
export interface TableClient<T extends ReadonlyArray<FieldSchema>> {
    baseId: BaseId;
    tableId: TableId;

    /** Insert records into the table */
    insert(values: InsertRecords<T>): Promise<ReadRecord<T>>;

    /** List records from the table with optional filtering and pagination */
    list(options?: ListRecordsOptions): Promise<ListRecordsResponse<ReadRecord<T>>>;

    /** Get a single record by ID */
    get(recordId: string, options?: GetRecordOptions): Promise<{
        id: string;
        createdTime: string;
        fields: ReadRecord<T>;
    }>;

    /** Update records (PATCH by default, PUT if destructive=true) */
    update(
        records: Array<{ id?: string; fields: Partial<WriteRecord<T>> }>,
        options?: UpdateRecordsOptions
    ): Promise<UpdateRecordsResponse<ReadRecord<T>>>;

    /** Delete records by IDs */
    delete(recordIds: string[]): Promise<DeleteRecordsResponse>;

    /** Upload an attachment to a record */
    uploadAttachment(
        recordId: string,
        attachmentFieldIdOrName: string,
        options: UploadAttachmentOptions
    ): Promise<{
        id: string;
        createdTime: string;
        fields: Record<string, unknown>;
    }>;
}

/**
 * Options for creating a {@link TableClient}.
 */
export type TableClientOptions<T extends ReadonlyArray<FieldSchema>> = {
    baseId: BaseId;
    tableId: TableId;
    fieldSpecs: T;
    fetcher?: IntoFetcher;
};

/**
 * Create a {@link TableClient} for a specific table within an Airtable base.
 */
export function tableClient<T extends ReadonlyArray<FieldSchema>>(
    {
        baseId,
        tableId,
        fieldSpecs,
        fetcher: intoFetcher,
    }: TableClientOptions<T>,
): TableClient<T> {
    const fetcher = fetcher(intoFetcher);
    return {
        baseId,
        tableId,
        insert(records: InsertRecords<T>) {
            return insert<T>({
                records,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
            });
        },
        list(options?: ListRecordsOptions) {
            return list<T>({
                options,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
            });
        },
        get(recordId: string, options?: GetRecordOptions) {
            return getRecord<T>({
                recordId,
                options,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
            });
        },
        update(
            records: Array<{ id?: string; fields: Partial<WriteRecord<T>> }>,
            options?: UpdateRecordsOptions
        ) {
            return update<T>({
                records,
                options,
                fieldSpecs,
                baseId,
                tableId,
                fetcher,
            });
        },
        delete(recordIds: string[]) {
            return deleteRecords({
                recordIds,
                baseId,
                tableId,
                fetcher,
            });
        },
        uploadAttachment(
            recordId: string,
            attachmentFieldIdOrName: string,
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

export async function insert<T extends ReadonlyArray<FieldSchema>>(
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
): Promise<ReadRecord<T>> {
    const convertedToAirtable = records.map((record) => {
        return {
            fields: recordToAirtableRecord(
                record as Partial<WriteRecord<T>>,
                fieldSpecs,
            ),
        };
    });
    const result = await fetcher.fetch({
        path: `/${baseId}/${tableId}`,
        method: "POST",
        data: {
            records: convertedToAirtable,
        },
    });
    return result as T extends ReadonlyArray<FieldSchema> ? ReadRecord<T>
        : Record<string, unknown>;
}

export async function list<T extends ReadonlyArray<FieldSchema>>(
    {
        options,
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
    }: {
        options?: ListRecordsOptions;
        fieldSpecs: T;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<ListRecordsResponse<ReadRecord<T>>> {
    const queryParams = new URLSearchParams();

    if (options?.timeZone) queryParams.append('timeZone', options.timeZone);
    if (options?.userLocale) queryParams.append('userLocale', options.userLocale);
    if (options?.pageSize) queryParams.append('pageSize', String(options.pageSize));
    if (options?.maxRecords) queryParams.append('maxRecords', String(options.maxRecords));
    if (options?.offset) queryParams.append('offset', options.offset);
    if (options?.view) queryParams.append('view', options.view);
    if (options?.filterByFormula) queryParams.append('filterByFormula', options.filterByFormula);
    if (options?.cellFormat) queryParams.append('cellFormat', options.cellFormat);
    if (options?.returnFieldsByFieldId) queryParams.append('returnFieldsByFieldId', 'true');

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

    const result = await fetcher.fetch({
        path,
        method: "GET",
    });

    return result as ListRecordsResponse<ReadRecord<T>>;
}

export async function getRecord<T extends ReadonlyArray<FieldSchema>>(
    {
        recordId,
        options,
        fieldSpecs,
        fetcher,
        baseId,
        tableId,
    }: {
        recordId: string;
        options?: GetRecordOptions;
        fieldSpecs: T;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<{
    id: string;
    createdTime: string;
    fields: ReadRecord<T>;
}> {
    const queryParams = new URLSearchParams();

    if (options?.cellFormat) queryParams.append('cellFormat', options.cellFormat);
    if (options?.returnFieldsByFieldId) queryParams.append('returnFieldsByFieldId', 'true');

    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}/${recordId}${query ? `?${query}` : ''}`;

    const result = await fetcher.fetch({
        path,
        method: "GET",
    });

    return result as {
        id: string;
        createdTime: string;
        fields: ReadRecord<T>;
    };
}

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
): Promise<UpdateRecordsResponse<ReadRecord<T>>> {
    const convertedToAirtable = records.map((record) => {
        const converted: any = {
            fields: recordToAirtableRecord(
                record.fields as Partial<WriteRecord<T>>,
                fieldSpecs,
            ),
        };
        if (record.id) {
            converted.id = record.id;
        }
        return converted;
    });

    const queryParams = new URLSearchParams();
    if (options?.returnFieldsByFieldId) queryParams.append('returnFieldsByFieldId', 'true');
    if (options?.typecast) queryParams.append('typecast', 'true');

    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}${query ? `?${query}` : ''}`;

    const data: any = { records: convertedToAirtable };

    if (options?.performUpsert) {
        data.performUpsert = {
            fieldsToMergeOn: options.performUpsert.fieldsToMergeOn,
        };
    }

    const method = options?.destructive ? "PUT" : "PATCH";

    const result = await fetcher.fetch({
        path,
        method,
        data,
    });

    return result as UpdateRecordsResponse<ReadRecord<T>>;
}

export async function deleteRecords(
    {
        recordIds,
        fetcher,
        baseId,
        tableId,
    }: {
        recordIds: string[];
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

    const result = await fetcher.fetch({
        path,
        method: "DELETE",
    });

    return result as DeleteRecordsResponse;
}

export async function uploadAttachment(
    {
        recordId,
        attachmentFieldIdOrName,
        options,
        fetcher,
        baseId,
        tableId,
    }: {
        recordId: string;
        attachmentFieldIdOrName: string;
        options: UploadAttachmentOptions;
        baseId: BaseId;
        tableId: TableId;
        fetcher: Fetcher;
    },
): Promise<{
    id: string;
    createdTime: string;
    fields: Record<string, unknown>;
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
        id: string;
        createdTime: string;
        fields: Record<string, unknown>;
    };
}
