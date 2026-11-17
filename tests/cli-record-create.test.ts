import { afterEach, describe, expect, it, vi } from "vitest";
import { type Fetcher } from "airtable-kit";
import { cli } from "../src/cli/cli.ts";

const tables = [{
    id: "tbl1",
    name: "Tasks",
    primaryFieldId: "fld1",
    fields: [{ id: "fld1", name: "Name", type: "singleLineText" }],
}];

function mockAirtable() {
    const posts: unknown[] = [];
    const fetch: Fetcher = async (url, init) => {
        if (url.endsWith("/meta/bases?")) return Response.json({ bases: [{ id: "app1", name: "Demo", permissionLevel: "create" }] });
        if (url.includes("/meta/bases/app1/tables")) return Response.json({ tables });
        posts.push(JSON.parse(init.body as string));
        return Response.json({ records: [{ id: "rec1", createdTime: "2024-01-01T00:00:00.000Z", fields: { fld1: "Write report" } }] });
    };
    return { fetch, posts };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("record create", () => {
    it("creates records from the fields in --data", async () => {
        vi.spyOn(console, "log").mockImplementation(() => { });
        const { fetch, posts } = mockAirtable();
        await cli(["record", "create", "--base", "app1", "--table", "Tasks", "--data", '{"fields":{"Name":"Write report"}}'], { fetch });
        expect(posts).toEqual([{ records: [{ fields: { fld1: "Write report" } }], returnFieldsByFieldId: true }]);
    });
});
