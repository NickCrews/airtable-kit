/**
 * Webhook management endpoints.
 *
 * These live under `/bases/{baseId}/webhooks` on the standard REST API.
 *
 * https://airtable.com/developers/web/api/list-webhooks
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
import type { OpenApiDocument } from "./types.ts";

export function addWebhooks(doc: OpenApiDocument, base: BaseSchema, ctx: SurfaceContext): void {
  void ctx;

  addSchema(doc, "Webhook", {
    type: "object",
    properties: {
      id: { type: "string" },
      notificationUrl: { type: "string", format: "uri" },
      isHookEnabled: { type: "boolean" },
      areNotificationsEnabled: { type: "boolean" },
      cursorForNextPayload: { type: "integer" },
      lastNotificationResult: { type: "object" },
      expirationTime: { type: "string", format: "date-time" },
      specification: { type: "object" },
    },
  });

  const tag = "Webhooks";
  const collection = `/bases/${base.id}/webhooks`;
  addOperation(doc, collection, "get", {
    tags: [tag],
    summary: "List webhooks for the base",
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: { webhooks: { type: "array", items: ref("Webhook") } },
      }),
    },
  });
  addOperation(doc, collection, "post", {
    tags: [tag],
    summary: "Create a webhook",
    requestBody: {
      required: true,
      content: jsonContent({
        type: "object",
        properties: {
          notificationUrl: { type: "string", format: "uri" },
          specification: {
            type: "object",
            description: "Webhook specification (options.filters, etc.).",
          },
        },
        required: ["specification"],
      }),
    },
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: {
          id: { type: "string" },
          expirationTime: { type: "string", format: "date-time" },
          macSecretBase64: { type: "string" },
        },
      }),
    },
  });

  const single = `/bases/${base.id}/webhooks/{webhookId}`;
  addOperation(doc, single, "delete", {
    tags: [tag],
    summary: "Delete a webhook",
    parameters: [pathParam("webhookId")],
    responses: { 200: { description: "OK" } },
  });

  addOperation(doc, `/bases/${base.id}/webhooks/{webhookId}/enableNotifications`, "post", {
    tags: [tag],
    summary: "Enable or disable webhook notifications",
    parameters: [pathParam("webhookId")],
    requestBody: {
      required: true,
      content: jsonContent({
        type: "object",
        properties: { enable: { type: "boolean" } },
        required: ["enable"],
      }),
    },
    responses: { 200: { description: "OK" } },
  });

  addOperation(doc, `/bases/${base.id}/webhooks/{webhookId}/refresh`, "post", {
    tags: [tag],
    summary: "Refresh a webhook's expiration time",
    parameters: [pathParam("webhookId")],
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: { expirationTime: { type: "string", format: "date-time" } },
      }),
    },
  });

  addOperation(doc, `/bases/${base.id}/webhooks/{webhookId}/payloads`, "get", {
    tags: [tag],
    summary: "List webhook payloads",
    parameters: [
      pathParam("webhookId"),
      queryParam("cursor", { type: "integer" }),
      queryParam("limit", { type: "integer" }),
    ],
    responses: {
      200: jsonResponse("OK", {
        type: "object",
        properties: {
          payloads: { type: "array", items: { type: "object" } },
          cursor: { type: "integer" },
          mightHaveMore: { type: "boolean" },
        },
      }),
    },
  });
}
