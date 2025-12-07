export class AirtableKitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AirtableKitError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, AirtableKitError.prototype);
    }
}

/** A generic error when calling the airtable API */
export class AirtableKitApiError extends AirtableKitError {
    public readonly message: string;
    public readonly rawResponse: unknown;
    constructor(message: string, rawResponse: unknown) {
        super(message);
        this.message = message;
        this.rawResponse = rawResponse;
        this.name = "AirtableKitApiError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, AirtableKitApiError.prototype);
    }
}