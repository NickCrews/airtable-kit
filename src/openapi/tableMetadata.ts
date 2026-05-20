/**
 * Table & field metadata endpoints (the `/meta` API).
 *
 * Create/update tables and fields. Reading the schema lives in `baseMetadata.ts`.
 *
 * https://airtable.com/developers/web/api/create-table
 */

import type { BaseSchema } from "../bases/types.ts";
import {
  addOperation,
  addSchema,
  jsonContent,
  jsonResponse,
  pathParam,
  ref,
  type SurfaceContext,
} from "./helpers.ts";
import type { OpenApiDocument, OpenApiSchema } from "./types.ts";

/** Loose schema for a field as returned by the metadata API. Shared with baseMetadata. */
export function metaFieldSchema(): OpenApiSchema {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: { type: "string" },
      description: { type: "string" },
      options: { type: "object" },
    },
  };
}

/** Loose schema for a table as returned by the metadata API. Shared with baseMetadata. */
export function metaTableSchema(): OpenApiSchema {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      primaryFieldId: { type: "string" },
      fields: { type: "array", items: ref("MetaField") },
      views: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            type: { type: "string" },
          },
        },
      },
    },
  };
}

export function addTableMetadata(
  doc: OpenApiDocument,
  base: BaseSchema,
  ctx: SurfaceContext,
): void {
  void ctx;

  addSchema(doc, "MetaField", metaFieldSchema());
  addSchema(doc, "MetaTable", metaTableSchema());

  const tag = "Metadata";

  addOperation(doc, `/meta/bases/${base.id}/tables`, "post", {
    tags: [tag],
    summary: "Create a table",
    requestBody: {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          fields: { type: "array", items: { type: "object" } },
        },
        required: ["name", "fields"],
      }),
    },
    responses: { 200: jsonResponse("OK", ref("MetaTable")) },
  });

  addOperation(doc, `/meta/bases/${base.id}/tables/{tableId}`, "patch", {
    tags: [tag],
    summary: "Update a table's name or description",
    parameters: [pathParam("tableId")],
    requestBody: {
      content: jsonContent({
        type: "object",
        properties: { name: { type: "string" }, description: { type: "string" } },
      }),
    },
    responses: { 200: jsonResponse("OK", ref("MetaTable")) },
  });

  addOperation(doc, `/meta/bases/${base.id}/tables/{tableId}/fields`, "post", {
    tags: [tag],
    summary: "Create a field",
    parameters: [pathParam("tableId")],
    requestBody: {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          description: { type: "string" },
          options: { type: "object" },
        },
        required: ["name", "type"],
      }),
    },
    responses: { 200: jsonResponse("OK", ref("MetaField")) },
  });

  addOperation(doc, `/meta/bases/${base.id}/tables/{tableId}/fields/{fieldId}`, "patch", {
    tags: [tag],
    summary: "Update a field's name or description",
    parameters: [pathParam("tableId"), pathParam("fieldId")],
    requestBody: {
      content: jsonContent({
        type: "object",
        properties: { name: { type: "string" }, description: { type: "string" } },
      }),
    },
    responses: { 200: jsonResponse("OK", ref("MetaField")) },
  });
}
