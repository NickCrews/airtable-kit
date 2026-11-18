import { afterEach, describe, expect, it } from "vitest";
import { bytesToBase64, bytesToBase64Js } from "../src/base64.ts";

const samples = [0, 1, 2, 3, 4, 5, 6, 255, 100_000].map((n) => Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) % 256));
const expected = samples.map((b) => Buffer.from(b).toString("base64"));

describe("bytesToBase64", () => {
    const saved = (["Buffer", "btoa"] as const).map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)!] as const);
    afterEach(() => {
        saved.forEach(([name, descriptor]) => Object.defineProperty(globalThis, name, descriptor));
        delete (Uint8Array.prototype as { toBase64?: unknown }).toBase64;
    });
    const remove = (name: string) => delete (globalThis as Record<string, unknown>)[name];

    it("uses Buffer", () => {
        expect(samples.map(bytesToBase64)).toEqual(expected);
    });

    it("uses btoa without Buffer", () => {
        remove("Buffer");
        expect(samples.map(bytesToBase64)).toEqual(expected);
    });

    it("uses plain JavaScript without Buffer or btoa", () => {
        remove("Buffer");
        remove("btoa");
        expect(samples.map(bytesToBase64)).toEqual(expected);
        expect(samples.map(bytesToBase64Js)).toEqual(expected);
    });

    it("prefers Uint8Array.prototype.toBase64", () => {
        Object.defineProperty(Uint8Array.prototype, "toBase64", { value: () => "native", configurable: true });
        expect(bytesToBase64(samples[1])).toBe("native");
    });

    it("encodes a view of part of a buffer", () => {
        const view = new Uint8Array(samples[7].buffer, 10, 20);
        expect(bytesToBase64(view)).toBe(Buffer.from(view).toString("base64"));
    });
});
