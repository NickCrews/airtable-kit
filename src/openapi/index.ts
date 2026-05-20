/**
 * Generate an OpenAPI 3 document describing the Airtable REST API for a base.
 *
 * Ported and corrected from TheF1rstPancake/AirtableOpenAPICustomBlock.
 *
 * @example
 * ```ts
 * import { baseToOpenApi } from "airtable-kit/openapi";
 * import { getBaseSchema } from "airtable-kit/bases";
 *
 * const base = await getBaseSchema({ baseId: "appXXXXXXXXXXXXXX" });
 * const spec = baseToOpenApi(base);
 * console.log(JSON.stringify(spec, null, 2));
 * ```
 */

import type { BaseSchema } from "../bases/types.ts";
import type { TableId } from "../tables/types.ts";
import type { SurfaceContext } from "./helpers.ts";
import type { OpenApiDocument, OpenApiOptions, OpenApiServer } from "./types.ts";

import { addRecords } from "./records.ts";
import { addComments } from "./comments.ts";
import { addAttachments } from "./attachments.ts";
import { addWebhooks } from "./webhooks.ts";
import { addTableMetadata } from "./tableMetadata.ts";
import { addBaseMetadata } from "./baseMetadata.ts";

export { fieldToOpenApiSchema } from "./fields.ts";
export type {
  OpenApiDocument,
  OpenApiOptions,
  OpenApiInclude,
  OpenApiSchema,
  OpenApiServer,
  OpenApiPathItem,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
} from "./types.ts";

const DEFAULT_SERVER_API = "https://api.airtable.com/v0";
const DEFAULT_SERVER_CONTENT = "https://content.airtable.com/v0";

function toServer(value: string | OpenApiServer | undefined, fallbackUrl: string): OpenApiServer {
  if (value === undefined) return { url: fallbackUrl };
  if (typeof value === "string") return { url: value };
  return value;
}

/**
 * Build a stable, unique, OpenAPI-safe component-name prefix for each table.
 *
 * Component names must match `^[a-zA-Z0-9._-]+$`, so we strip other characters
 * from the table name. Empty or colliding names fall back to the table ID.
 */
function makeComponentNamer(base: BaseSchema): (tableId: TableId) => string {
  const byId = new Map<TableId, string>();
  const used = new Set<string>();
  for (const table of base.tables) {
    let candidate = table.name.replace(/[^a-zA-Z0-9._-]/g, "");
    if (!candidate || !/^[a-zA-Z]/.test(candidate)) {
      candidate = `Table_${table.id}`;
    }
    let unique = candidate;
    let n = 2;
    while (used.has(unique)) {
      unique = `${candidate}_${n++}`;
    }
    used.add(unique);
    byId.set(table.id, unique);
  }
  return (tableId) => byId.get(tableId) ?? `Table_${tableId}`;
}

/**
 * Convert a {@link BaseSchema} into an {@link OpenApiDocument}.
 *
 * @param base    The base schema (e.g. from `getBaseSchema`).
 * @param options See {@link OpenApiOptions}; every API surface is included by default.
 */
export function baseToOpenApi(base: BaseSchema, options?: OpenApiOptions): OpenApiDocument {
  const include = {
    records: true,
    comments: true,
    webhooks: true,
    tableMetadata: true,
    baseMetadata: true,
    attachments: true,
    ...options?.include,
  };

  const serverApi = toServer(options?.serverApi, DEFAULT_SERVER_API);
  const serverContent = toServer(options?.serverContent, DEFAULT_SERVER_CONTENT);

  const doc: OpenApiDocument = {
    openapi: "3.1.0",
    info: {
      title: options?.title ?? `${base.name} API`,
      description:
        options?.description ?? `Airtable REST API for base "${base.name}" (${base.id}).`,
      version: options?.version ?? "v0",
    },
    servers: [serverApi],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer" },
      },
      schemas: {},
    },
    paths: {},
  };

  const ctx: SurfaceContext = {
    componentName: makeComponentNamer(base),
    serverContent,
  };

  if (include.records) addRecords(doc, base, ctx);
  if (include.comments) addComments(doc, base, ctx);
  if (include.attachments) addAttachments(doc, base, ctx);
  if (include.webhooks) addWebhooks(doc, base, ctx);
  if (include.tableMetadata) addTableMetadata(doc, base, ctx);
  if (include.baseMetadata) addBaseMetadata(doc, base, ctx);

  return doc;
}
