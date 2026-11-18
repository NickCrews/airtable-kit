import { describe, expect, it } from "vitest";
import { type Fetcher, createAirtable } from "airtable-kit";
import {
    AirtableKitApiError,
    AirtableKitError,
    ReadValueConversionError,
    WriteValueConversionError,
} from "airtable-kit/exceptions";

/** A fetch that answers every request with `response`. */
function respondWith(response: () => Response): Fetcher {
    return async () => response();
}

async function apiError(promise: Promise<unknown>): Promise<AirtableKitApiError> {
    const error = await promise.then(
        () => {
            throw new Error("expected the request to fail");
        },
        (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(AirtableKitApiError);
    expect(error).toBeInstanceOf(AirtableKitError);
    return error as AirtableKitApiError;
}

describe("AirtableKitApiError from a failed request", () => {
    it("reads type and message from { error: { type, message } }", async () => {
        const body = {
            error: {
                type: "INVALID_FILTER_BY_FORMULA",
                message: "The formula for filtering records is invalid: Unknown field names: x",
            },
        };
        const fetch = respondWith(() => Response.json(body, { status: 422, statusText: "Unprocessable Entity" }));
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await apiError(airtable.records.list({ baseId: "app1", tableId: "tbl1" }));
        expect(error).toMatchObject({
            status: 422,
            type: "INVALID_FILTER_BY_FORMULA",
            airtableMessage: "The formula for filtering records is invalid: Unknown field names: x",
            rawResponse: body,
            method: "GET",
        });
        expect(error.path).toMatch(/^\/app1\/tbl1/);
        expect(error.message).toBe(
            `GET ${error.path} failed: 422 Unprocessable Entity - INVALID_FILTER_BY_FORMULA: The formula for filtering records is invalid: Unknown field names: x`,
        );
        expect(error.name).toBe("AirtableKitApiError");
    });

    it("reads type from { error: TYPE }", async () => {
        const fetch = respondWith(() => Response.json({ error: "NOT_FOUND" }, { status: 404, statusText: "Not Found" }));
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await apiError(airtable.records.get({ baseId: "app1", tableId: "tbl1", recordId: "recMissing" }));
        expect(error).toMatchObject({ status: 404, type: "NOT_FOUND", airtableMessage: undefined, method: "GET" });
        expect(error.message).toBe(`GET ${error.path} failed: 404 Not Found - NOT_FOUND`);
    });

    it("reads type and message from { errors: [{ error, message }] }", async () => {
        const body = { errors: [{ error: "RATE_LIMIT_REACHED", message: "Rate limit exceeded." }] };
        const fetch = respondWith(() => Response.json(body, { status: 429, statusText: "Too Many Requests" }));
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await apiError(airtable.request({ path: "/meta/bases" }));
        expect(error).toMatchObject({
            status: 429,
            type: "RATE_LIMIT_REACHED",
            airtableMessage: "Rate limit exceeded.",
            path: "/meta/bases",
        });
    });

    it("records the method of a write", async () => {
        const body = { error: { type: "INVALID_RECORDS", message: "A maximum of 10 records can be updated per request" } };
        const fetch = respondWith(() => Response.json(body, { status: 422 }));
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await apiError(airtable.request({ path: "/app1/tbl1", method: "PATCH", data: { records: [] } }));
        expect(error).toMatchObject({ method: "PATCH", path: "/app1/tbl1", type: "INVALID_RECORDS" });
    });

    it("leaves type undefined and puts the body in the message when it is not an Airtable error", async () => {
        const fetch = respondWith(() => new Response("<html>Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" }));
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await apiError(airtable.request({ path: "/x" }));
        expect(error).toMatchObject({ status: 502, type: undefined, airtableMessage: undefined, rawResponse: "<html>Bad Gateway</html>" });
        expect(error.message).toBe("GET /x failed: 502 Bad Gateway - <html>Bad Gateway</html>");
    });

    it("truncates a long non-Airtable body in the message, but keeps it whole in rawResponse", async () => {
        const longBody = "x".repeat(2000);
        const fetch = respondWith(() => new Response(longBody, { status: 500, statusText: "Internal Server Error" }));
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await apiError(airtable.request({ path: "/x" }));
        expect(error.message).toBe(`GET /x failed: 500 Internal Server Error - ${"x".repeat(500)}...`);
        expect(error.rawResponse).toBe(longBody);
    });

    it("handles an empty body", async () => {
        const fetch = respondWith(() => new Response("", { status: 503, statusText: "Service Unavailable" }));
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await apiError(airtable.request({ path: "/x" }));
        expect(error).toMatchObject({ status: 503, type: undefined, rawResponse: "" });
        expect(error.message).toBe("GET /x failed: 503 Service Unavailable");
    });

    it("does not wrap network errors", async () => {
        const fetch: Fetcher = async () => {
            throw new TypeError("fetch failed");
        };
        const airtable = createAirtable({ apiKey: "patABC", fetch });
        const error = await airtable.request({ path: "/x" }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(TypeError);
        expect(error).not.toBeInstanceOf(AirtableKitApiError);
    });
});

describe("error names", () => {
    const fieldSchema = { id: "fld1", name: "n", type: "number", options: { precision: 0 } } as const;

    it("match the class names", () => {
        expect(new ReadValueConversionError("x", fieldSchema).name).toBe("ReadValueConversionError");
        expect(new WriteValueConversionError("x", fieldSchema).name).toBe("WriteValueConversionError");
    });
});
