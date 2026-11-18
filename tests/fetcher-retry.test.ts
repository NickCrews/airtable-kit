import { describe, expect, it, vi } from "vitest";
import { withRetry, withThrottle, baseIdKey, defaultShouldRetry } from "../src/fetcher.ts";
import type { Fetcher } from "../src/request.ts";

const URL_ = "https://api.airtable.com/v0/appABC/tblXYZ";
const GET: RequestInit = { method: "GET" };
const POST: RequestInit = { method: "POST" };

function seq(...outcomes: Array<Response | Error>): Fetcher & { calls: number } {
    let i = 0;
    const f: Fetcher & { calls: number } = Object.assign(async () => {
        f.calls++;
        const o = outcomes[Math.min(i++, outcomes.length - 1)];
        if (o instanceof Error) throw o;
        return o.clone();
    }, { calls: 0 });
    return f;
}

const noSleep = { sleep: async () => {} };

describe("withRetry", () => {
    it("retries a 429 and returns the next response", async () => {
        const inner = seq(new Response("", { status: 429 }), new Response("ok", { status: 200 }));
        const res = await withRetry(inner, noSleep)(URL_, GET);
        expect(res.status).toBe(200);
        expect(inner.calls).toBe(2);
    });

    it("waits for Retry-After, then rateLimitDelayMs for 429 without it", async () => {
        const delays: number[] = [];
        const sleep = async (ms: number) => { delays.push(ms); };
        const inner = seq(
            new Response("", { status: 429, headers: { "Retry-After": "2" } }),
            new Response("", { status: 429 }),
            new Response("ok", { status: 200 }),
        );
        await withRetry(inner, { sleep, rateLimitDelayMs: 30_000 })(URL_, GET);
        expect(delays).toEqual([2000, 30_000]);
    });

    it("retries 5xx for GET but not POST", async () => {
        const get = seq(new Response("", { status: 503 }), new Response("ok"));
        expect((await withRetry(get, noSleep)(URL_, GET)).status).toBe(200);
        expect(get.calls).toBe(2);

        const post = seq(new Response("", { status: 503 }), new Response("ok"));
        expect((await withRetry(post, noSleep)(URL_, POST)).status).toBe(503);
        expect(post.calls).toBe(1);
    });

    it("retries network errors for GET, and rethrows for POST", async () => {
        const get = seq(new TypeError("fetch failed"), new Response("ok"));
        expect((await withRetry(get, noSleep)(URL_, GET)).status).toBe(200);

        const post = seq(new TypeError("fetch failed"));
        await expect(withRetry(post, noSleep)(URL_, POST)).rejects.toThrow("fetch failed");
        expect(post.calls).toBe(1);
    });

    it("does not retry 4xx other than 429", async () => {
        const inner = seq(new Response("", { status: 422 }));
        expect((await withRetry(inner, noSleep)(URL_, POST)).status).toBe(422);
        expect(inner.calls).toBe(1);
    });

    it("gives up after maxRetries and returns the last response", async () => {
        const inner = seq(new Response("", { status: 429 }));
        const res = await withRetry(inner, { ...noSleep, maxRetries: 2 })(URL_, GET);
        expect(res.status).toBe(429);
        expect(inner.calls).toBe(3);
    });

    it("uses a custom shouldRetry and calls onRetry", async () => {
        const onRetry = vi.fn();
        const inner = seq(new Response("", { status: 400 }), new Response("ok"));
        const res = await withRetry(inner, { ...noSleep, shouldRetry: (o) => o instanceof Response && o.status === 400, onRetry })(URL_, POST);
        expect(res.status).toBe(200);
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it("defaultShouldRetry matches the documented policy", () => {
        expect(defaultShouldRetry(new Response("", { status: 429 }), 0, "POST")).toBe(true);
        expect(defaultShouldRetry(new Response("", { status: 500 }), 0, "POST")).toBe(false);
        expect(defaultShouldRetry(new Response("", { status: 500 }), 0, "DELETE")).toBe(true);
        expect(defaultShouldRetry(new Response("", { status: 404 }), 0, "GET")).toBe(false);
    });
});

describe("withThrottle", () => {
    it("spaces requests for the same base", async () => {
        const delays: number[] = [];
        const sleep = async (ms: number) => { delays.push(ms); };
        const inner = seq(new Response("ok"));
        const f = withThrottle(inner, { requestsPerSecond: 5, sleep });
        await Promise.all([f(URL_, GET), f(URL_, GET), f(URL_, GET)]);
        expect(inner.calls).toBe(3);
        expect(delays.length).toBe(2);
        expect(delays[1]).toBeGreaterThan(delays[0]);
    });

    it("keys requests by base ID by default", () => {
        expect(baseIdKey("https://api.airtable.com/v0/appABC/tblXYZ")).toBe("appABC");
        expect(baseIdKey("https://api.airtable.com/v0/meta/bases")).toBe("");
    });
});

describe("abort signal", () => {
    it("withRetry stops waiting and makes no more attempts when the signal aborts", async () => {
        const controller = new AbortController();
        const reason = new Error("stop");
        const inner = seq(new Response("", { status: 429 }), new Response("ok"));
        const f = withRetry(inner, { rateLimitDelayMs: 60_000 });
        setTimeout(() => controller.abort(reason), 10);
        await expect(f(URL_, { ...GET, signal: controller.signal })).rejects.toBe(reason);
        expect(inner.calls).toBe(1);
    });

    it("withRetry makes no more attempts when a custom sleep ignores the signal", async () => {
        const controller = new AbortController();
        const reason = new Error("stop");
        const inner = seq(new Response("", { status: 429 }), new Response("ok"));
        const sleep = async () => { controller.abort(reason); };
        await expect(withRetry(inner, { sleep })(URL_, { ...GET, signal: controller.signal })).rejects.toBe(reason);
        expect(inner.calls).toBe(1);
    });

    it("withRetry does not retry an error thrown after the signal aborts", async () => {
        const controller = new AbortController();
        controller.abort();
        const inner = seq(new TypeError("aborted"), new Response("ok"));
        await expect(withRetry(inner, noSleep)(URL_, { ...GET, signal: controller.signal })).rejects.toThrow("aborted");
        expect(inner.calls).toBe(1);
    });

    it("withThrottle does not send a request whose signal aborts while it waits for a slot", async () => {
        const controller = new AbortController();
        const reason = new Error("stop");
        const inner = seq(new Response("ok"));
        const f = withThrottle(inner, { requestsPerSecond: 0.01 });
        await f(URL_, GET);
        const waiting = f(URL_, { ...GET, signal: controller.signal });
        setTimeout(() => controller.abort(reason), 10);
        await expect(waiting).rejects.toBe(reason);
        expect(inner.calls).toBe(1);
    });

    it("withThrottle releases the slot of a request whose signal aborts while it waits", async () => {
        const controller = new AbortController();
        const delays: number[] = [];
        const sleep = async (ms: number) => {
            delays.push(ms);
            controller.abort();
        };
        const inner = seq(new Response("ok"), new Response("ok"));
        const now = 1_000_000;
        const spy = vi.spyOn(Date, "now").mockImplementation(() => now);
        try {
            const f = withThrottle(inner, { requestsPerSecond: 1, sleep });
            await f(URL_, GET);
            await expect(f(URL_, { ...GET, signal: controller.signal })).rejects.toThrow();
            // Without the release, this request would wait 2000 ms, behind the aborted one.
            await f(URL_, GET);
            expect(delays).toEqual([1000, 1000]);
            expect(inner.calls).toBe(2);
        } finally {
            spy.mockRestore();
        }
    });
});
