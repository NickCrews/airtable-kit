/**
 * Base metadata endpoints (the `/meta` API): list & create bases, and read a
 * base's schema. Table/field mutations live in `tableMetadata.ts`.
 *
 * https://airtable.com/developers/web/api/list-bases
 */

import type { BaseSchema } from "../bases/types.ts";
import {
  addOperation,
  addSchema,
  jsonContent,
  jsonResponse,
  queryParam,
  ref,
  type SurfaceContext,
} from "./helpers.ts";
import { metaFieldSchema, metaTableSchema } from "./tableMetadata.ts";
import type { OpenApiDocument } from "./types.ts";

export function addBaseMetadata(
  doc: OpenApiDocument,
  base: BaseSchema,
  ctx: SurfaceContext,
): void {
  void ctx;

  // These may already be registered by the table-metadata surface; identical either way.
  addSchema(doc, "MetaField", metaFieldSchema());
  addSchema(doc, "MetaTable", metaTableSchema());

  const tag = "Metadata";

  addOperation(doc, "/meta/bases", "get", {
    tags: [tag],
    summary: "List accessible bases",
    parameters: [queryParam("offset", { type: "string" })],
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: {
          bases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                permissionLevel: { type: "string" },
              },
            },
          },
          offset: { type: "string" },
        },
      }),
    },
  });

  addOperation(doc, "/meta/bases", "post", {
    tags: [tag],
    summary: "Create a base",
    requestBody: {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          name: { type: "string" },
          workspaceId: { type: "string" },
          tables: { type: "array", items: { type: "object" } },
        },
        required: ["name", "workspaceId", "tables"],
      }),
    },
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: {
          id: { type: "string" },
          tables: { type: "array", items: ref("MetaTable") },
        },
      }),
    },
  });

  addOperation(doc, `/meta/bases/${base.id}/tables`, "get", {
    tags: [tag],
    summary: "Get a base's schema",
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: { tables: { type: "array", items: ref("MetaTable") } },
      }),
    },
  });
}
