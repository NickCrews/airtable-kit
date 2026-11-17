import type { Requester } from "../request.ts";
import { Timezone } from "../fields/timezones.ts";
import { AttachmentId } from "../fields/types.ts";
import { URLSearchParams } from "../url.ts";
import { BaseId } from "../bases/types.ts";
import { TableId } from "../tables/types.ts";
import { RecordId } from "./types.ts";

/** ISO 8601 format in UTC, eg `2024-01-01T12:00:00.000Z` */
export type Timestamp = string;

/** Field values as Airtable sends and receives them, keyed by field name or ID. */
export type RawFields = Record<string, unknown>;

/** A record as Airtable returns it. */
export interface RawRecord {
    id: RecordId;
    createdTime: Timestamp;
    fields: RawFields;
    /** Only present when `recordMetadata: ["commentCount"]` is requested */
    commentCount?: number;
}

/**
 * A reason Airtable gives when a create or update only partially succeeded:
 * the records were written, but something else, such as uploading attachments from URLs, failed.
 */
export type WriteWarning = 'attachmentsFailedUploading' | 'attachmentUploadRateIsTooHigh';

/** The `details` that Airtable includes in a create or update response that only partially succeeded. */
type PartialSuccessDetails = {
    message: 'partialSuccess';
    reasons: WriteWarning[];
};

/** Add `reasons` to `warnings`, skipping duplicates. */
function addWarnings(warnings: WriteWarning[], reasons: ReadonlyArray<WriteWarning> | undefined): void {
    for (const reason of reasons ?? []) {
        if (!warnings.includes(reason)) {
            warnings.push(reason);
        }
    }
}

interface TableRef {
    baseId: BaseId;
    tableId: TableId;
}

/**
 * Options for listing records.
 *
 * See https://airtable.com/developers/web/api/list-records
 */
export interface ListRecordsOptions {
    /** Time zone for formatting dates when using cellFormat: "string" */
    timeZone?: Timezone;
    /** User locale for formatting dates when using cellFormat: "string" */
    userLocale?: string;
    /** Maximum total number of records to return */
    maxRecords?: number;
    /** View name or ID to filter by */
    view?: string;
    /** Sort by field names or IDs */
    sort?: ReadonlyArray<{ field: string; direction?: 'asc' | 'desc' }>;
    /** Formula to filter records */
    filterByFormula?: string;
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
    /** Field names or IDs to include. Other fields are omitted from the response. */
    fields?: ReadonlyArray<string>;
    /** Key the returned fields by field ID instead of field name */
    returnFieldsByFieldId?: boolean;
    /** Include metadata like comment count */
    recordMetadata?: ReadonlyArray<'commentCount'>;
}
export interface ListRecordsParams extends TableRef, ListRecordsOptions { }

export interface ListRecordsPageParams extends ListRecordsParams {
    /** Number of records per page, at most 100 */
    pageSize?: number;
    /** The `offset` returned by the previous page */
    offset?: string;
}
export interface ListRecordsPageResponse {
    records: RawRecord[];
    /** Pass to the next call to get the next page. Absent on the last page. */
    offset?: string;
}

export interface GetRecordParams extends TableRef {
    recordId: RecordId;
    /** Cell value format: "json" (default) or "string" */
    cellFormat?: 'json' | 'string';
    /** Key the returned fields by field ID instead of field name */
    returnFieldsByFieldId?: boolean;
}

export interface CreateRecordsParams extends TableRef {
    records: ReadonlyArray<{ fields: RawFields }>;
    /** Let Airtable convert string values to the appropriate cell values */
    typecast?: boolean;
    /** Key the returned fields by field ID instead of field name */
    returnFieldsByFieldId?: boolean;
}
export interface CreateRecordsResponse {
    /** The created records, in the same order as the input. */
    records: RawRecord[];
    /** Problems Airtable reported for an otherwise successful write. Empty if there were none. */
    warnings: WriteWarning[];
}

/**
 * Options for updating records.
 *
 * See https://airtable.com/developers/web/api/update-multiple-records
 */
export interface UpdateRecordsOptions {
    /**
     * If not destructive (the default), then only the fields included in the update will be modified; all other fields will remain unchanged.
     * If destructive, then ALL fields in the target record will be updated, meaning that any fields not included in the update will be cleared.
     */
    destructive?: boolean;
    /** Enable upsert behavior */
    performUpsert?: {
        /** Field names or IDs to use as an external ID for matching (1-3 fields) */
        fieldsToMergeOn: ReadonlyArray<string>;
    };
    /** Let Airtable convert string values to the appropriate cell values */
    typecast?: boolean;
}
export interface UpdateRecordsParams extends TableRef, UpdateRecordsOptions {
    /** Records to update. With `performUpsert`, records without an `id` are matched on `fieldsToMergeOn`. */
    records: ReadonlyArray<{ id?: string; fields: RawFields }>;
    /** Key the returned fields by field ID instead of field name */
    returnFieldsByFieldId?: boolean;
}
export interface UpdateRecordsResponse {
    /** The written records, in the same order as the input. */
    records: Array<RawRecord & {
        /**
         * Whether the record was created or updated.
         * Records are only created when upserting with `performUpsert` and no existing record matched.
         */
        operation: "created" | "updated";
    }>;
    /** Problems Airtable reported for an otherwise successful write. Empty if there were none. */
    warnings: WriteWarning[];
}

export interface DeleteRecordsParams extends TableRef {
    recordIds: ReadonlyArray<RecordId>;
}
export interface DeleteRecordsResponse {
    records: Array<{
        id: RecordId;
        deleted: true;
    }>;
}

export interface UploadAttachmentParams {
    baseId: BaseId;
    recordId: RecordId;
    /** The attachment field's name or ID */
    field: string;
    /** Content type (e.g., "image/jpeg") */
    contentType: string;
    /** Base64 encoded file data */
    file: string;
    /** Filename (e.g., "photo.jpg") */
    filename: string;
}
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
    fields: Record<string, AttachmentDetails[]>;
};

/**
 * Methods for the Airtable records API, available as `airtable.records`.
 *
 * Values are sent and returned as Airtable's JSON, without conversion.
 * For typed, converted values, use a table client from `airtable-kit/typed`.
 */
export interface RecordsApi {
    /** List records. Pagination is handled automatically. */
    list(params: ListRecordsParams): Promise<RawRecord[]>;
    /** List a single page of records. */
    listPage(params: ListRecordsPageParams): Promise<ListRecordsPageResponse>;
    /** Get a single record. */
    get(params: GetRecordParams): Promise<RawRecord>;
    /** Create records, sending them in batches of up to 25, the most Airtable accepts per request. */
    create(params: CreateRecordsParams): Promise<CreateRecordsResponse>;
    /** Update or upsert records, sending them in batches of up to 10, the most Airtable accepts per request. */
    update(params: UpdateRecordsParams): Promise<UpdateRecordsResponse>;
    /** Delete records, sending them in batches of up to 10, the most Airtable accepts per request. */
    delete(params: DeleteRecordsParams): Promise<DeleteRecordsResponse>;
    /** Upload an attachment to a record's attachment field. */
    uploadAttachment(params: UploadAttachmentParams): Promise<UploadAttachmentResponse>;
}

const CREATE_BATCH_SIZE = 25;
const UPDATE_BATCH_SIZE = 10;
const DELETE_BATCH_SIZE = 10;
const CONTENT_BASE_URL = "https://content.airtable.com/v0";

function chunk<T>(items: ReadonlyArray<T>, size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        result.push(items.slice(i, i + size));
    }
    return result;
}

export function makeRecordsApi(request: Requester): RecordsApi {
    // https://airtable.com/developers/web/api/list-records
    async function listPage({ baseId, tableId, ...options }: ListRecordsPageParams): Promise<ListRecordsPageResponse> {
        const queryParams = new URLSearchParams();
        if (options.returnFieldsByFieldId) queryParams.append('returnFieldsByFieldId', 'true');
        if (options.timeZone) queryParams.append('timeZone', options.timeZone);
        if (options.userLocale) queryParams.append('userLocale', options.userLocale);
        if (options.pageSize) queryParams.append('pageSize', String(options.pageSize));
        if (options.maxRecords) queryParams.append('maxRecords', String(options.maxRecords));
        if (options.offset) queryParams.append('offset', options.offset);
        if (options.view) queryParams.append('view', options.view);
        if (options.filterByFormula) queryParams.append('filterByFormula', options.filterByFormula);
        if (options.cellFormat) queryParams.append('cellFormat', options.cellFormat);
        options.sort?.forEach((s, i) => {
            queryParams.append(`sort[${i}][field]`, s.field);
            if (s.direction) queryParams.append(`sort[${i}][direction]`, s.direction);
        });
        options.fields?.forEach((field) => queryParams.append('fields[]', field));
        options.recordMetadata?.forEach((meta) => queryParams.append('recordMetadata[]', meta));
        const query = queryParams.toString();
        return request<ListRecordsPageResponse>({
            path: `/${baseId}/${tableId}${query ? `?${query}` : ''}`,
        });
    }

    return {
        listPage,
        async list(params) {
            const records: RawRecord[] = [];
            let offset: string | undefined = undefined;
            do {
                const page: ListRecordsPageResponse = await listPage({ ...params, offset });
                records.push(...page.records);
                offset = page.offset;
            } while (offset);
            return records;
        },
        // https://airtable.com/developers/web/api/get-record
        get({ baseId, tableId, recordId, cellFormat, returnFieldsByFieldId }) {
            const queryParams = new URLSearchParams();
            if (returnFieldsByFieldId) queryParams.append('returnFieldsByFieldId', 'true');
            if (cellFormat) queryParams.append('cellFormat', cellFormat);
            const query = queryParams.toString();
            return request<RawRecord>({
                path: `/${baseId}/${tableId}/${recordId}${query ? `?${query}` : ''}`,
            });
        },
        // https://airtable.com/developers/web/api/create-records
        async create({ baseId, tableId, records, typecast, returnFieldsByFieldId }) {
            const result: CreateRecordsResponse = { records: [], warnings: [] };
            for (const batch of chunk(records, CREATE_BATCH_SIZE)) {
                const response = await request<{ records: RawRecord[]; details?: PartialSuccessDetails }>({
                    path: `/${baseId}/${tableId}`,
                    method: "POST",
                    data: { records: batch, typecast, returnFieldsByFieldId },
                });
                result.records.push(...response.records);
                addWarnings(result.warnings, response.details?.reasons);
            }
            return result;
        },
        // https://airtable.com/developers/web/api/update-multiple-records
        async update({ baseId, tableId, records, destructive, performUpsert, typecast, returnFieldsByFieldId }) {
            type UpdateApiResponse = {
                records: RawRecord[];
                details?: PartialSuccessDetails;
                /** Only present when upserting. */
                createdRecords?: RecordId[];
            };
            const responses = await Promise.all(chunk(records, UPDATE_BATCH_SIZE).map((batch) =>
                request<UpdateApiResponse>({
                    path: `/${baseId}/${tableId}`,
                    method: destructive ? "PUT" : "PATCH",
                    data: { records: batch, performUpsert, typecast, returnFieldsByFieldId },
                })
            ));
            const result: UpdateRecordsResponse = { records: [], warnings: [] };
            for (const response of responses) {
                const createdIds = new Set(response.createdRecords ?? []);
                for (const record of response.records) {
                    result.records.push({ ...record, operation: createdIds.has(record.id) ? "created" : "updated" });
                }
                addWarnings(result.warnings, response.details?.reasons);
            }
            return result;
        },
        // https://airtable.com/developers/web/api/delete-multiple-records
        async delete({ baseId, tableId, recordIds }) {
            const responses = await Promise.all(chunk(recordIds, DELETE_BATCH_SIZE).map((batch) => {
                const queryParams = new URLSearchParams();
                batch.forEach((id) => queryParams.append('records[]', id));
                return request<DeleteRecordsResponse>({
                    path: `/${baseId}/${tableId}?${queryParams.toString()}`,
                    method: "DELETE",
                });
            }));
            return { records: responses.flatMap((response) => response.records) };
        },
        // https://airtable.com/developers/web/api/upload-attachment
        uploadAttachment({ baseId, recordId, field, contentType, file, filename }) {
            return request<UploadAttachmentResponse>({
                baseUrl: CONTENT_BASE_URL,
                path: `/${baseId}/${recordId}/${field}/uploadAttachment`,
                method: "POST",
                data: { contentType, file, filename },
            });
        },
    };
}
