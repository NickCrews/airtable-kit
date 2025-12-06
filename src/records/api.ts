import { doFetch, IntoFetcher } from "../fetcher";
import { FieldRead } from "../fields/converters";
import { Timezone } from "../fields/timezones";
import { FieldSchemaRead } from "../fields/types";
import { Formula, formulaToString } from "../formula";
import { AttachmentId, BaseId, FieldId, RecordId, TableId } from "../types";
import { convertRecordForRead, convertRecordForWrite, RecordRead, RecordWrite, WriteRecordById } from "./converters";
import * as exceptions from "../exceptions";

type FieldNameOrId<T extends FieldSchemaRead> = T['name'] | T['id'];

/** ISO 8601 format in UTC, eg `2024-01-01T12:00:00.000Z` */
export type Timestamp = string;

export interface CreateRecordsParams<T extends FieldSchemaRead> {
    records: ReadonlyArray<RecordWrite<T>>;
    baseId: BaseId;
    tableId: TableId;
    fields: ReadonlyArray<T>;
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
    fetcher?: IntoFetcher;
}
export type CreateRecordsResponse<T extends FieldSchemaRead> = Array<{
    id: RecordId,
    fields: RecordRead<T>,
    createdTime: Timestamp,
}>;

// https://airtable.com/developers/web/api/create-records
type RawReadRecord<T extends FieldSchemaRead> = {
    [K in T["id"]]: FieldRead<Extract<T, { id: K }>>;
}
export async function createRecords<T extends FieldSchemaRead>(
    {
        records,
        baseId,
        tableId,
        fields,
        onUnexpectedField,
        fetcher,
    }: CreateRecordsParams<T>,
) {
    const BATCH_SIZE = 10;
    const result: Array<{
        id: RecordId,
        fields: RecordRead<T>,
        createdTime: Timestamp,
    }> = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const created = await createRecordsRaw<T>({
            records: batch,
            fields: fields,
            baseId,
            tableId,
            fetcher,
            onUnexpectedField,
        });
        result.push(...created);
    }
    return result;
}

export interface CreateRecordsRawParams<T extends FieldSchemaRead> {
    records: ReadonlyArray<RecordWrite<T>>;
    baseId: BaseId;
    tableId: TableId;
    fields: ReadonlyArray<T>;
    fetcher?: IntoFetcher;
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
}
export type CreateRecordsRawResponse<T extends FieldSchemaRead> = Array<{
    id: RecordId,
    fields: RecordRead<T>,
    createdTime: Timestamp,
}>;

export async function createRecordsRaw<T extends FieldSchemaRead>(
    {
        records,
        baseId,
        tableId,
        fields,
        fetcher,
        onUnexpectedField,
    }: CreateRecordsRawParams<T>,
): Promise<CreateRecordsRawResponse<T>> {
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
                fields,
            ),
        };
    });
    type CreateApiResponse<T extends FieldSchemaRead> = {
        records: Array<{
            id: `rec${string}`;
            createdTime: string;
            fields: RawReadRecord<T>;
        }>;
    };
    const raw = await doFetch<CreateApiResponse<T>>({
        fetcher,
        path: `/${baseId}/${tableId}`,
        method: "POST",
        data: {
            records: convertedToAirtable,
            returnFieldsByFieldId: true,
        },
    });
    const result = raw.records.map((record) => ({
        id: record.id,
        fields: convertRecordForRead(record.fields, fields, onUnexpectedField),
        createdTime: record.createdTime,
    }));
    return result;
}

/**
 * Options for listing records
 */
export interface ListRecordsOptions<T extends FieldSchemaRead> {
    /** Time zone for formatting dates when using cellFormat: "string" */
    timeZone?: Timezone;
    /** User locale for formatting dates when using cellFormat: "string" */
    userLocale?: string;
    /** Maximum total number of records to return */
    maxRecords?: number;
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
export interface ListRecordsParams<T extends FieldSchemaRead> {
    baseId: BaseId;
    tableId: TableId;
    fields: ReadonlyArray<T>;
    options?: ListRecordsOptions<T>;
    fetcher?: IntoFetcher;
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
}
export type ListRecordsResponse<T extends FieldSchemaRead> = Array<{
    id: RecordId;
    createdTime: Timestamp;
    fields: RecordRead<T>;
    commentCount?: number;
}>;

export async function listRecords<T extends FieldSchemaRead>(
    {
        options,
        fields,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: ListRecordsParams<T>,
): Promise<ListRecordsResponse<T>> {
    const allRecords: ListRecordsResponse<T> = [];
    let offset = undefined;
    do {
        const response: ListRecordsRawResponse<T> = await listRecordsRaw({
            options: {
                ...options,
                offset,
            },
            fields,
            baseId,
            tableId,
            fetcher,
            onUnexpectedField,
        });
        allRecords.push(...response.records);
        offset = response.offset;
    } while (offset);
    return allRecords;
}

export type ListRecordsRawOptions<T extends FieldSchemaRead> = ListRecordsOptions<T> & {
    pageSize?: number;
    offset?: string;
};
export interface ListRecordsRawParams<T extends FieldSchemaRead> {
    baseId: BaseId;
    tableId: TableId;
    fields: ReadonlyArray<T>;
    options?: ListRecordsRawOptions<T>;
    fetcher?: IntoFetcher;
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
}
export type ListRecordsRawResponse<T extends FieldSchemaRead> = {
    records: Array<{
        id: RecordId;
        createdTime: Timestamp;
        fields: RecordRead<T>;
        commentCount: number;
    }>;
    offset?: RecordId;
};
export async function listRecordsRaw<T extends FieldSchemaRead>(
    {
        options,
        fields,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: ListRecordsRawParams<T>,
): Promise<ListRecordsRawResponse<T>> {
    const queryParams = new URLSearchParams();
    queryParams.append('returnFieldsByFieldId', 'true');

    if (options?.timeZone) queryParams.append('timeZone', options.timeZone);
    if (options?.userLocale) queryParams.append('userLocale', options.userLocale);
    if (options?.pageSize) queryParams.append('pageSize', String(options.pageSize));
    if (options?.maxRecords) queryParams.append('maxRecords', String(options.maxRecords));
    if (options?.offset) queryParams.append('offset', options.offset);
    if (options?.view) queryParams.append('view', options.view);
    if (options?.filterByFormula) queryParams.append('filterByFormula', typeof options.filterByFormula === 'string' ? options.filterByFormula : formulaToString(fields, options.filterByFormula));
    if (options?.cellFormat) queryParams.append('cellFormat', options.cellFormat);

    const toFieldId = (field: FieldNameOrId<T>): FieldId => {
        const spec = fields.find(f => f.id === field || f.name === field);
        if (!spec) {
            throw new Error(`Field "${field}" not found in table schema.`);
        }
        return spec.id;
    }

    if (options?.sort) {
        // trying to build up something like
        // ...?sort[0][field]=fldabc&sort[0][direction]=asc
        options.sort.forEach((s, i) => {
            queryParams.append(`sort[${i}][field]`, toFieldId(s.field));
            if (s.direction) queryParams.append(`sort[${i}][direction]`, s.direction);
        });
    }

    if (options?.fields) {
        options.fields.forEach(fieldNameOrId => {
            queryParams.append('fields[]', toFieldId(fieldNameOrId));
        });
    }

    if (options?.recordMetadata) {
        options.recordMetadata.forEach(meta => {
            queryParams.append('recordMetadata[]', meta);
        });
    }
    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}${query ? `?${query}` : ''}`;

    type ListApiSuccessResponse<T extends FieldSchemaRead> = {
        records: Array<{
            id: RecordId;
            createdTime: Timestamp;
            fields: RawReadRecord<T>;
            commentCount?: number;
        }>;
        offset?: RecordId;
    };
    type ListApiErrorResponse = {
        error: {
            type: string;
            message?: string;
        };
        // eg
        // error: {
        //     type: 'INVALID_FILTER_BY_FORMULA',
        //     message: 'The formula for filtering records is invalid: Unknown field names: firstname, lastname'
        // }
    };
    type ListApiResponse<T extends FieldSchemaRead> = ListApiSuccessResponse<T> | ListApiErrorResponse;
    const raw = await doFetch<ListApiResponse<T>>({ fetcher, path, method: "GET" });
    if ('error' in raw) {
        console.log(fetcher);
        throw new exceptions.AirtableKitApiError(
            `Error listing records: ${raw.error.message ?? raw.error.type}`,
            path,
        )
    }
    return {
        records: raw.records.map((record) => {
            return {
                id: record.id,
                createdTime: record.createdTime,
                fields: convertRecordForRead(record.fields, fields, onUnexpectedField),
                commentCount: record.commentCount ?? 0,
            };
        }),
        offset: raw.offset,
    };
}

/**
 * Options for getting a single record
 */
export interface GetRecordOptions {
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
}
export interface GetRecordParams<T extends FieldSchemaRead> {
    recordId: RecordId;
    fields: ReadonlyArray<T>;
    baseId: BaseId;
    tableId: TableId;
    options?: GetRecordOptions;
    fetcher?: IntoFetcher;
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
}
export interface GetRecordResponse<T extends FieldSchemaRead> {
    id: RecordId;
    createdTime: Timestamp;
    fields: RecordRead<T>;
}
export async function getRecord<T extends FieldSchemaRead>(
    {
        recordId,
        fields,
        options,
        fetcher: intoFetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: GetRecordParams<T>,
): Promise<GetRecordResponse<T>> {
    const queryParams = new URLSearchParams();
    queryParams.append('returnFieldsByFieldId', 'true');

    if (options?.cellFormat) queryParams.append('cellFormat', options.cellFormat);

    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}/${recordId}${query ? `?${query}` : ''}`;

    type GetApiResponse<T extends FieldSchemaRead> = {
        id: RecordId;
        createdTime: Timestamp;
        fields: RawReadRecord<T>;
    };
    const result = await doFetch<GetApiResponse<T>>({
        fetcher: intoFetcher,
        path,
        method: "GET",
    });

    return {
        id: result.id,
        createdTime: result.createdTime,
        fields: convertRecordForRead(result.fields, fields, onUnexpectedField),
    }
}

/**
 * Options for updating records
 */
export interface UpdateRecordsOptions<T extends FieldSchemaRead> {
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
export interface UpdateRecordsParams<T extends FieldSchemaRead> {
    records: Array<{ id?: string; fields: RecordWrite<T> }>;
    fields: ReadonlyArray<T>;
    baseId: BaseId;
    tableId: TableId;
    options?: UpdateRecordsOptions<T>;
    fetcher?: IntoFetcher;
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
}
/**
 * Response from updating records
 */
export interface UpdateRecordsResponse<T extends FieldSchemaRead> {
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

/** Handles pagination for you, since Airtable can only handle 10 records to update at a time. */
export async function updateRecords<T extends FieldSchemaRead>(
    {
        records,
        options,
        fields,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: UpdateRecordsParams<T>,
): Promise<UpdateRecordsResponse<T>> {
    const BATCH_SIZE = 10;
    const result: UpdateRecordsResponse<T> = {
        records: [],
    };
    const promises = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        promises.push(updateRaw<T>({
            records: batch,
            options,
            fields,
            baseId,
            tableId,
            fetcher,
            onUnexpectedField,
        }));
    }
    const results = await Promise.all(promises);
    for (const res of results) {
        result.records.push(...res.records);
    }
    return result;
}

export interface UpdateRawParams<T extends FieldSchemaRead> {
    records: Array<{ id?: string; fields: RecordWrite<T> }>;
    options?: UpdateRecordsOptions<T>;
    fields: ReadonlyArray<T>;
    baseId: BaseId;
    tableId: TableId;
    fetcher?: IntoFetcher;
    onUnexpectedField?: "throw" | { warn: boolean; keep: boolean; };
}
export type UpdateRawResponse<T extends FieldSchemaRead> = UpdateRecordsResponse<T>;

export async function updateRaw<T extends FieldSchemaRead>(
    {
        records,
        options,
        fields,
        fetcher,
        baseId,
        tableId,
        onUnexpectedField,
    }: UpdateRawParams<T>,
): Promise<UpdateRawResponse<T>> {
    if (records.length === 0) {
        return { records: [] };
    }
    if (records.length > 10) {
        throw new Error("Can only update up to 10 records at a time in updateRaw. Use update for automatic batching.");
    }
    // https://airtable.com/developers/web/api/update-multiple-records
    type UpdateApiRequestBody<T extends FieldSchemaRead> = {
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
    type UpdateApiResponse<T extends FieldSchemaRead> = {
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
    const rawRequestBody: UpdateApiRequestBody<T> = {
        records: records.map((record) => {
            const withoutUndefined = Object.fromEntries(
                Object.entries(record.fields).filter(([_, v]) => v !== undefined)
            );
            const converted: UpdateApiRequestBody<T>['records'][number] = {
                fields: convertRecordForWrite(
                    withoutUndefined as Partial<RecordWrite<T>>,
                    fields,
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
    const rawResponse = await doFetch<UpdateApiResponse<T>>({
        fetcher,
        path,
        method,
        data: rawRequestBody,
    });

    return {
        records: rawResponse.records.map((record: any) => {
            const converted = convertRecordForRead(record.fields, fields, onUnexpectedField);
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

export interface DeleteRecordsParams {
    recordIds: ReadonlyArray<RecordId>;
    baseId: BaseId;
    tableId: TableId;
    fetcher?: IntoFetcher;
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
export async function deleteRecords(
    {
        recordIds,
        fetcher,
        baseId,
        tableId,
    }: DeleteRecordsParams,
): Promise<DeleteRecordsResponse> {
    const batches: RecordId[][] = [];
    for (let i = 0; i < recordIds.length; i += 10) {
        batches.push(recordIds.slice(i, i + 10));
    }
    const promises = batches.map(batch => deleteRecordsRaw({
        recordIds: batch,
        baseId,
        tableId,
        fetcher,
    }));
    const results = await Promise.all(promises);
    const allDeletedRecords: DeleteRecordsResponse['records'] = [];
    for (const res of results) {
        allDeletedRecords.push(...res.records);
    }
    return {
        records: allDeletedRecords,
    };
}

export type DeleteRecordsRawParams = DeleteRecordsParams;
export type DeleteRecordsRawResponse = DeleteRecordsResponse;
export async function deleteRecordsRaw(
    {
        recordIds,
        fetcher,
        baseId,
        tableId,
    }: DeleteRecordsRawParams,
): Promise<DeleteRecordsRawResponse> {
    if (recordIds.length === 0) {
        return { records: [] };
    }
    if (recordIds.length > 10) {
        throw new Error("Can only delete up to 10 records at a time in deleteRecordsRaw. Use deleteRecords for automatic batching.");
    }

    type DeleteApiResponse = DeleteRecordsResponse;
    const queryParams = new URLSearchParams();
    recordIds.forEach(id => {
        queryParams.append('records[]', id);
    });
    const query = queryParams.toString();
    const path = `/${baseId}/${tableId}${query ? `?${query}` : ''}`;
    return await doFetch<DeleteApiResponse>({
        fetcher,
        path,
        method: "DELETE",
    });
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
export interface UploadAttachmentParams<T extends FieldId | string> {
    recordId: RecordId;
    attachmentFieldIdOrName: T;
    options: UploadAttachmentOptions;
    baseId: BaseId;
    fetcher?: IntoFetcher;
}
// {
// "filename": "sample.txt",
// "id": "att00000000000000",
// "size": 11,
// "type": "text/plain",
// "url": "https://v5.airtableusercontent.com/v3/u/29/29/1716940800000/ffhiecnieIwxisnIBDSAln/foDeknw_G5CdkdPW1j-U0yUCX9YSaE1EJft3wvXb85pnTY1sKZdYeFvKpsM-fqOa6Bnu5MQVPA_ApINEUXL_E3SAZn6z01VN9Pn9SluhSy4NoakZGapcvl4tuN3jktO2Dt7Ck_gh4oMdsrcV8J-t_A/53m17XmDDHsNtIqzM1PQVnRKutK6damFgNNS5WCaTbI"
// }
export type AttachmentDetails = {
    filename: string;
    id: AttachmentId;
    size: number;
    type: string;
    url: string;
}
export type UploadAttachmentResponse = {
    id: RecordId;
    createdTime: Timestamp;
    fields: { FieldId: [AttachmentDetails] };
};

export async function uploadAttachment<T extends FieldId | string>(
    params: UploadAttachmentParams<T>,
): Promise<UploadAttachmentResponse> {
    const {
        recordId,
        attachmentFieldIdOrName,
        options,
        fetcher,
        baseId,
    } = params;
    type ErrorResponse = {
        error: string;
    };
    // This method uses a different baseUrl!! :(
    const baseUrl = "https://content.airtable.com/v0/";
    const result = await doFetch<UploadAttachmentResponse | ErrorResponse>({
        fetcher,
        path: `/${baseId}/${recordId}/${attachmentFieldIdOrName}/uploadAttachment`,
        method: "POST",
        baseUrl,
        data: {
            contentType: options.contentType,
            file: options.file,
            filename: options.filename,
        },
    });
    if ('error' in result) {
        throw new exceptions.AirtableKitApiError(
            `Error uploading attachment using parameters: ${JSON.stringify(params, null, 2)}: ${JSON.stringify(result, null, 2)}`,
            result,
        )
    }
    return result;
}