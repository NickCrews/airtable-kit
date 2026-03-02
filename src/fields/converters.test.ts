/**
 * Comprehensive tests for converters
 */

import { describe, expect, it } from "vitest";
import { BarcodeValue, convertValueForWrite, convertValueFromRead, type FieldForConvert } from "./converters.ts";
import * as FIELDS from "./_example-fields.ts";

describe("Converters", () => {
  describe("aiText", () => {
    const { type } = FIELDS.AI_TEXT;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("aiText can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite("some slop", fieldSchema)).toThrow();
    });
    it("aiText makeFrom should convert to string", () => {
      expect(convertValueFromRead("Generated AI text", fieldSchema)).toBe("Generated AI text");
    });
  });
  describe("autoNumber", () => {
    const { type } = FIELDS.AUTO_NUMBER;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("autoNumber can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(42, fieldSchema)).toThrow();
    });
    it("autoNumber makeFrom should convert to number", () => {
      expect(convertValueFromRead(42, fieldSchema)).toBe(42);
    });
  });
  describe("barcode", () => {
    const { type } = FIELDS.BARCODE;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("barcode should convert BarcodeValue for write", () => {
      const value: BarcodeValue = { text: "123456", type: "upce" };
      expect(convertValueForWrite(value, fieldSchema)).toEqual(value);
    });
    it("barcode should handle null for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
    });
    it("barcode should convert to BarcodeValue for read", () => {
      const value = { text: "123456", type: "upce" };
      expect(convertValueFromRead(value, fieldSchema)).toEqual(value);
    });
  });
  describe("button", () => {
    const { type } = FIELDS.BUTTON;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("button can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite("some value", fieldSchema)).toThrow();
    });
    it("button can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite("some value", fieldSchema)).toThrow();
    });
  });
  describe("checkbox", () => {
    const { type } = FIELDS.CHECKBOX;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("checkbox should convert values for write", () => {
      expect(convertValueForWrite(true, fieldSchema)).toBe(true);
      expect(convertValueForWrite(false, fieldSchema)).toBe(false);
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("checkbox should convert to boolean for read", () => {
      expect(convertValueFromRead(true, fieldSchema)).toBe(true);
      expect(convertValueFromRead(false, fieldSchema)).toBe(false);
    });
  });
  describe("count", () => {
    const { type } = FIELDS.COUNT;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("count should can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(42, fieldSchema)).toThrow();
    });
    it("count makeFrom should convert to number", () => {
      expect(convertValueFromRead(42, fieldSchema)).toBe(42);
    });
  });
  describe("createdBy", () => {
    const { type } = FIELDS.CREATED_BY;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("createdBy can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite({ id: "usr123", email: "test@example.com" }, fieldSchema)).toThrow();
    });
    it("createdBy should convert to User", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertValueFromRead(user, fieldSchema)).toEqual(user);
    });
  });
  describe("createdTime", () => {
    const { type } = FIELDS.CREATED_TIME;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("createdTime can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(new Date(), fieldSchema)).toThrow();
    });
    it("createdTime should convert to Date", () => {
      const dateStr = "2024-01-15T10:30:00.000Z";
      const result = convertValueFromRead(dateStr, fieldSchema);
      expect(result).toBe(dateStr);
    });
  });
  describe("currency", () => {
    const { type } = FIELDS.CURRENCY;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("currency should convert for write", () => {
      expect(convertValueForWrite(99.99, fieldSchema)).toBe(99.99);
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("currency should convert to number for read", () => {
      expect(convertValueFromRead(99.99, fieldSchema)).toBe(99.99);
      expect(convertValueFromRead(null, fieldSchema)).toBeNull();
    });
  });
  describe("date", () => {
    const { type } = FIELDS.DATE;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("date should convert Date to ISO string for write", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(convertValueForWrite(date, fieldSchema)).toBe("2024-01-15");
    });
    it("date should accept date string for write", () => {
      expect(convertValueForWrite("2024-01-15", fieldSchema)).toBe("2024-01-15");
    });
    it("date should handle null for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
    });
    it("date should handle undefined for write", () => {
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("date should convert to string for read", () => {
      expect(convertValueFromRead("2024-01-15", fieldSchema)).toBe("2024-01-15");
    });
  });
  describe("dateTime", () => {
    const { type } = FIELDS.DATE_TIME;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("dateTime should convert Date to ISO string for write", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(convertValueForWrite(date, fieldSchema)).toBe(date.toISOString());
    });
    it("dateTime should pass through ISO string in UTC for write", () => {
      const isoStr = "2024-01-15T10:30:00.000Z";
      expect(convertValueForWrite(isoStr, fieldSchema)).toBe(isoStr);
    });
    it("dateTime should pass through ISO string in other timezone for write", () => {
      const isoStr = "2024-01-15T10:30:00-05:00";
      expect(convertValueForWrite(isoStr, fieldSchema)).toBe(isoStr);
    });
    it("dateTime should pass through ISO string with no timezone for write", () => {
      const isoStr = "2024-01-15T10:30:00";
      expect(convertValueForWrite(isoStr, fieldSchema)).toBe(isoStr);
    });
    it("dateTime should handle null for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
    });
    it("dateTime should handle undefined for write", () => {
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("dateTime should convert to Date for read", () => {
      const isoStr = "2024-01-15T10:30:00.000Z";
      const result = convertValueFromRead(isoStr, fieldSchema);
      expect(result).toBe(isoStr);
    });
    it("dateTime should handle null for read", () => {
      expect(convertValueFromRead(null, fieldSchema)).toBeNull();
    });
  });
  describe("duration", () => {
    const { type } = FIELDS.DURATION;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("duration should convert for write", () => {
      expect(convertValueForWrite(3600, fieldSchema)).toBe(3600);
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("duration should convert to number for read", () => {
      expect(convertValueFromRead(3600, fieldSchema)).toBe(3600);
    });
  });
  describe("email", () => {
    const { type } = FIELDS.EMAIL;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("email should convert for write", () => {
      expect(convertValueForWrite("test@example.com", fieldSchema)).toBe("test@example.com");
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("email should convert to string for read", () => {
      expect(convertValueFromRead("test@example.com", fieldSchema)).toBe("test@example.com");
    });
  });
  describe("externalSyncSource", () => {
    const { type } = FIELDS.EXTERNAL_SYNC_SOURCE;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("externalSyncSource should pass through for write", () => {
      const value = { someData: "test" };
      expect(convertValueForWrite(value, fieldSchema)).toEqual(value);
    });
    it("externalSyncSource should pass through for read", () => {
      const value = { someData: "test" };
      expect(convertValueFromRead(value, fieldSchema)).toEqual(value);
    });
  });
  describe("formula", () => {
    const { type, options } = FIELDS.FORMULA;
    const fieldSchema = { type, options } as const satisfies FieldForConvert;
    it("formula can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(42, fieldSchema)).toThrow();
    });
    it("formula should convert to result type for read", () => {
      expect(convertValueFromRead(42, fieldSchema)).toBe(42);
    });
  });
  describe("lastModifiedBy", () => {
    const { type } = FIELDS.LAST_MODIFIED_BY;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("lastModifiedBy can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite({ id: "usr123", email: "test@example.com" }, fieldSchema)).toThrow();
    });
    it("lastModifiedBy should convert to User", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertValueFromRead(user, fieldSchema)).toEqual(user);
    });
  });
  describe("lastModifiedTime", () => {
    const { type } = FIELDS.LAST_MODIFIED_TIME;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("lastModifiedTime can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(new Date(), fieldSchema)).toThrow();
    });
    it("lastModifiedTime should convert to UtcTimestamp", () => {
      const dateStr = "2024-01-15T10:30:00.000Z";
      const result = convertValueFromRead(dateStr, fieldSchema);
      expect(result).toBe(dateStr);
    });
  });
  describe("multilineText", () => {
    const { type } = FIELDS.MULTILINE_TEXT;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("multilineText should convert for write", () => {
      const text = "Line 1\nLine 2\nLine 3";
      expect(convertValueForWrite(text, fieldSchema)).toBe(text);
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("multilineText should convert to string for read", () => {
      const text = "Line 1\nLine 2\nLine 3";
      expect(convertValueFromRead(text, fieldSchema)).toBe(text);
    });
  });
  describe("multipleAttachments", () => {
    const { type } = FIELDS.MULTIPLE_ATTACHMENTS;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("multipleAttachments should convert array for write", () => {
      const attachments = [
        { url: "https://example.com/file1.pdf", filename: "file1.pdf" },
        { url: "https://example.com/file2.png" }
      ];
      const result = convertValueForWrite(attachments, fieldSchema);
      expect(result).toEqual(attachments);
    });
    it("multipleAttachments should handle nullish for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("multipleAttachments should convert to array for read", () => {
      const attachments = [
        { url: "https://example.com/file1.pdf", filename: "file1.pdf" },
        { url: "https://example.com/file2.png" }
      ];
      expect(convertValueFromRead(attachments, fieldSchema)).toEqual(attachments);
    });
  });
  describe("multipleCollaborators", () => {
    const { type } = FIELDS.MULTIPLE_COLLABORATORS;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("multipleCollaborators should convert array for write", () => {
      const users = [
        { id: "usr1", email: "user1@example.com" },
        { id: "usr2", email: "user2@example.com" }
      ];
      expect(convertValueForWrite(users, fieldSchema)).toEqual(users);
    });
    it("multipleCollaborators should handle null/undefined as empty array for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toEqual([]);
      expect(convertValueForWrite(undefined, fieldSchema)).toEqual([]);
    });
    it("multipleCollaborators should convert to array for read", () => {
      const users = [
        { id: "usr1", email: "user1@example.com", name: "User 1" },
        { id: "usr2", email: "user2@example.com", name: "User 2" }
      ];
      expect(convertValueFromRead(users, fieldSchema)).toEqual(users);
    });
  });
  describe("multipleLookupValues", () => {
    const { type, options } = FIELDS.MULTIPLE_LOOKUP_VALUES;
    const fieldSchema = { type, options } as const satisfies FieldForConvert;
    it("multipleLookupValues can't be written to", () => {
      // @ts-expect-error should be never
      expect(() => convertValueForWrite([1, 2, 3], fieldSchema)).toThrow();
    });
    it("multipleLookupValues should convert to array for read", () => {
      const values = ["value1", "value2", "value3"];
      expect(convertValueFromRead(values, fieldSchema)).toEqual(values);
    });
  });
  describe("multipleRecordLinks", () => {
    const { type } = FIELDS.MULTIPLE_RECORD_LINKS;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("multipleRecordLinks should convert array for write", () => {
      const links = ["rec123", "rec456"] as const;
      expect(convertValueForWrite(links, fieldSchema)).toEqual(links);
    });
    it("multipleRecordLinks should typecheck array for write", () => {
      const links = ["not the right format", "foo bar"] as const;
      // @ts-expect-error should be never
      expect(convertValueForWrite(links, fieldSchema)).toEqual(links);
    });
    it("multipleRecordLinks should handle null/undefined as empty array for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toEqual([]);
      expect(convertValueForWrite(undefined, fieldSchema)).toEqual([]);
    });
    it("multipleRecordLinks should convert to array for read", () => {
      const links = ["rec123", "rec456"];
      expect(convertValueFromRead(links, fieldSchema)).toEqual(links);
    });
  });
  describe("multipleSelects", () => {
    const { type, options } = FIELDS.MULTIPLE_SELECTS;
    const fieldSchema = { type, options } as const satisfies FieldForConvert;
    it("multipleSelects should convert choice IDs for write", () => {
      const result = convertValueForWrite(["selGood"], fieldSchema);
      expect(result).toEqual(["selGood"]);
    });
    it("multipleSelects should convert choice names to IDs for write", () => {
      const result = convertValueForWrite(["good", "bad"], fieldSchema);
      expect(result).toEqual(["selGood", "selBad"]);
    });
    it("multipleSelects should handle null/undefined as empty array for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toEqual([]);
      expect(convertValueForWrite(undefined, fieldSchema)).toEqual([]);
    });
    it("multipleSelects should throw on invalid choice for write", () => {
      // @ts-expect-error should be never
      expect(() => convertValueForWrite(["invalid"], fieldSchema)).toThrow();
    });
    it("multipleSelects should convert to array of choices for read", () => {
      expect(convertValueFromRead(["good", "bad"], fieldSchema)).toEqual(["good", "bad"]);
      expect(convertValueFromRead([], fieldSchema)).toEqual([]);
      expect(convertValueFromRead(null, fieldSchema)).toEqual([]);
      expect(convertValueFromRead(undefined, fieldSchema)).toEqual([]);
      expect(() => convertValueFromRead(["selGood"], fieldSchema)).toThrow();
    });
  });
  describe("number", () => {
    const { type } = FIELDS.NUMBER;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("number should convert for write", () => {
      expect(convertValueForWrite(42.5, fieldSchema)).toBe(42.5);
      expect(convertValueFromRead(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
  });
  describe("percent", () => {
    const { type } = FIELDS.PERCENT;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("percent should convert for write", () => {
      expect(convertValueForWrite(0.75, fieldSchema)).toBe(0.75);
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("percent should convert to number for read", () => {
      expect(convertValueFromRead(0.75, fieldSchema)).toBe(0.75);
    });
  });
  describe("phoneNumber", () => {
    const { type } = FIELDS.PHONE_NUMBER;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("phoneNumber should convert for write", () => {
      expect(convertValueForWrite("+1-555-123-4567", fieldSchema)).toBe("+1-555-123-4567");
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("phoneNumber should convert to string for read", () => {
      expect(convertValueFromRead("+1-555-123-4567", fieldSchema)).toBe("+1-555-123-4567");
    });
  });
  describe("rating", () => {
    const { type } = FIELDS.RATING;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("rating should convert for write", () => {
      expect(convertValueForWrite(4, fieldSchema)).toBe(4);
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("rating should convert to number for read", () => {
      expect(convertValueFromRead(4, fieldSchema)).toBe(4);
    });
  });
  describe("richText", () => {
    const { type } = FIELDS.RICH_TEXT;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("richText should convert for write", () => {
      const html = "<p>Rich <strong>text</strong></p>";
      expect(convertValueForWrite(html, fieldSchema)).toBe(html);
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("richText should convert to string for read", () => {
      const html = "<p>Rich <strong>text</strong></p>";
      expect(convertValueFromRead(html, fieldSchema)).toBe(html);
    });
  });
  describe("rollup", () => {
    const { type, options } = FIELDS.ROLLUP;
    const fieldSchema = { type, options } as const satisfies FieldForConvert;
    it("rollup can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(42, fieldSchema)).toThrow();
    });
    it("rollup should pass through value for read", () => {
      expect(convertValueFromRead(42, fieldSchema)).toBe(42);
      expect(convertValueFromRead("text", fieldSchema)).toBe("text");
    });
  });
  describe("singleCollaborator", () => {
    const { type } = FIELDS.SINGLE_COLLABORATOR;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("singleCollaborator should convert user for write", () => {
      const user = { id: "usr123", email: "test@example.com" };
      expect(convertValueForWrite(user, fieldSchema)).toEqual(user);
    });
    it("singleCollaborator should handle nullish for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("singleCollaborator should convert to User for read", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertValueFromRead(user, fieldSchema)).toEqual(user);
    });
  });
  describe("singleLineText", () => {
    const { type } = FIELDS.SINGLE_LINE_TEXT;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("singleLineText should convert for write", () => {
      expect(convertValueForWrite("Hello World", fieldSchema)).toBe("Hello World");
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("singleLineText should convert to string for read", () => {
      expect(convertValueFromRead("Hello World", fieldSchema)).toBe("Hello World");
    });
  });
  describe("singleSelect", () => {
    const { type, options } = FIELDS.SINGLE_SELECT;
    const fieldSchema = { type, options } as const satisfies FieldForConvert;
    it("singleSelect should convert choice ID for write", () => {
      expect(convertValueForWrite("selTodo", fieldSchema)).toBe("selTodo");
    });
    it("singleSelect should convert choice name to ID for write", () => {
      expect(convertValueForWrite("todo", fieldSchema)).toBe("selTodo");
      expect(convertValueForWrite("done", fieldSchema)).toBe("selDone");
    });
    it("singleSelect should handle null for write", () => {
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
    });
    it("singleSelect should handle undefined for write", () => {
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("singleSelect should throw on invalid choice for write", () => {
      // @ts-expect-error should be never
      expect(() => convertValueForWrite("invalid", fieldSchema)).toThrow();
    });
    it("singleSelect should convert choice names for read", () => {
      expect(convertValueFromRead("todo", fieldSchema)).toEqual("todo");
      expect(convertValueFromRead(null, fieldSchema)).toBeNull();
      expect(convertValueFromRead(undefined, fieldSchema)).toBeNull();
      expect(() => convertValueFromRead("selTodo", fieldSchema)).toThrow();
      expect(() => convertValueFromRead("selTodo", fieldSchema)).toThrow();
    });
  });
  describe("url", () => {
    const { type } = FIELDS.URL;
    const fieldSchema = { type } as const satisfies FieldForConvert;
    it("url should convert for write", () => {
      expect(convertValueForWrite("https://example.com", fieldSchema)).toBe("https://example.com");
      expect(convertValueForWrite(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
    it("url should convert to string for read", () => {
      expect(convertValueFromRead("https://example.com", fieldSchema)).toBe("https://example.com");
    });
  });
});