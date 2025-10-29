import { beforeEach, describe, expect, it } from "vitest";
import { createMockFetcher } from "./fetcher.js";
import { baseClient } from "./index.js";

import { SAMPLE_SCHEMA } from "../codegen/sample_raw_schema.js";

describe("BaseClient", () => {
    const mockFetcher = createMockFetcher();
    const client = baseClient({
        baseId: "app123",
        tables: SAMPLE_SCHEMA.tables,
        fetcher: mockFetcher,
    });
    beforeEach(() => {
        mockFetcher.reset();
    });
    it("can insert records", async () => {
        await client.tables.Events.insert(
            [{
                "Event Type": "Fundraiser",
                "fld0J1Cnyzq0Ky3pL": "123 Main St",
                "Guest Start Time": "1990-01-01",
            }],
        );
        expect(mockFetcher.getCallHistory()).toEqual([{
            path: "/app123/tblXxZtsavNuPBVKl",
            method: "POST",
            data: {
                records: [
                    {
                        fields: {
                            fldxjj28UXFcfytVZ: "selP5uBC3P2jRAoi3",
                            fld0J1Cnyzq0Ky3pL: "123 Main St",
                            fldMB7iO24wqe8cKt: "1990-01-01",
                        },
                    },
                ],
            },
        }]);
    });
});
