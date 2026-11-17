import { describe, expect, it } from "vitest";
import { createMockFetcher, doFetch } from "airtable-kit/fetcher";

const UNSET_ENV_VAR = "AIRTABLE_KIT_TEST_UNSET_ENV_VAR";

describe("doFetch", () => {
    it("passes the full URL, method, auth header, and JSON body to the fetch function", async () => {
        const fetch = createMockFetcher();
        fetch.setReturnValue({ ok: 1 });
        const result = await doFetch({
            fetcher: { apiKey: "patABC", fetch, baseUrl: "https://example.com/v0/" },
            path: "/app1/tbl1",
            method: "POST",
            data: { a: 1 },
        });
        expect(result).toEqual({ ok: 1 });
        expect(fetch.getCallHistory()).toEqual([
            { url: "https://example.com/v0/app1/tbl1", method: "POST", data: { a: 1 } },
        ]);
    });

    it("sends the API key as a bearer token", async () => {
        let headers: RequestInit["headers"];
        await doFetch({
            fetcher: {
                apiKey: "patABC",
                fetch: async (_url, init) => {
                    headers = init.headers;
                    return Response.json({});
                },
            },
            path: "/meta/bases",
        });
        expect(headers).toMatchObject({ Authorization: "Bearer patABC" });
    });

    it("omits the auth header when a custom fetch is given without an API key", async () => {
        let headers: RequestInit["headers"];
        await doFetch({
            fetcher: {
                apiKeyEnvVar: UNSET_ENV_VAR,
                fetch: async (_url, init) => {
                    headers = init.headers;
                    return Response.json({});
                },
            },
            path: "/meta/bases",
        });
        expect(headers).not.toHaveProperty("Authorization");
    });

    it("throws without an API key when using the global fetch", async () => {
        await expect(doFetch({ fetcher: { apiKeyEnvVar: UNSET_ENV_VAR }, path: "/meta/bases" }))
            .rejects.toThrow(UNSET_ENV_VAR);
    });

    it("lets per-request config override the fetcher's config", async () => {
        const fetch = createMockFetcher();
        await doFetch({
            fetcher: fetch,
            path: "/app1/rec1/upload",
            config: { baseUrl: "https://content.example.com/v0" },
        });
        expect(fetch.getCallHistory()[0].url).toBe("https://content.example.com/v0/app1/rec1/upload");
    });

    it("throws on a non-ok response", async () => {
        const fetch = async () => Response.json({ error: "NOT_FOUND" }, { status: 404 });
        await expect(doFetch({ fetcher: { apiKey: "patABC", fetch }, path: "/x" }))
            .rejects.toThrow("404");
    });
});
