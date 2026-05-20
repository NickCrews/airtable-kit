/**
 * Record CRUD endpoints: list / create / get / update (PATCH + PUT) / delete,
 * in both batch (`/{baseId}/{tableId}`) and single-record
 * (`/{baseId}/{tableId}/{recordId}`) forms.
 */

import { isFieldWritable } from "../value-converters/index.ts";
import type { BaseSchema } from "../bases/types.ts";
import { fieldToOpenApiSchema } from "./fields.ts";
import {
  addOperation,
  addSchema,
  jsonContent,
  jsonResponse,
  pathParam,
  queryParam,
  ref,
  type SurfaceContext,
} from "./helpers.ts";
import type { OpenApiDocument, OpenApiRequestBody, OpenApiSchema } from "./types.ts";

const TYPECAST: OpenApiSchema = {
  type: "boolean",
  default: false,
  description: "Convert string values to the appropriate cell value.",
};
const RETURN_FIELDS_BY_FIELD_ID: OpenApiSchema = {
  type: "boolean",
  default: false,
  description: "Key returned record fields by field ID instead of field name.",
};
const PERFORM_UPSERT: OpenApiSchema = {
  type: "object",
  description: "Match on the given fields to update existing records or create new ones.",
  properties: {
    fieldsToMergeOn: {
      type: "array",
      items: { type: "string" },
      description: "1-3 field names or IDs used as an external key for matching.",
    },
  },
  required: ["fieldsToMergeOn"],
};

/** Shared `{ records: [{ id, deleted }] }` schemas, registered once. */
function ensureDeleteSchemas(doc: OpenApiDocument): void {
  if (doc.components.schemas.DeletedRecord) return;
  addSchema(doc, "DeletedRecord", {
    type: "object",
    properties: {
      id: { type: "string" },
      deleted: { type: "boolean" },
    },
    required: ["id", "deleted"],
  });
  addSchema(doc, "DeletedRecordList", {
    type: "object",
    properties: {
      records: { type: "array", items: ref("DeletedRecord") },
    },
  });
}

export function addRecords(doc: OpenApiDocument, base: BaseSchema, ctx: SurfaceContext): void {
  ensureDeleteSchemas(doc);

  for (const table of base.tables) {
    const name = ctx.componentName(table.id);
    const tag = table.name;

    // --- Component schemas -------------------------------------------------
    const readProps: Record<string, OpenApiSchema> = {};
    const writeProps: Record<string, OpenApiSchema> = {};
    for (const field of table.fields) {
      readProps[field.name] = fieldToOpenApiSchema(field);
      if (isFieldWritable(field.type)) {
        writeProps[field.name] = fieldToOpenApiSchema(field);
      }
    }

    // No `required` / `nullable`: Airtable omits empty cells and enforces nothing
    // at the field level, so every property is optional.
    addSchema(doc, `${name}FieldsRead`, { type: "object", properties: readProps });
    addSchema(doc, `${name}FieldsWrite`, { type: "object", properties: writeProps });
    addSchema(doc, `${name}Record`, {
      type: "object",
      properties: {
        id: { type: "string" },
        createdTime: { type: "string", format: "date-time" },
        fields: ref(`${name}FieldsRead`),
      },
    });
    addSchema(doc, `${name}RecordList`, {
      type: "object",
      properties: {
        records: { type: "array", items: ref(`${name}Record`) },
        offset: { type: "string", description: "Pass back to fetch the next page." },
      },
    });

    const createBody: OpenApiRequestBody = {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          records: {
            type: "array",
            items: {
              type: "object",
              properties: { fields: ref(`${name}FieldsWrite`) },
            },
          },
          typecast: TYPECAST,
          returnFieldsByFieldId: RETURN_FIELDS_BY_FIELD_ID,
        },
      }),
    };
    const batchUpdateBody: OpenApiRequestBody = {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          records: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                fields: ref(`${name}FieldsWrite`),
              },
            },
          },
          typecast: TYPECAST,
          returnFieldsByFieldId: RETURN_FIELDS_BY_FIELD_ID,
          performUpsert: PERFORM_UPSERT,
        },
      }),
    };
    const singleUpdateBody: OpenApiRequestBody = {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          fields: ref(`${name}FieldsWrite`),
          typecast: TYPECAST,
          returnFieldsByFieldId: RETURN_FIELDS_BY_FIELD_ID,
        },
      }),
    };

    // --- Collection path: /{baseId}/{tableId} ------------------------------
    const collection = `/${base.id}/${table.id}`;
    addOperation(doc, collection, "get", {
      tags: [tag],
      summary: `List ${tag} records`,
      parameters: [
        queryParam("fields[]", { type: "array", items: { type: "string" } }, {
          description: "Only return these field names or IDs.",
        }),
        queryParam("filterByFormula", { type: "string" }),
        queryParam("maxRecords", { type: "integer" }),
        queryParam("pageSize", { type: "integer" }),
        queryParam("sort", {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              direction: { type: "string", enum: ["asc", "desc"], default: "asc" },
            },
            required: ["field"],
          },
        }),
        queryParam("view", { type: "string" }),
        queryParam("cellFormat", {
          type: "string",
          enum: ["json", "string"],
          default: "json",
        }),
        queryParam("timeZone", { type: "string" }),
        queryParam("userLocale", { type: "string" }),
        queryParam("returnFieldsByFieldId", RETURN_FIELDS_BY_FIELD_ID),
        queryParam("recordMetadata[]", {
          type: "array",
          items: { type: "string", enum: ["commentCount"] },
        }),
        queryParam("offset", { type: "string" }),
      ],
      responses: { 200: jsonResponse("OK", ref(`${name}RecordList`)) },
    });
    addOperation(doc, collection, "post", {
      tags: [tag],
      summary: `Create ${tag} records`,
      description: "Create up to 10 records at a time.",
      requestBody: createBody,
      responses: { 200: jsonResponse("OK", ref(`${name}RecordList`)) },
    });
    addOperation(doc, collection, "patch", {
      tags: [tag],
      summary: `Update ${tag} records`,
      description: "Partial update: fields omitted from the request are left unchanged.",
      requestBody: batchUpdateBody,
      responses: { 200: jsonResponse("OK", ref(`${name}RecordList`)) },
    });
    addOperation(doc, collection, "put", {
      tags: [tag],
      summary: `Replace ${tag} records`,
      description: "Destructive update: fields omitted from the request are cleared.",
      requestBody: batchUpdateBody,
      responses: { 200: jsonResponse("OK", ref(`${name}RecordList`)) },
    });
    addOperation(doc, collection, "delete", {
      tags: [tag],
      summary: `Delete ${tag} records`,
      parameters: [
        queryParam(
          "records[]",
          { type: "array", items: { type: "string" } },
          { required: true, description: "Record IDs to delete (up to 10)." },
        ),
      ],
      responses: { 200: jsonResponse("OK", ref("DeletedRecordList")) },
    });

    // --- Single-record path: /{baseId}/{tableId}/{recordId} ----------------
    const single = `/${base.id}/${table.id}/{recordId}`;
    addOperation(doc, single, "get", {
      tags: [tag],
      summary: `Get a ${tag} record`,
      parameters: [
        pathParam("recordId"),
        queryParam("cellFormat", { type: "string", enum: ["json", "string"], default: "json" }),
        queryParam("returnFieldsByFieldId", RETURN_FIELDS_BY_FIELD_ID),
      ],
      responses: { 200: jsonResponse("OK", ref(`${name}Record`)) },
    });
    addOperation(doc, single, "patch", {
      tags: [tag],
      summary: `Update a ${tag} record`,
      description: "Partial update: fields omitted from the request are left unchanged.",
      parameters: [pathParam("recordId")],
      requestBody: singleUpdateBody,
      responses: { 200: jsonResponse("OK", ref(`${name}Record`)) },
    });
    addOperation(doc, single, "put", {
      tags: [tag],
      summary: `Replace a ${tag} record`,
      description: "Destructive update: fields omitted from the request are cleared.",
      parameters: [pathParam("recordId")],
      requestBody: singleUpdateBody,
      responses: { 200: jsonResponse("OK", ref(`${name}Record`)) },
    });
    addOperation(doc, single, "delete", {
      tags: [tag],
      summary: `Delete a ${tag} record`,
      parameters: [pathParam("recordId")],
      responses: { 200: jsonResponse("OK", ref("DeletedRecord")) },
    });
  }
}
