/**
 * Small builders shared across the per-surface OpenAPI generators.
 */

import type { TableId } from "../tables/types.ts";
import type {
  HttpMethod,
  OpenApiDocument,
  OpenApiMediaType,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiResponse,
  OpenApiSchema,
  OpenApiServer,
} from "./types.ts";

/** Shared state threaded to each per-surface generator. */
export interface SurfaceContext {
  /** Stable, unique component-name prefix for a table (e.g. `tasks` → `tasksFieldsRead`). */
  componentName: (tableId: TableId) => string;
  /** Server override applied to attachment-upload operations (the content API). */
  serverContent: OpenApiServer;
}

/** A `$ref` pointing at a named component schema. */
export function ref(name: string): OpenApiSchema {
  return { $ref: `#/components/schemas/${name}` };
}

/** A query parameter. */
export function queryParam(
  name: string,
  schema: OpenApiSchema,
  opts?: { description?: string; required?: boolean },
): OpenApiParameter {
  return { name, in: "query", schema, ...opts };
}

/** A required string path parameter. */
export function pathParam(name: string, description?: string): OpenApiParameter {
  return {
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
    ...(description ? { description } : {}),
  };
}

/** An `application/json` request/response media-type body. */
export function jsonContent(schema: OpenApiSchema): Record<string, OpenApiMediaType> {
  return { "application/json": { schema } };
}

/** An `application/json` 200 response. */
export function jsonResponse(description: string, schema: OpenApiSchema): OpenApiResponse {
  return { description, content: jsonContent(schema) };
}

/**
 * Attach an operation to a path, creating the path item if needed.
 *
 * Several surfaces contribute operations to the same path (e.g. `GET` and `POST`
 * on `/meta/bases/{baseId}/tables`), so we merge rather than overwrite.
 */
export function addOperation(
  doc: OpenApiDocument,
  path: string,
  method: HttpMethod,
  operation: OpenApiOperation,
): void {
  const item = (doc.paths[path] ??= {});
  item[method] = operation;
}

/** Register a component schema (later writers win, but names are unique by construction). */
export function addSchema(doc: OpenApiDocument, name: string, schema: OpenApiSchema): void {
  doc.components.schemas[name] = schema;
}
