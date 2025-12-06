import { FieldSchema } from "./fields/types.ts";
import { ListRecordsOptions } from "./records/api.ts";
import { FieldId } from "./types.ts";

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

/**
 * Thrown when a value read from the Airtable API could not be converted to the appropriate TypeScript type.
 */
export class ReadValueConversionError extends AirtableKitError {
    public readonly fieldSchema: FieldSchema;
    public readonly value: unknown;
    public readonly originalError?: Error;
    constructor(value: unknown, fieldSchema: FieldSchema, originalError?: Error) {
        super(`Value not convertible for field ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type}): ${value}`);
        this.value = value;
        this.fieldSchema = fieldSchema;
        this.originalError = originalError;
        this.name = "ReadValueNotConvertibleError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, ReadValueConversionError.prototype);
    }
}

/**
 * Thrown when a value could not be converted to write to the Airtable API.
 */
export class WriteValueConversionError extends AirtableKitError {
    public readonly fieldSchema: FieldSchema;
    public readonly value: unknown;
    public readonly originalError?: Error;
    constructor(value: unknown, fieldSchema: FieldSchema, originalError?: Error) {
        super(`Value not convertible for writing to field ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type}): ${value}`);
        this.value = value;
        this.fieldSchema = fieldSchema;
        this.originalError = originalError;
        this.name = "WriteValueNotConvertibleError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, WriteValueConversionError.prototype);
    }
}

/** Thrown when attempting to read from a field that is not readable, eg a 'button' field */
export class FieldNotReadableError extends AirtableKitError {
    public readonly fieldSchema: FieldSchema;
    constructor(fieldSchema: FieldSchema) {
        super(`Field not readable: ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type})`);
        this.fieldSchema = fieldSchema;
        this.name = "FieldNotReadableError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, FieldNotReadableError.prototype);
    }
}

/** Thrown when attempting to write to a field that is not writable, eg a 'createdTime' field */
export class FieldNotWritableError extends AirtableKitError {
    public readonly fieldSchema: FieldSchema;
    constructor(fieldSchema: FieldSchema) {
        super(`Field not writable: ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type})`);
        this.fieldSchema = fieldSchema;
        this.name = "FieldNotWritableError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, FieldNotWritableError.prototype);
    }
}

/**
 * Thrown when a required field is missing from a record on read.
 * 
 * This usually happens when a field in the Airtable base is deleted,
 * but your code/schema still expects it to be there.
 */
export class MissingFieldReadError extends AirtableKitError {
    public readonly fieldSchema: FieldSchema;
    constructor(fieldSchema: FieldSchema) {
        super(`Missing required field on read: ${fieldSchema.name} (id: ${fieldSchema.id}, type: ${fieldSchema.type})`);
        this.fieldSchema = fieldSchema;
        this.name = "MissingFieldReadError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, MissingFieldReadError.prototype);
    }
}

/**
 * Thrown when we encounter a field in a read record that we don't expect in our schema.
 */
export class UnexpectedFieldReadError extends AirtableKitError {
    public readonly fieldId: FieldId;
    public readonly value: unknown;
    constructor(fieldId: FieldId, value: unknown) {
        super(`Unexpected field on read: ${fieldId} (value: ${value})`);
        this.fieldId = fieldId;
        this.value = value;
        this.name = "UnexpectedFieldReadError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, UnexpectedFieldReadError.prototype);
    }
}

export class RecordReadError extends AirtableKitError {
    public readonly errors: ReadonlyArray<AirtableKitError>;
    public readonly rawRecord: Record<FieldId, unknown>;
    public readonly fieldSchemas: ReadonlyArray<FieldSchema>;
    constructor({
        errors,
        rawRecord,
        fieldSchemas,
    }: {
        errors: ReadonlyArray<AirtableKitError>;
        rawRecord: Record<FieldId, unknown>;
        fieldSchemas: ReadonlyArray<FieldSchema>;
    }) {
        super(`Errors reading record: \n${errors.map(e => `- ${e.message}`).join("\n")}`);
        this.errors = errors;
        this.rawRecord = rawRecord;
        this.fieldSchemas = fieldSchemas;
        this.name = "RecordReadError";
        // Maintain the correct prototype chain
        Object.setPrototypeOf(this, RecordReadError.prototype);
    }
}