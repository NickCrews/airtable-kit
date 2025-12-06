/**
 * Comprehensive tests for converters
 */

import { describe, expect, it } from "vitest";
import { BarcodeValue, convertFieldForWrite, convertFieldForRead } from "./converters.ts";
import * as FIELDS from "./_example-fields.ts";

describe("Converters", () => {
  describe("aiText", () => {
    it("aiText can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite("some slop", FIELDS.AI_TEXT)).toThrow();
    });
    it("aiText makeFrom should convert to string", () => {
      expect(convertFieldForRead("Generated AI text", FIELDS.AI_TEXT)).toBe("Generated AI text");
    });
  });
  describe("autoNumber", () => {
    it("autoNumber can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite(42, FIELDS.AUTO_NUMBER)).toThrow();
    });
    it("autoNumber makeFrom should convert to number", () => {
      expect(convertFieldForRead(42, FIELDS.AUTO_NUMBER)).toBe(42);
    });
  });
  describe("barcode", () => {
    it("barcode should convert BarcodeValue for write", () => {
      const value: BarcodeValue = { text: "123456", type: "upce" };
      expect(convertFieldForWrite(value, FIELDS.BARCODE)).toEqual(value);
    });
    it("barcode should handle null for write", () => {
      expect(convertFieldForWrite(null, FIELDS.BARCODE)).toBeNull();
    });
    it("barcode should convert to BarcodeValue for read", () => {
      const value = { text: "123456", type: "upce" };
      expect(convertFieldForRead(value, FIELDS.BARCODE)).toEqual(value);
    });
  });
  describe("button", () => {
    it("button can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite("some value", FIELDS.BUTTON)).toThrow();
    });
    it("button can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite("some value", FIELDS.BUTTON)).toThrow();
    });
  });
  describe("checkbox", () => {
    it("checkbox should convert values for write", () => {
      expect(convertFieldForWrite(true, FIELDS.CHECKBOX)).toBe(true);
      expect(convertFieldForWrite(false, FIELDS.CHECKBOX)).toBe(false);
      expect(convertFieldForWrite(null, FIELDS.CHECKBOX)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.CHECKBOX)).toBeUndefined();
    });
    it("checkbox should convert to boolean for read", () => {
      expect(convertFieldForRead(true, FIELDS.CHECKBOX)).toBe(true);
      expect(convertFieldForRead(false, FIELDS.CHECKBOX)).toBe(false);
    });
  });
  describe("count", () => {
    it("count should can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite(42, FIELDS.COUNT)).toThrow();
    });
    it("count makeFrom should convert to number", () => {
      expect(convertFieldForRead(42, FIELDS.COUNT)).toBe(42);
    });
  });
  describe("createdBy", () => {
    it("createdBy can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite({ id: "usr123", email: "test@example.com" }, FIELDS.CREATED_BY)).toThrow();
    });
    it("createdBy should convert to User", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertFieldForRead(user, FIELDS.CREATED_BY)).toEqual(user);
    });
  });
  describe("createdTime", () => {
    it("createdTime can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite(new Date(), FIELDS.CREATED_TIME)).toThrow();
    });
    it("createdTime should convert to Date", () => {
      const dateStr = "2024-01-15T10:30:00.000Z";
      const result = convertFieldForRead(dateStr, FIELDS.CREATED_TIME);
      expect(result).toBe(dateStr);
    });
  });
  describe("currency", () => {
    it("currency should convert for write", () => {
      expect(convertFieldForWrite(99.99, FIELDS.CURRENCY)).toBe(99.99);
      expect(convertFieldForWrite(null, FIELDS.CURRENCY)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.CURRENCY)).toBeUndefined();
    });
    it("currency should convert to number for read", () => {
      expect(convertFieldForRead(99.99, FIELDS.CURRENCY)).toBe(99.99);
      expect(convertFieldForRead(null, FIELDS.CURRENCY)).toBeNull();
    });
  });
  describe("date", () => {
    it("date should convert Date to ISO string for write", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(convertFieldForWrite(date, FIELDS.DATE)).toBe("2024-01-15");
    });
    it("date should accept date string for write", () => {
      expect(convertFieldForWrite("2024-01-15", FIELDS.DATE)).toBe("2024-01-15");
    });
    it("date should handle null for write", () => {
      expect(convertFieldForWrite(null, FIELDS.DATE)).toBeNull();
    });
    it("date should handle undefined for write", () => {
      expect(convertFieldForWrite(undefined, FIELDS.DATE)).toBeUndefined();
    });
    it("date should convert to string for read", () => {
      expect(convertFieldForRead("2024-01-15", FIELDS.DATE)).toBe("2024-01-15");
    });
  });
  describe("dateTime", () => {
    it("dateTime should convert Date to ISO string for write", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(convertFieldForWrite(date, FIELDS.DATE_TIME)).toBe(date.toISOString());
    });
    it("dateTime should pass through ISO string in UTC for write", () => {
      const isoStr = "2024-01-15T10:30:00.000Z";
      expect(convertFieldForWrite(isoStr, FIELDS.DATE_TIME)).toBe(isoStr);
    });
    it("dateTime should pass through ISO string in other timezone for write", () => {
      const isoStr = "2024-01-15T10:30:00-05:00";
      expect(convertFieldForWrite(isoStr, FIELDS.DATE_TIME)).toBe(isoStr);
    });
    it("dateTime should pass through ISO string with no timezone for write", () => {
      const isoStr = "2024-01-15T10:30:00";
      expect(convertFieldForWrite(isoStr, FIELDS.DATE_TIME)).toBe(isoStr);
    });
    it("dateTime should handle null for write", () => {
      expect(convertFieldForWrite(null, FIELDS.DATE_TIME)).toBeNull();
    });
    it("dateTime should handle undefined for write", () => {
      expect(convertFieldForWrite(undefined, FIELDS.DATE_TIME)).toBeUndefined();
    });
    it("dateTime should convert to Date for read", () => {
      const isoStr = "2024-01-15T10:30:00.000Z";
      const result = convertFieldForRead(isoStr, FIELDS.DATE_TIME);
      expect(result).toBe(isoStr);
    });
    it("dateTime should handle null for read", () => {
      expect(convertFieldForRead(null, FIELDS.DATE_TIME)).toBeNull();
    });
  });
  describe("duration", () => {
    it("duration should convert for write", () => {
      expect(convertFieldForWrite(3600, FIELDS.DURATION)).toBe(3600);
      expect(convertFieldForWrite(null, FIELDS.DURATION)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.DURATION)).toBeUndefined();
    });
    it("duration should convert to number for read", () => {
      expect(convertFieldForRead(3600, FIELDS.DURATION)).toBe(3600);
    });
  });
  describe("email", () => {
    it("email should convert for write", () => {
      expect(convertFieldForWrite("test@example.com", FIELDS.EMAIL)).toBe("test@example.com");
      expect(convertFieldForWrite(null, FIELDS.EMAIL)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.EMAIL)).toBeUndefined();
    });
    it("email should convert to string for read", () => {
      expect(convertFieldForRead("test@example.com", FIELDS.EMAIL)).toBe("test@example.com");
    });
  });
  describe("externalSyncSource", () => {
    it("externalSyncSource should pass through for write", () => {
      const value = { someData: "test" };
      expect(convertFieldForWrite(value, FIELDS.EXTERNAL_SYNC_SOURCE)).toEqual(value);
    });
    it("externalSyncSource should pass through for read", () => {
      const value = { someData: "test" };
      expect(convertFieldForRead(value, FIELDS.EXTERNAL_SYNC_SOURCE)).toEqual(value);
    });
  });
  describe("formula", () => {
    it("formula can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite(42, FIELDS.FORMULA)).toThrow();
    });
    it("formula should convert to result type for read", () => {
      expect(convertFieldForRead(42, FIELDS.FORMULA)).toBe(42);
    });
  });
  describe("lastModifiedBy", () => {
    it("lastModifiedBy can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite({ id: "usr123", email: "test@example.com" }, FIELDS.LAST_MODIFIED_BY)).toThrow();
    });
    it("lastModifiedBy should convert to User", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertFieldForRead(user, FIELDS.LAST_MODIFIED_BY)).toEqual(user);
    });
  });
  describe("lastModifiedTime", () => {
    it("lastModifiedTime can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite(new Date(), FIELDS.LAST_MODIFIED_TIME)).toThrow();
    });
    it("lastModifiedTime should convert to UtcTimestamp", () => {
      const dateStr = "2024-01-15T10:30:00.000Z";
      const result = convertFieldForRead(dateStr, FIELDS.LAST_MODIFIED_TIME);
      expect(result).toBe(dateStr);
    });
  });
  describe("multilineText", () => {
    it("multilineText should convert for write", () => {
      const text = "Line 1\nLine 2\nLine 3";
      expect(convertFieldForWrite(text, FIELDS.MULTILINE_TEXT)).toBe(text);
      expect(convertFieldForWrite(null, FIELDS.MULTILINE_TEXT)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.MULTILINE_TEXT)).toBeUndefined();
    });
    it("multilineText should convert to string for read", () => {
      const text = "Line 1\nLine 2\nLine 3";
      expect(convertFieldForRead(text, FIELDS.MULTILINE_TEXT)).toBe(text);
    });
  });
  describe("multipleAttachments", () => {
    it("multipleAttachments should convert array for write", () => {
      const attachments = [
        { url: "https://example.com/file1.pdf", filename: "file1.pdf" },
        { url: "https://example.com/file2.png" }
      ];
      const result = convertFieldForWrite(attachments, FIELDS.MULTIPLE_ATTACHMENTS);
      expect(result).toEqual(attachments);
    });
    it("multipleAttachments should handle nullish for write", () => {
      expect(convertFieldForWrite(null, FIELDS.MULTIPLE_ATTACHMENTS)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.MULTIPLE_ATTACHMENTS)).toBeUndefined();
    });
    it("multipleAttachments should convert to array for read", () => {
      const attachments = [
        { url: "https://example.com/file1.pdf", filename: "file1.pdf" },
        { url: "https://example.com/file2.png" }
      ];
      expect(convertFieldForRead(attachments, FIELDS.MULTIPLE_ATTACHMENTS)).toEqual(attachments);
    });
  });
  describe("multipleCollaborators", () => {
    it("multipleCollaborators should convert array for write", () => {
      const users = [
        { id: "usr1", email: "user1@example.com" },
        { id: "usr2", email: "user2@example.com" }
      ];
      expect(convertFieldForWrite(users, FIELDS.MULTIPLE_COLLABORATORS)).toEqual(users);
    });
    it("multipleCollaborators should handle null/undefined as empty array for write", () => {
      expect(convertFieldForWrite(null, FIELDS.MULTIPLE_COLLABORATORS)).toEqual([]);
      expect(convertFieldForWrite(undefined, FIELDS.MULTIPLE_COLLABORATORS)).toEqual([]);
    });
    it("multipleCollaborators should convert to array for read", () => {
      const users = [
        { id: "usr1", email: "user1@example.com", name: "User 1" },
        { id: "usr2", email: "user2@example.com", name: "User 2" }
      ];
      expect(convertFieldForRead(users, FIELDS.MULTIPLE_COLLABORATORS)).toEqual(users);
    });
  });
  describe("multipleLookupValues", () => {
    it("multipleLookupValues can't be written to", () => {
      // @ts-expect-error should be never
      expect(() => convertFieldForWrite([1, 2, 3], FIELDS.MULTIPLE_LOOKUP_VALUES)).toThrow();
    });
    it("multipleLookupValues should convert to array for read", () => {
      const values = ["value1", "value2", "value3"];
      expect(convertFieldForRead(values, FIELDS.MULTIPLE_LOOKUP_VALUES)).toEqual(values);
    });
  });
  describe("multipleRecordLinks", () => {
    it("multipleRecordLinks should convert array for write", () => {
      const links = ["rec123", "rec456"] as const;
      expect(convertFieldForWrite(links, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual(links);
    });
    it("multipleRecordLinks should typecheck array for write", () => {
      const links = ["not the right format", "foo bar"] as const;
      // @ts-expect-error should be never
      expect(convertFieldForWrite(links, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual(links);
    });
    it("multipleRecordLinks should handle null/undefined as empty array for write", () => {
      expect(convertFieldForWrite(null, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual([]);
      expect(convertFieldForWrite(undefined, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual([]);
    });
    it("multipleRecordLinks should convert to array for read", () => {
      const links = ["rec123", "rec456"];
      expect(convertFieldForRead(links, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual(links);
    });
  });
  describe("multipleSelects", () => {
    it("multipleSelects should convert choice IDs for write", () => {
      const result = convertFieldForWrite(["selGood"], FIELDS.MULTIPLE_SELECTS);
      expect(result).toEqual(["selGood"]);
    });
    it("multipleSelects should convert choice names to IDs for write", () => {
      const result = convertFieldForWrite(["good", "bad"], FIELDS.MULTIPLE_SELECTS);
      expect(result).toEqual(["selGood", "selBad"]);
    });
    it("multipleSelects should handle null/undefined as empty array for write", () => {
      expect(convertFieldForWrite(null, FIELDS.MULTIPLE_SELECTS)).toEqual([]);
      expect(convertFieldForWrite(undefined, FIELDS.MULTIPLE_SELECTS)).toEqual([]);
    });
    it("multipleSelects should throw on invalid choice for write", () => {
      // @ts-expect-error should be never
      expect(() => convertFieldForWrite(["invalid"], FIELDS.MULTIPLE_SELECTS)).toThrow();
    });
    it("multipleSelects should convert to array of choices for read", () => {
      const choices = [
        { id: "selGood", name: "good", color: "greenLight1" },
        { id: "selBad", name: "bad", color: "redLight1" }
      ];
      expect(convertFieldForRead(choices, FIELDS.MULTIPLE_SELECTS)).toEqual(choices);
    });
  });
  describe("number", () => {
    it("number should convert for write", () => {
      expect(convertFieldForWrite(42.5, FIELDS.NUMBER)).toBe(42.5);
      expect(convertFieldForRead(null, FIELDS.NUMBER)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.NUMBER)).toBeUndefined();
    });
  });
  describe("percent", () => {
    it("percent should convert for write", () => {
      expect(convertFieldForWrite(0.75, FIELDS.PERCENT)).toBe(0.75);
      expect(convertFieldForWrite(null, FIELDS.PERCENT)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.PERCENT)).toBeUndefined();
    });
    it("percent should convert to number for read", () => {
      expect(convertFieldForRead(0.75, FIELDS.PERCENT)).toBe(0.75);
    });
  });
  describe("phoneNumber", () => {
    it("phoneNumber should convert for write", () => {
      expect(convertFieldForWrite("+1-555-123-4567", FIELDS.PHONE_NUMBER)).toBe("+1-555-123-4567");
      expect(convertFieldForWrite(null, FIELDS.PHONE_NUMBER)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.PHONE_NUMBER)).toBeUndefined();
    });
    it("phoneNumber should convert to string for read", () => {
      expect(convertFieldForRead("+1-555-123-4567", FIELDS.PHONE_NUMBER)).toBe("+1-555-123-4567");
    });
  });
  describe("rating", () => {
    it("rating should convert for write", () => {
      expect(convertFieldForWrite(4, FIELDS.RATING)).toBe(4);
      expect(convertFieldForWrite(null, FIELDS.RATING)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.RATING)).toBeUndefined();
    });
    it("rating should convert to number for read", () => {
      expect(convertFieldForRead(4, FIELDS.RATING)).toBe(4);
    });
  });
  describe("richText", () => {
    it("richText should convert for write", () => {
      const html = "<p>Rich <strong>text</strong></p>";
      expect(convertFieldForWrite(html, FIELDS.RICH_TEXT)).toBe(html);
      expect(convertFieldForWrite(null, FIELDS.RICH_TEXT)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.RICH_TEXT)).toBeUndefined();
    });
    it("richText should convert to string for read", () => {
      const html = "<p>Rich <strong>text</strong></p>";
      expect(convertFieldForRead(html, FIELDS.RICH_TEXT)).toBe(html);
    });
  });
  describe("rollup", () => {
    it("rollup can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertFieldForWrite(42, FIELDS.ROLLUP)).toThrow();
    });
    it("rollup should pass through value for read", () => {
      expect(convertFieldForRead(42, FIELDS.ROLLUP)).toBe(42);
      expect(convertFieldForRead("text", FIELDS.ROLLUP)).toBe("text");
    });
  });
  describe("singleCollaborator", () => {
    it("singleCollaborator should convert user for write", () => {
      const user = { id: "usr123", email: "test@example.com" };
      expect(convertFieldForWrite(user, FIELDS.SINGLE_COLLABORATOR)).toEqual(user);
    });
    it("singleCollaborator should handle nullish for write", () => {
      expect(convertFieldForWrite(null, FIELDS.SINGLE_COLLABORATOR)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.SINGLE_COLLABORATOR)).toBeUndefined();
    });
    it("singleCollaborator should convert to User for read", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertFieldForRead(user, FIELDS.SINGLE_COLLABORATOR)).toEqual(user);
    });
  });
  describe("singleLineText", () => {
    it("singleLineText should convert for write", () => {
      expect(convertFieldForWrite("Hello World", FIELDS.SINGLE_LINE_TEXT)).toBe("Hello World");
      expect(convertFieldForWrite(null, FIELDS.SINGLE_LINE_TEXT)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.SINGLE_LINE_TEXT)).toBeUndefined();
    });
    it("singleLineText should convert to string for read", () => {
      expect(convertFieldForRead("Hello World", FIELDS.SINGLE_LINE_TEXT)).toBe("Hello World");
    });
  });
  describe("singleSelect", () => {
    it("singleSelect should convert choice ID for write", () => {
      expect(convertFieldForWrite("selTodo", FIELDS.SINGLE_SELECT)).toBe("selTodo");
    });
    it("singleSelect should convert choice name to ID for write", () => {
      expect(convertFieldForWrite("todo", FIELDS.SINGLE_SELECT)).toBe("selTodo");
      expect(convertFieldForWrite("done", FIELDS.SINGLE_SELECT)).toBe("selDone");
    });
    it("singleSelect should handle null for write", () => {
      expect(convertFieldForWrite(null, FIELDS.SINGLE_SELECT)).toBeNull();
    });
    it("singleSelect should handle undefined for write", () => {
      expect(convertFieldForWrite(undefined, FIELDS.SINGLE_SELECT)).toBeUndefined();
    });
    it("singleSelect should throw on invalid choice for write", () => {
      // @ts-expect-error should be never
      expect(() => convertFieldForWrite("invalid", FIELDS.SINGLE_SELECT)).toThrow();
    });
    it("singleSelect should convert to choice for read", () => {
      const choice = { id: "selTodo", name: "todo", color: "yellowLight1" };
      expect(convertFieldForRead(choice, FIELDS.SINGLE_SELECT)).toEqual(choice);
    });
  });
  describe("url", () => {
    it("url should convert for write", () => {
      expect(convertFieldForWrite("https://example.com", FIELDS.URL)).toBe("https://example.com");
      expect(convertFieldForWrite(null, FIELDS.URL)).toBeNull();
      expect(convertFieldForWrite(undefined, FIELDS.URL)).toBeUndefined();
    });
    it("url should convert to string for read", () => {
      expect(convertFieldForRead("https://example.com", FIELDS.URL)).toBe("https://example.com");
    });
  });
});