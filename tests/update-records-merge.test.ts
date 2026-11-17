import { describe, expect, it } from "vitest";
import { type FetchArgs, type Fetcher } from "airtable-kit/fetcher";
import { updateRecords } from "airtable-kit/records";
import { NUMBER } from "./_example-fields.ts";

describe("updateRecords across multiple batches", () => {
    const fields = [NUMBER] as const;

    function upsertFetcher(): Fetcher {
        let batchIndex = 0;
        return {
            fetch: async <T,>(args: FetchArgs) => {
                const body = args.data as { records: Array<{ id?: string; fields: Record<string, unknown> }> };
                const i = batchIndex++;
                const records = body.records.map((r, j) => ({
                    id: r.id ?? `recNew${i}_${j}`,
                    createdTime: "2024-01-01T00:00:00.000Z",
                    fields: r.fields,
                }));
                return {
                    records,
                    createdRecords: records.filter((_, j) => !body.records[j].id).map((r) => r.id),
                    updatedRecords: records.filter((_, j) => body.records[j].id).map((r) => r.id),
                    ...(i === 1 ? { details: { message: "partialSuccess", reasons: ["attachmentsFailedUploading"] } } : {}),
                } as T;
            },
        };
    }

    it("merges createdRecords, updatedRecords, and details from every batch", async () => {
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
            fetcher: upsertFetcher(),
            options: { performUpsert: { fieldsToMergeOn: [NUMBER.name] } },
        });
        expect(result.records).toHaveLength(25);
        expect(result.updatedRecords).toEqual(records.filter((r) => r.id).map((r) => r.id));
        expect(result.createdRecords).toHaveLength(12);
        expect(result.details).toEqual({ message: "partialSuccess", reasons: ["attachmentsFailedUploading"] });
    });

    it("leaves createdRecords, updatedRecords, and details unset when Airtable omits them", async () => {
        const fetcher: Fetcher = {
            fetch: async <T,>(args: FetchArgs) => {
                const body = args.data as { records: Array<{ id: string; fields: Record<string, unknown> }> };
                return { records: body.records.map((r) => ({ id: r.id, createdTime: "2024-01-01T00:00:00.000Z", fields: r.fields })) } as T;
            },
        };
        const records = Array.from({ length: 15 }, (_, i) => ({ id: `rec${i}`, fields: { [NUMBER.name]: i } }));
        const result = await updateRecords({ records, fields, baseId: "app1", tableId: "tbl1", fetcher });
        expect(result.records).toHaveLength(15);
        expect(result.createdRecords).toBeUndefined();
        expect(result.updatedRecords).toBeUndefined();
        expect(result.details).toBeUndefined();
    });
});
