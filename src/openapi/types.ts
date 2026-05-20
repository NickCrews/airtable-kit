/**
 * Minimal OpenAPI 3 type definitions.
 *
 * We model only the subset of the OpenAPI Specification that {@link baseToOpenApi}
 * actually emits. It is deliberately loose (e.g. `OpenApiSchema` allows arbitrary
 * extra keys) so callers can post-process the document without fighting the types,
 * and so we don't take on a heavyweight openapi-types dependency.
 */

/** A JSON-Schema-flavoured schema object as used inside an OpenAPI 3 document. */
export interface OpenApiSchema {
  type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
  format?: string;
  description?: string;
  enum?: ReadonlyArray<string>;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: ReadonlyArray<string>;
  /** A reference to a component schema, e.g. `#/components/schemas/Foo`. */
  $ref?: string;
  [extra: string]: unknown;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema: OpenApiSchema;
}

export interface OpenApiMediaType {
  schema: OpenApiSchema;
}

export interface OpenApiRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponse {
  description: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
  tags?: ReadonlyArray<string>;
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
  /** Per-operation server override (used for the content API on attachment uploads). */
  servers?: OpenApiServer[];
}

export type HttpMethod = "get" | "post" | "patch" | "put" | "delete";

export type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>>;

export interface OpenApiComponents {
  securitySchemes: Record<string, unknown>;
  schemas: Record<string, OpenApiSchema>;
}

export interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
  };
  servers: OpenApiServer[];
  security: Array<Record<string, string[]>>;
  components: OpenApiComponents;
  paths: Record<string, OpenApiPathItem>;
}

/** Which API surfaces to include in the generated document. All default to `true`. */
export interface OpenApiInclude {
  /** Record CRUD endpoints (`/{baseId}/{tableId}`). */
  records?: boolean;
  /** Record comment endpoints. */
  comments?: boolean;
  /** Webhook management endpoints. */
  webhooks?: boolean;
  /** Table & field metadata endpoints (`/meta/...`). */
  tableMetadata?: boolean;
  /** Base metadata endpoints (list/create bases, fetch schema). */
  baseMetadata?: boolean;
  /** Attachment upload endpoint (served from the content API). */
  attachments?: boolean;
}

export interface OpenApiOptions {
  include?: OpenApiInclude;
  /** `info.title`. Defaults to `"{base.name} API"`. */
  title?: string;
  /** `info.description`. Defaults to a generated sentence. */
  description?: string;
  /** `info.version`. Defaults to `"v0"`. */
  version?: string;
  /** Top-level server for the standard REST API. Defaults to `https://api.airtable.com/v0`. */
  serverApi?: string | OpenApiServer;
  /** Server used to override attachment-upload operations. Defaults to `https://content.airtable.com/v0`. */
  serverContent?: string | OpenApiServer;
}
