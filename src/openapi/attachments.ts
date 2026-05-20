/**
 * Attachment upload endpoint.
 *
 * Unlike every other operation, this is served from the *content* API
 * (`https://content.airtable.com/v0`), so the operation carries a `servers`
 * override pointing at {@link SurfaceContext.serverContent}.
 *
 * https://airtable.com/developers/web/api/upload-attachment
 */

import type { BaseSchema } from "../bases/types.ts";
import {
  addOperation,
  jsonContent,
  jsonResponse,
  pathParam,
  type SurfaceContext,
} from "./helpers.ts";
import type { OpenApiDocument } from "./types.ts";

export function addAttachments(doc: OpenApiDocument, base: BaseSchema, ctx: SurfaceContext): void {
  const path = `/${base.id}/{recordId}/{attachmentFieldIdOrName}/uploadAttachment`;
  addOperation(doc, path, "post", {
    tags: ["Attachments"],
    summary: "Upload an attachment to a record's attachment field",
    servers: [ctx.serverContent],
    parameters: [
      pathParam("recordId"),
      pathParam("attachmentFieldIdOrName", "Attachment field ID or name"),
    ],
    requestBody: {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          contentType: { type: "string", description: "MIME type, e.g. image/jpeg" },
          file: { type: "string", format: "byte", description: "Base64-encoded file contents" },
          filename: { type: "string" },
        },
        required: ["contentType", "file", "filename"],
      }),
    },
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        description: "The updated record.",
        properties: {
          id: { type: "string" },
          createdTime: { type: "string", format: "date-time" },
          fields: { type: "object" },
        },
      }),
    },
  });
}
