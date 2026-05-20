/**
 * Record comment endpoints.
 *
 * https://airtable.com/developers/web/api/list-comments
 */

import type { BaseSchema } from "../bases/types.ts";
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
import type { OpenApiDocument, OpenApiRequestBody } from "./types.ts";

export function addComments(doc: OpenApiDocument, base: BaseSchema, ctx: SurfaceContext): void {
  void ctx;

  addSchema(doc, "Comment", {
    type: "object",
    properties: {
      id: { type: "string" },
      text: { type: "string" },
      createdTime: { type: "string", format: "date-time" },
      lastUpdatedTime: { type: "string", format: "date-time" },
      author: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
        },
      },
    },
  });
  addSchema(doc, "CommentList", {
    type: "object",
    properties: {
      comments: { type: "array", items: ref("Comment") },
      offset: { type: "string", description: "Pass back to fetch the next page." },
    },
  });

  const textBody: OpenApiRequestBody = {
    required: true,
    content: jsonContent({
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
    }),
  };

  const tag = "Comments";
  const list = `/${base.id}/{tableIdOrName}/{recordId}/comments`;
  addOperation(doc, list, "get", {
    tags: [tag],
    summary: "List comments on a record",
    parameters: [
      pathParam("tableIdOrName"),
      pathParam("recordId"),
      queryParam("pageSize", { type: "integer" }),
      queryParam("offset", { type: "string" }),
    ],
    responses: { 200: jsonResponse("OK", ref("CommentList")) },
  });
  addOperation(doc, list, "post", {
    tags: [tag],
    summary: "Create a comment on a record",
    parameters: [pathParam("tableIdOrName"), pathParam("recordId")],
    requestBody: textBody,
    responses: { 200: jsonResponse("OK", ref("Comment")) },
  });

  const single = `/${base.id}/{tableIdOrName}/{recordId}/comments/{commentId}`;
  addOperation(doc, single, "patch", {
    tags: [tag],
    summary: "Update a comment",
    parameters: [pathParam("tableIdOrName"), pathParam("recordId"), pathParam("commentId")],
    requestBody: textBody,
    responses: { 200: jsonResponse("OK", ref("Comment")) },
  });
  addOperation(doc, single, "delete", {
    tags: [tag],
    summary: "Delete a comment",
    parameters: [pathParam("tableIdOrName"), pathParam("recordId"), pathParam("commentId")],
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: { id: { type: "string" }, deleted: { type: "boolean" } },
      }),
    },
  });
}
