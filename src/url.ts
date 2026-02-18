/**
 * A minimal URLSearchParams implementation for environments that don't support it,
 * such as Google Apps Script. Provides URL query string encoding functionality.
 */
export class URLSearchParams {
    private params: Array<[string, string]> = [];

    append(key: string, value: string): void {
        this.params.push([key, value]);
    }

    toString(): string {
        if (this.params.length === 0) return '';
        return this.params
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
}
