/**
 * One snapshot per Airtable field type for `fieldToOpenApiSchema`.
 *
 * A coverage test asserts that we have a sample for every field type the library
 * knows about, so new field types can't silently slip through untested.
 */

import { describe, it, expect } from "vitest";
import { fieldToOpenApiSchema } from "airtable-kit/openapi";
import { CONVERTERS } from "airtable-kit/value-converters";
import type { FieldSchemaRead, FieldType } from "airtable-kit/fields";

/**
 * A representative field for each type, exercising any options that affect output.
 *
 * Asserted (rather than annotated) because `FieldSchemaRead`'s computed-field
 * `options.result` is a `Omit<...>` over the field union, which collapses away the
 * per-type `options` key and would otherwise reject these literals.
 */
const SAMPLES = {
  aiText: { id: "fld1", name: "ai", type: "aiText", options: { prompt: [], referencedFieldIds: [] } },
  autoNumber: { id: "fld1", name: "n", type: "autoNumber" },
  barcode: { id: "fld1", name: "bc", type: "barcode" },
  button: { id: "fld1", name: "btn", type: "button" },
  checkbox: { id: "fld1", name: "done", type: "checkbox", options: { icon: "check", color: "greenBright" } },
  count: { id: "fld1", name: "c", type: "count", options: { isValid: true, recordLinkFieldId: "fld2" } },
  createdBy: { id: "fld1", name: "by", type: "createdBy" },
  createdTime: { id: "fld1", name: "at", type: "createdTime" },
  currency: { id: "fld1", name: "cost", type: "currency", options: { precision: 2, symbol: "$" } },
  date: { id: "fld1", name: "d", type: "date", options: { dateFormat: { name: "iso", format: "YYYY-MM-DD" } } },
  dateTime: {
    id: "fld1",
    name: "dt",
    type: "dateTime",
    options: {
      timeZone: "utc",
      dateFormat: { name: "iso", format: "YYYY-MM-DD" },
      timeFormat: { name: "24hour", format: "HH:mm" },
    },
  },
  duration: { id: "fld1", name: "dur", type: "duration", options: { durationFormat: "h:mm:ss" } },
  email: { id: "fld1", name: "email", type: "email" },
  externalSyncSource: { id: "fld1", name: "src", type: "externalSyncSource" },
  formula: {
    id: "fld1",
    name: "f",
    type: "formula",
    options: { isValid: true, result: { type: "number", options: { precision: 0 } } },
  },
  lastModifiedBy: { id: "fld1", name: "mby", type: "lastModifiedBy" },
  lastModifiedTime: { id: "fld1", name: "mat", type: "lastModifiedTime" },
  multilineText: { id: "fld1", name: "notes", type: "multilineText" },
  multipleAttachments: { id: "fld1", name: "files", type: "multipleAttachments", options: { isReversed: false } },
  multipleCollaborators: { id: "fld1", name: "team", type: "multipleCollaborators" },
  multipleLookupValues: {
    id: "fld1",
    name: "lk",
    type: "multipleLookupValues",
    options: {
      isValid: true,
      recordLinkFieldId: "fld2",
      fieldIdInLinkedTable: "fld3",
      result: { type: "singleLineText" },
    },
  },
  multipleRecordLinks: {
    id: "fld1",
    name: "links",
    type: "multipleRecordLinks",
    options: { linkedTableId: "tbl2", isReversed: false, prefersSingleRecordLink: false },
  },
  multipleSelects: {
    id: "fld1",
    name: "tags",
    type: "multipleSelects",
    options: {
      choices: [
        { id: "sel1", name: "A", color: "blueLight2" },
        { id: "sel2", name: "B", color: "greenLight2" },
      ],
    },
  },
  number: { id: "fld1", name: "num", type: "number", options: { precision: 2 } },
  percent: { id: "fld1", name: "pct", type: "percent", options: { precision: 2 } },
  phoneNumber: { id: "fld1", name: "phone", type: "phoneNumber" },
  rating: { id: "fld1", name: "stars", type: "rating", options: { max: 5, icon: "star" } },
  richText: { id: "fld1", name: "rt", type: "richText" },
  rollup: {
    id: "fld1",
    name: "ru",
    type: "rollup",
    options: {
      recordLinkFieldId: "fld2",
      fieldIdInLinkedTable: "fld3",
      isValid: true,
      result: { type: "currency", options: { precision: 2, symbol: "$" } },
    },
  },
  singleCollaborator: { id: "fld1", name: "owner", type: "singleCollaborator" },
  singleLineText: { id: "fld1", name: "title", type: "singleLineText", description: "The title" },
  singleSelect: {
    id: "fld1",
    name: "status",
    type: "singleSelect",
    options: {
      choices: [
        { id: "sel1", name: "Todo", color: "blueLight2" },
        { id: "sel2", name: "Done", color: "greenLight2" },
      ],
    },
  },
  url: { id: "fld1", name: "link", type: "url" },
} as Record<FieldType, FieldSchemaRead>;

describe("fieldToOpenApiSchema", () => {
  it("has a sample for every field type the library supports", () => {
    expect(Object.keys(SAMPLES).sort()).toEqual(Object.keys(CONVERTERS).sort());
  });

  for (const [type, field] of Object.entries(SAMPLES)) {
    it(`maps ${type}`, () => {
      expect(fieldToOpenApiSchema(field)).toMatchSnapshot();
    });
  }

  it("includes the field description when present", () => {
    const schema = fieldToOpenApiSchema(SAMPLES.singleLineText);
    expect(schema.description).toBe("The title");
  });

  it("does not mutate shared output across calls (fresh objects each time)", () => {
    const a = fieldToOpenApiSchema(SAMPLES.singleSelect);
    const b = fieldToOpenApiSchema(SAMPLES.singleSelect);
    expect(a).not.toBe(b);
    expect(a.enum).not.toBe(b.enum);
  });
});
