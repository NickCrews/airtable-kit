/**
 * Map an Airtable field type to an OpenAPI 3 schema object.
 *
 * This is the OpenAPI peer of `value-converters/index.ts`: a single switch over
 * `field.type` that, instead of converting *values*, describes the *shape* of a
 * field's value in OpenAPI terms. {@link baseToOpenApi} uses it to build the
 * per-table component schemas.
 */

import { type FieldSchemaRead } from "../fields/types.ts";
import type { OpenApiSchema } from "./types.ts";

/** A user/collaborator object, as returned for collaborator & created/modified-by fields. */
function collaboratorSchema(): OpenApiSchema {
  return {
    type: "object",
    properties: {
      id: { type: "string", description: "Unique user or group ID" },
      email: { type: "string", format: "email", description: "User's email address" },
      name: { type: "string", description: "User's display name (may be absent)" },
    },
  };
}

function thumbnailSchema(): OpenApiSchema {
  return {
    type: "object",
    properties: {
      url: { type: "string", format: "uri" },
      width: { type: "integer" },
      height: { type: "integer" },
    },
  };
}

/** A single attachment object inside a `multipleAttachments` cell. */
function attachmentSchema(): OpenApiSchema {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      type: { type: "string", description: "MIME type, e.g. image/png" },
      filename: { type: "string" },
      size: { type: "integer", description: "File size in bytes" },
      url: { type: "string", format: "uri" },
      width: { type: "integer", description: "Image width in pixels (images only)" },
      height: { type: "integer", description: "Image height in pixels (images only)" },
      thumbnails: {
        type: "object",
        properties: {
          small: thumbnailSchema(),
          large: thumbnailSchema(),
          full: thumbnailSchema(),
        },
      },
    },
  };
}

function aiTextSchema(): OpenApiSchema {
  return {
    type: "object",
    properties: {
      state: { type: "string", enum: ["empty", "loading", "generated", "error"] },
      value: { type: "string" },
      isStale: { type: "boolean" },
      errorType: { type: "string", description: "Present only when state is 'error'" },
    },
  };
}

/**
 * Build the OpenAPI schema for a field, *without* its description.
 *
 * Every branch returns a freshly-constructed object, so callers can safely
 * annotate the result (e.g. add a `description`) without mutating shared state.
 */
function schemaForFieldType(field: FieldSchemaRead): OpenApiSchema {
  switch (field.type) {
    case "singleLineText":
    case "multilineText":
    case "richText":
    case "phoneNumber":
    case "externalSyncSource":
      return { type: "string" };
    case "email":
      return { type: "string", format: "email" };
    case "url":
      return { type: "string", format: "uri" };
    case "number":
    case "percent":
    case "currency":
      return { type: "number" };
    case "autoNumber":
    case "count":
      return { type: "integer" };
    case "duration":
      return { type: "number", minimum: 0, description: "Duration in seconds" };
    case "rating":
      return { type: "integer", minimum: 1, maximum: field.options.max };
    case "checkbox":
      return { type: "boolean" };
    case "date":
      return { type: "string", format: "date" };
    case "dateTime":
    case "createdTime":
    case "lastModifiedTime":
      return { type: "string", format: "date-time" };
    case "singleSelect":
      return { type: "string", enum: field.options.choices.map((c) => c.name) };
    case "multipleSelects":
      return {
        type: "array",
        items: { type: "string", enum: field.options.choices.map((c) => c.name) },
      };
    case "singleCollaborator":
    case "createdBy":
    case "lastModifiedBy":
      return collaboratorSchema();
    case "multipleCollaborators":
      return { type: "array", items: collaboratorSchema() };
    case "multipleRecordLinks":
      return {
        type: "array",
        items: { type: "string", description: "Linked record ID" },
      };
    case "multipleAttachments":
      return { type: "array", items: attachmentSchema() };
    case "barcode":
      return {
        type: "object",
        properties: { text: { type: "string" }, type: { type: "string" } },
      };
    case "button":
      return {
        type: "object",
        properties: {
          label: { type: "string" },
          url: { type: "string", format: "uri" },
        },
      };
    case "aiText":
      return aiTextSchema();
    case "formula":
    case "rollup": {
      // The resulting type is determined by `options.result`; recurse into it.
      const result = field.options?.result;
      if (!result) return {};
      return schemaForFieldType(asField(result));
    }
    case "multipleLookupValues": {
      // Lookups return an array of the looked-up type.
      const result = field.options?.result;
      if (!result) return { type: "array", items: {} };
      return { type: "array", items: schemaForFieldType(asField(result)) };
    }
    default: {
      const _exhaustive: never = field;
      void _exhaustive;
      return {};
    }
  }
}

/**
 * The `options.result` of a computed field omits `id`/`name`/`description`.
 * Widen it back to a field-like shape so it can be fed to {@link schemaForFieldType}.
 */
function asField(result: Omit<FieldSchemaRead, "id" | "name" | "description">): FieldSchemaRead {
  return result as FieldSchemaRead;
}

/**
 * Convert an Airtable {@link FieldSchemaRead} to an OpenAPI 3 schema object,
 * including the field's `description` when present.
 */
export function fieldToOpenApiSchema(field: FieldSchemaRead): OpenApiSchema {
  const schema = schemaForFieldType(field);
  return field.description ? { ...schema, description: field.description } : schema;
}
