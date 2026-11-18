type NativeBase64 = {
    /** `Uint8Array.prototype.toBase64`, in recent runtimes */
    toBase64?: () => string;
};
type BufferLike = { from(bytes: Uint8Array): { toString(encoding: "base64"): string } };

/** Base64 encode bytes, using the fastest method the runtime has. */
export function bytesToBase64(bytes: Uint8Array): string {
    const native = (bytes as Uint8Array & NativeBase64).toBase64;
    if (typeof native === "function") {
        return native.call(bytes);
    }
    const Buffer = (globalThis as { Buffer?: BufferLike }).Buffer;
    if (typeof Buffer?.from === "function") {
        return Buffer.from(bytes).toString("base64");
    }
    if (typeof globalThis.btoa === "function") {
        let binary = "";
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
            binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        return globalThis.btoa(binary);
    }
    return bytesToBase64Js(bytes);
}

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Base64 encode bytes in plain JavaScript, for runtimes without `toBase64`, `Buffer`, or `btoa`. */
export function bytesToBase64Js(bytes: Uint8Array): string {
    const parts: string[] = [];
    for (let i = 0; i < bytes.length; i += 3) {
        const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
        parts.push(
            BASE64_ALPHABET[(n >> 18) & 63],
            BASE64_ALPHABET[(n >> 12) & 63],
            i + 1 < bytes.length ? BASE64_ALPHABET[(n >> 6) & 63] : "=",
            i + 2 < bytes.length ? BASE64_ALPHABET[n & 63] : "=",
        );
    }
    return parts.join("");
}
