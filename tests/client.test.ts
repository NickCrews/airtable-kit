import { afterEach, describe, expect, it, vi } from "vitest";
import { type Fetcher, createAirtable, createMockFetch } from "airtable-kit";
import { AirtableKitApiError } from "airtable-kit/exceptions";
import { createBaseClient } from "airtable-kit/typed";

function captureHeaders() {
    const calls: Array<RequestInit["headers"]> = [];
    const fetch: Fetcher = async (_url, init) => {
        calls.push(init.headers);
        return Response.json({});
    };
    return { fetch, calls };
}

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("createAirtable", () => {
    it("passes the full URL, method, and JSON body to fetch", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({ ok: 1 });
        const airtable = createAirtable({ apiKey: "patABC", fetch, baseUrl: "https://example.com/v0/" });
        const result = await airtable.request({ path: "/app1/tbl1", method: "POST", data: { a: 1 } });
        expect(result).toEqual({ ok: 1 });
        expect(fetch.getCallHistory()).toEqual([
            { url: "https://example.com/v0/app1/tbl1", method: "POST", data: { a: 1 } },
        ]);
    });

    it("sends the API key as a bearer token", async () => {
        const { fetch, calls } = captureHeaders();
        await createAirtable({ apiKey: "patABC", fetch }).request({ path: "/meta/bases" });
        expect(calls[0]).toMatchObject({ Authorization: "Bearer patABC" });
    });

    it("calls an API key function before every request", async () => {
        const { fetch, calls } = captureHeaders();
        let n = 0;
        const airtable = createAirtable({ apiKey: async () => `token${n++}`, fetch });
        await airtable.request({ path: "/meta/bases" });
        await airtable.request({ path: "/meta/bases" });
        expect(calls.map((h) => (h as Record<string, string>).Authorization)).toEqual(["Bearer token0", "Bearer token1"]);
    });

    it("reads the API key from AIRTABLE_API_KEY by default", async () => {
        vi.stubEnv("AIRTABLE_API_KEY", "patFromEnv");
        const { fetch, calls } = captureHeaders();
        await createAirtable({ fetch }).request({ path: "/meta/bases" });
        expect(calls[0]).toMatchObject({ Authorization: "Bearer patFromEnv" });
    });

    it("omits the auth header when a custom fetch is given without an API key", async () => {
        vi.stubEnv("AIRTABLE_API_KEY", "");
        const { fetch, calls } = captureHeaders();
        await createAirtable({ fetch }).request({ path: "/meta/bases" });
        expect(calls[0]).not.toHaveProperty("Authorization");
    });

    it("rejects requests without an API key when using the global fetch", async () => {
        vi.stubEnv("AIRTABLE_API_KEY", "");
        const airtable = createAirtable();
        await expect(airtable.request({ path: "/meta/bases" })).rejects.toThrow("AIRTABLE_API_KEY");
    });

    it("reads AIRTABLE_API_KEY at request time, not at creation", async () => {
        vi.stubEnv("AIRTABLE_API_KEY", "");
        const { fetch, calls } = captureHeaders();
        vi.stubGlobal("fetch", fetch);
        const airtable = createAirtable();
        vi.stubEnv("AIRTABLE_API_KEY", "patLater");
        await airtable.request({ path: "/meta/bases" });
        expect(calls[0]).toMatchObject({ Authorization: "Bearer patLater" });
    });

    it("throws AirtableKitApiError with the status on a non-ok response", async () => {
        const fetch = async () => Response.json({ error: "NOT_FOUND" }, { status: 404 });
        const error = await createAirtable({ apiKey: "patABC", fetch }).request({ path: "/x" }).catch((e) => e) as AirtableKitApiError;
        expect(error).toBeInstanceOf(AirtableKitApiError);
        expect(error.status).toBe(404);
        expect(error.rawResponse).toEqual({ error: "NOT_FOUND" });
    });

    it("keeps a non-JSON error body as text", async () => {
        const fetch = async () => new Response("Bad Gateway", { status: 502 });
        const error = await createAirtable({ apiKey: "patABC", fetch }).request({ path: "/x" }).catch((e) => e) as AirtableKitApiError;
        expect(error.status).toBe(502);
        expect(error.rawResponse).toBe("Bad Gateway");
    });
});

describe("createAirtable with an existing client", () => {
    it("returns the client unchanged", () => {
        const airtable = createAirtable({ apiKey: "patABC" });
        expect(createAirtable(airtable)).toBe(airtable);
        expect(createAirtable({ apiKey: "patABC" })).not.toBe(airtable);
    });

    it("lets typed clients share one Airtable client", () => {
        const airtable = createAirtable({ apiKey: "patABC" });
        const schema = { id: "app1", name: "base", tables: [] } as const;
        expect(createBaseClient({ schema, airtable }).airtable).toBe(airtable);
    });
});

describe("createMockFetch", () => {
    it("rejects requests until a return value is set", async () => {
        const fetch = createMockFetch();
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        await expect(airtable.request({ path: "/x" })).rejects.toThrow("setReturnValue");
        fetch.setReturnValue(null);
        await expect(airtable.request({ path: "/x" })).resolves.toBeNull();
    });
});

describe("airtable.bases", () => {
    it("stops listing bases once get finds the base's name", async () => {
        const urls: string[] = [];
        const fetch: Fetcher = async (url) => {
            urls.push(url);
            if (url.includes("/tables")) return Response.json({ tables: [] });
            if (url.includes("offset=page2")) return Response.json({ bases: [{ id: "app2", name: "Two" }], offset: "page3" });
            return Response.json({ bases: [{ id: "app1", name: "One" }], offset: "page2" });
        };
        const schema = await createAirtable({ apiKey: "patABC", fetch }).bases.get("app2");
        expect(schema.name).toBe("Two");
        expect(urls.filter((u) => u.includes("/meta/bases?"))).toHaveLength(2);
    });
});

describe("airtable.records", () => {
    it("builds list query parameters", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({ records: [] });
        await createAirtable({ apiKey: "patABC", fetch }).records.listPage({
            baseId: "app1",
            tableId: "tbl1",
            fields: ["Name", "fldX"],
            sort: [{ field: "Name", direction: "desc" }],
            filterByFormula: "{Done}",
            returnFieldsByFieldId: true,
            pageSize: 10,
        });
        const url = decodeURIComponent(fetch.getCallHistory()[0].url);
        expect(url).toBe(
            "https://api.airtable.com/v0/app1/tbl1?returnFieldsByFieldId=true&pageSize=10&filterByFormula={Done}"
            + "&sort[0][field]=Name&sort[0][direction]=desc&fields[]=Name&fields[]=fldX",
        );
    });

    it("follows offsets when listing all records", async () => {
        const pages = [
            { records: [{ id: "rec1", createdTime: "t", fields: {} }], offset: "page2" },
            { records: [{ id: "rec2", createdTime: "t", fields: {} }] },
        ];
        const urls: string[] = [];
        const fetch: Fetcher = async (url) => {
            urls.push(url);
            return Response.json(pages[urls.length - 1]);
        };
        const records = await createAirtable({ apiKey: "patABC", fetch }).records.list({ baseId: "app1", tableId: "tbl1" });
        expect(records.map((r) => r.id)).toEqual(["rec1", "rec2"]);
        expect(urls[1]).toContain("offset=page2");
    });

    const upload = { baseId: "app1", recordId: "rec1", contentType: "text/plain", file: "aGk=", filename: "hi.txt" } as const;

    it("uploads attachments to the content API", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({});
        await createAirtable({ apiKey: "patABC", fetch }).records.uploadAttachment({ ...upload, field: "fldA" });
        expect(fetch.getCallHistory()[0].url).toBe("https://content.airtable.com/v0/app1/rec1/fldA/uploadAttachment");
    });

    it("encodes the attachment field name", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({});
        await createAirtable({ apiKey: "patABC", fetch }).records.uploadAttachment({ ...upload, field: "Photos / Docs" });
        expect(fetch.getCallHistory()[0].url).toBe("https://content.airtable.com/v0/app1/rec1/Photos%20%2F%20Docs/uploadAttachment");
    });

    it("uploads attachments to a custom baseUrl", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({});
        await createAirtable({ apiKey: "patABC", fetch, baseUrl: "https://proxy.test/v0" }).records.uploadAttachment({ ...upload, field: "fldA" });
        expect(fetch.getCallHistory()[0].url).toBe("https://proxy.test/v0/app1/rec1/fldA/uploadAttachment");
    });

    it("uploads attachments to contentBaseUrl", async () => {
        const fetch = createMockFetch();
        fetch.setReturnValue({});
        await createAirtable({ apiKey: "patABC", fetch, baseUrl: "https://proxy.test/v0", contentBaseUrl: "https://content-proxy.test/v0" })
            .records.uploadAttachment({ ...upload, field: "fldA" });
        expect(fetch.getCallHistory()[0].url).toBe("https://content-proxy.test/v0/app1/rec1/fldA/uploadAttachment");
    });

    it("sends update and delete batches one at a time", async () => {
        let inFlight = 0;
        let maxInFlight = 0;
        const fetch: Fetcher = async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((resolve) => setTimeout(resolve, 1));
            inFlight--;
            return Response.json({ records: [] });
        };
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const recordIds = Array.from({ length: 25 }, (_, i) => `rec${i}` as const);
        await airtable.records.update({ baseId: "app1", tableId: "tbl1", records: recordIds.map((id) => ({ id, fields: {} })) });
        await airtable.records.delete({ baseId: "app1", tableId: "tbl1", recordIds });
        expect(maxInFlight).toBe(1);
    });

    it("deletes in batches of 10", async () => {
        const urls: string[] = [];
        const fetch: Fetcher = async (url) => {
            urls.push(url);
            return Response.json({ records: [] });
        };
        const recordIds = Array.from({ length: 15 }, (_, i) => `rec${i}` as const);
        await createAirtable({ apiKey: "patABC", fetch }).records.delete({ baseId: "app1", tableId: "tbl1", recordIds });
        expect(urls).toHaveLength(2);
    });
});
