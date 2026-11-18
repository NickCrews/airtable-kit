import { describe, expect, it } from "vitest";
import { type Fetcher, createAirtable } from "airtable-kit";
import { createTableClient } from "airtable-kit/typed";
import { type RecordId } from "airtable-kit/records";
import { NUMBER } from "./_example-fields.ts";

const fields = [NUMBER] as const;
const CREATED_TIME = "2024-01-01T00:00:00.000Z";
const tableSchema = { id: "tbl1", name: "Table", primaryFieldId: NUMBER.id, fields } as const;
const makeTable = (fetch: Fetcher) => createTableClient({ baseId: "app1", schema: tableSchema, airtable: { fetch } });

type RequestRecord = { id?: RecordId; fields: Record<string, unknown> };

/**
 * A fetch that echoes the request's records back, giving new IDs to records without one,
 * and adds `extra(batchIndex, records)` to the response body.
 */
function echoFetch(extra: (batchIndex: number, records: Array<{ id: string; isNew: boolean }>) => object = () => ({})) {
    const calls: RequestInit[] = [];
    const fetch: Fetcher = async (_url, init) => {
        const batchIndex = calls.length;
        calls.push(init);
        const body = JSON.parse(init.body as string) as { records: RequestRecord[] };
        const records = body.records.map((r, j) => ({
            id: r.id ?? `recNew${batchIndex}x${j}`,
            isNew: !r.id,
            createdTime: CREATED_TIME,
            fields: r.fields,
        }));
        return Response.json({
            records: records.map(({ isNew, ...r }) => r),
            ...extra(batchIndex, records),
        });
    };
    return { fetch, calls };
}

describe("updateRecords results", () => {
    it("marks each record as created or updated across batches, and merges warnings", async () => {
        const { fetch, calls } = echoFetch((batchIndex, records) => ({
            createdRecords: records.filter((r) => r.isNew).map((r) => r.id),
            updatedRecords: records.filter((r) => !r.isNew).map((r) => r.id),
            ...(batchIndex > 0
                ? { details: { message: "partialSuccess", reasons: ["attachmentsFailedUploading"] } }
                : {}),
        }));
        // 25 records -> 3 batches. Even indexes have IDs (updates), odd ones do not (creates).
        const records = Array.from({ length: 25 }, (_, i) => ({
            ...(i % 2 === 0 ? { id: `rec${i}` as RecordId } : {}),
            fields: { [NUMBER.name]: i },
        }));
        const result = await makeTable(fetch).updateRecords(
            { records, performUpsert: { fieldsToMergeOn: [NUMBER.name] } }
        );
        expect(calls).toHaveLength(3);
        expect(result.records).toHaveLength(25);
        expect(result.records.map((r) => r.operation)).toEqual(
            records.map((r) => (r.id ? "updated" : "created")),
        );
        expect(result.records.filter((r) => r.operation === "updated").map((r) => r.id)).toEqual(
            records.filter((r) => r.id).map((r) => r.id),
        );
        expect(result.warnings).toEqual(["attachmentsFailedUploading"]);
    });

    it("marks every record as updated when not upserting", async () => {
        const { fetch } = echoFetch();
        const records = Array.from({ length: 15 }, (_, i) => ({ id: `rec${i}` as RecordId, fields: { [NUMBER.name]: i } }));
        const result = await makeTable(fetch).updateRecords({ records });
        expect(result.records.map((r) => r.id)).toEqual(records.map((r) => r.id));
        expect(result.records.every((r) => r.operation === "updated")).toBe(true);
        expect(result.warnings).toEqual([]);
    });

    it("returns empty records and warnings for empty input without fetching", async () => {
        const { fetch, calls } = echoFetch();
        const result = await makeTable(fetch).updateRecords({ records: [] });
        expect(result).toEqual({ records: [], warnings: [] });
        expect(calls).toHaveLength(0);
    });
});

describe("createRecords results", () => {
    it("returns records in input order across batches, and merges warnings", async () => {
        const { fetch, calls } = echoFetch((batchIndex) => ({
            details: {
                message: "partialSuccess",
                reasons: batchIndex === 0
                    ? ["attachmentsFailedUploading"]
                    : ["attachmentsFailedUploading", "attachmentUploadRateIsTooHigh"],
            },
        }));
        const records = Array.from({ length: 30 }, (_, i) => ({ [NUMBER.name]: i }));
        const result = await makeTable(fetch).createRecords({ records });
        expect(calls).toHaveLength(2);
        expect(result.records.map((r) => r.fields[NUMBER.name])).toEqual(records.map((r) => r[NUMBER.name]));
        expect(result.records.every((r) => r.createdTime === CREATED_TIME)).toBe(true);
        expect(result.warnings).toEqual(["attachmentsFailedUploading", "attachmentUploadRateIsTooHigh"]);
    });

    it("airtable.records.create returns an empty warnings list when Airtable reports none", async () => {
        const { fetch } = echoFetch();
        const result = await createAirtable({ fetch }).records.create({
            records: [{ fields: { [NUMBER.name]: 1 } }],
            baseId: "app1",
            tableId: "tbl1",
        });
        expect(result.records).toHaveLength(1);
        expect(result.warnings).toEqual([]);
    });

    it("returns empty records and warnings for empty input without fetching", async () => {
        const { fetch, calls } = echoFetch();
        const result = await makeTable(fetch).createRecords({ records: [] });
        expect(result).toEqual({ records: [], warnings: [] });
        expect(calls).toHaveLength(0);
    });
});

describe("TableClient.createRecord results", () => {
    it("returns the created record and Airtable's warnings", async () => {
        const { fetch } = echoFetch(() => ({
            details: { message: "partialSuccess", reasons: ["attachmentsFailedUploading"] },
        }));
        const client = makeTable(fetch);
        const result = await client.createRecord({ record: { [NUMBER.name]: 1 } });
        expect(result.record).toMatchObject({ id: "recNew0x0", createdTime: CREATED_TIME });
        expect(result.record.fields[NUMBER.name]).toBe(1);
        expect(result.warnings).toEqual(["attachmentsFailedUploading"]);
    });
});
