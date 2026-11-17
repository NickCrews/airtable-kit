import { describe, expect, it } from "vitest";
import { type FetchArgs, type Fetcher } from "airtable-kit/fetcher";
import { createRecords, createRecordsRaw, updateRecords } from "airtable-kit/records";
import { NUMBER } from "./_example-fields.ts";

const fields = [NUMBER] as const;
const CREATED_TIME = "2024-01-01T00:00:00.000Z";

type RequestRecord = { id?: string; fields: Record<string, unknown> };

/**
 * A fetcher that echoes the request's records back, giving new IDs to records without one,
 * and adds `extra(batchIndex, records)` to the response body.
 */
function echoFetcher(extra: (batchIndex: number, records: Array<{ id: string; isNew: boolean }>) => object = () => ({})) {
    const calls: FetchArgs[] = [];
    const fetcher: Fetcher = {
        fetch: async <T,>(args: FetchArgs) => {
            const batchIndex = calls.length;
            calls.push(args);
            const body = args.data as { records: RequestRecord[] };
            const records = body.records.map((r, j) => ({
                id: r.id ?? `recNew${batchIndex}x${j}`,
                isNew: !r.id,
                createdTime: CREATED_TIME,
                fields: r.fields,
            }));
            return {
                records: records.map(({ isNew, ...r }) => r),
                ...extra(batchIndex, records),
            } as T;
        },
    };
    return { fetcher, calls };
}

describe("updateRecords results", () => {
    it("marks each record as created or updated across batches, and merges warnings", async () => {
        const { fetcher, calls } = echoFetcher((batchIndex, records) => ({
            createdRecords: records.filter((r) => r.isNew).map((r) => r.id),
            updatedRecords: records.filter((r) => !r.isNew).map((r) => r.id),
            ...(batchIndex > 0
                ? { details: { message: "partialSuccess", reasons: ["attachmentsFailedUploading"] } }
                : {}),
        }));
        // 25 records -> 3 batches. Even indexes have IDs (updates), odd ones do not (creates).
        const records = Array.from({ length: 25 }, (_, i) => ({
            ...(i % 2 === 0 ? { id: `rec${i}` } : {}),
            fields: { [NUMBER.name]: i },
        }));
        const result = await updateRecords({
            records,
            fields,
            baseId: "app1",
            tableId: "tbl1",
            fetcher,
            options: { performUpsert: { fieldsToMergeOn: [NUMBER.name] } },
        });
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
        const { fetcher } = echoFetcher();
        const records = Array.from({ length: 15 }, (_, i) => ({ id: `rec${i}`, fields: { [NUMBER.name]: i } }));
        const result = await updateRecords({ records, fields, baseId: "app1", tableId: "tbl1", fetcher });
        expect(result.records.map((r) => r.id)).toEqual(records.map((r) => r.id));
        expect(result.records.every((r) => r.operation === "updated")).toBe(true);
        expect(result.warnings).toEqual([]);
    });

    it("returns empty records and warnings for empty input without fetching", async () => {
        const { fetcher, calls } = echoFetcher();
        const result = await updateRecords({ records: [], fields, baseId: "app1", tableId: "tbl1", fetcher });
        expect(result).toEqual({ records: [], warnings: [] });
        expect(calls).toHaveLength(0);
    });
});

describe("createRecords results", () => {
    it("returns records in input order across batches, and merges warnings", async () => {
        const { fetcher, calls } = echoFetcher((batchIndex) => ({
            details: {
                message: "partialSuccess",
                reasons: batchIndex === 0
                    ? ["attachmentsFailedUploading"]
                    : ["attachmentsFailedUploading", "attachmentUploadRateIsTooHigh"],
            },
        }));
        const records = Array.from({ length: 30 }, (_, i) => ({ [NUMBER.name]: i }));
        const result = await createRecords({ records, fields, baseId: "app1", tableId: "tbl1", fetcher });
        expect(calls).toHaveLength(2);
        expect(result.records.map((r) => r.fields[NUMBER.name])).toEqual(records.map((r) => r[NUMBER.name]));
        expect(result.records.every((r) => r.createdTime === CREATED_TIME)).toBe(true);
        expect(result.warnings).toEqual(["attachmentsFailedUploading", "attachmentUploadRateIsTooHigh"]);
    });

    it("createRecordsRaw returns an empty warnings list when Airtable reports none", async () => {
        const { fetcher } = echoFetcher();
        const result = await createRecordsRaw({
            records: [{ [NUMBER.name]: 1 }],
            fields,
            baseId: "app1",
            tableId: "tbl1",
            fetcher,
        });
        expect(result.records).toHaveLength(1);
        expect(result.warnings).toEqual([]);
    });

    it("returns empty records and warnings for empty input without fetching", async () => {
        const { fetcher, calls } = echoFetcher();
        const result = await createRecords({ records: [], fields, baseId: "app1", tableId: "tbl1", fetcher });
        expect(result).toEqual({ records: [], warnings: [] });
        expect(calls).toHaveLength(0);
    });
});
