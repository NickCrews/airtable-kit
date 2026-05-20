/**
 * Integration snapshots for `baseToOpenApi` across option combinations.
 */

import { describe, it, expect } from "vitest";
import { baseToOpenApi } from "airtable-kit/openapi";
import taskBase from "../src/tests/taskBase.ts";

describe("baseToOpenApi", () => {
  it("matches snapshot with default options (all surfaces)", () => {
    expect(baseToOpenApi(taskBase)).toMatchSnapshot();
  });

  it("matches snapshot with records only", () => {
    const doc = baseToOpenApi(taskBase, {
      include: {
        records: true,
        comments: false,
        webhooks: false,
        tableMetadata: false,
        baseMetadata: false,
        attachments: false,
      },
    });
    expect(doc).toMatchSnapshot();
  });

  it("matches snapshot with metadata surfaces only", () => {
    const doc = baseToOpenApi(taskBase, {
      include: {
        records: false,
        comments: false,
        webhooks: false,
        attachments: false,
        tableMetadata: true,
        baseMetadata: true,
      },
    });
    expect(doc).toMatchSnapshot();
  });

  it("matches snapshot with custom info and servers", () => {
    const doc = baseToOpenApi(taskBase, {
      title: "My Custom API",
      description: "Custom description",
      version: "2.0.0",
      serverApi: { url: "https://proxy.example.com/v0", description: "Proxy" },
      serverContent: "https://content.example.com/v0",
      include: { records: true, comments: false, webhooks: false, tableMetadata: false, baseMetadata: false, attachments: true },
    });
    expect(doc).toMatchSnapshot();
  });

  it("keys record paths by table ID and tags by table name", () => {
    const doc = baseToOpenApi(taskBase, {
      include: { records: true, comments: false, webhooks: false, tableMetadata: false, baseMetadata: false, attachments: false },
    });
    expect(doc.paths["/appTaskBase/tblTasks"]).toBeDefined();
    expect(doc.paths["/appTaskBase/tblTasks"].get?.tags).toEqual(["tasks"]);
    // Component schemas are keyed by sanitized table name.
    expect(doc.components.schemas.tasksFieldsRead).toBeDefined();
    expect(doc.components.schemas.tasksRecord).toBeDefined();
    expect(doc.components.schemas.tasksRecordList).toBeDefined();
  });

  it("omits computed/read-only fields from the write schema", () => {
    const doc = baseToOpenApi(taskBase, {
      include: { records: true, comments: false, webhooks: false, tableMetadata: false, baseMetadata: false, attachments: false },
    });
    const writeProps = doc.components.schemas.tasksFieldsWrite.properties ?? {};
    const readProps = doc.components.schemas.tasksFieldsRead.properties ?? {};
    // "Created At" (createdTime) and "Updated At" (lastModifiedTime) are read-only.
    expect(readProps["Created At"]).toBeDefined();
    expect(writeProps["Created At"]).toBeUndefined();
    expect(writeProps["Updated At"]).toBeUndefined();
    // A normal text field stays writable.
    expect(writeProps["Name"]).toBeDefined();
  });

  it("applies the content-API server override only to attachment uploads", () => {
    const doc = baseToOpenApi(taskBase);
    const upload = doc.paths["/appTaskBase/{recordId}/{attachmentFieldIdOrName}/uploadAttachment"];
    expect(upload?.post?.servers).toEqual([{ url: "https://content.airtable.com/v0" }]);
    // Record operations inherit the top-level server (no override).
    expect(doc.paths["/appTaskBase/tblTasks"].get?.servers).toBeUndefined();
    expect(doc.servers).toEqual([{ url: "https://api.airtable.com/v0" }]);
  });
});
