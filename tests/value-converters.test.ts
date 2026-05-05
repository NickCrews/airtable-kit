/**
 * Comprehensive tests for value converters
 */

import { describe, expect, it } from "vitest";
import { BarcodeValue, convertValueForWrite, convertValueFromRead, type FieldSchemaForConvert } from "airtable-kit/value-converters";

describe("Value Converters", () => {
  describe("aiText", () => {
    const fieldSchema = { type: 'aiText' } satisfies FieldSchemaForConvert<'aiText'>;
    it("aiText can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite("some slop", fieldSchema)).toThrow();
    });
    it("aiText makeFrom should convert to string", () => {
      expect(convertValueFromRead("Generated AI text", fieldSchema)).toBe("Generated AI text");
    });
  });
  describe("autoNumber", () => {
    const fieldSchema = { type: 'autoNumber' } satisfies FieldSchemaForConvert<'autoNumber'>;
    it("autoNumber can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(42, fieldSchema)).toThrow();
    });
    it("autoNumber makeFrom should convert to number", () => {
      expect(convertValueFromRead(42, fieldSchema)).toBe(42);
    });
  });
  describe("barcode", () => {
    const fieldSchema = { type: 'barcode' } satisfies FieldSchemaForConvert<'barcode'>;
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
    const fieldSchema = { type: 'button' } satisfies FieldSchemaForConvert<'button'>;
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
    const fieldSchema = { type: 'checkbox' } satisfies FieldSchemaForConvert<'checkbox'>;
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
    const fieldSchema = { type: 'count' } satisfies FieldSchemaForConvert<'count'>;
    it("count should can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(42, fieldSchema)).toThrow();
    });
    it("count makeFrom should convert to number", () => {
      expect(convertValueFromRead(42, fieldSchema)).toBe(42);
    });
  });
  describe("createdBy", () => {
    const fieldSchema = { type: 'createdBy' } satisfies FieldSchemaForConvert<'createdBy'>;
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
    const fieldSchema = { type: 'createdTime' } satisfies FieldSchemaForConvert<'createdTime'>;
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
    const fieldSchema = { type: 'currency' } satisfies FieldSchemaForConvert<'currency'>;
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
    const fieldSchema = { type: 'date' } satisfies FieldSchemaForConvert<'date'>;
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
    const fieldSchema = { type: 'dateTime' } satisfies FieldSchemaForConvert<'dateTime'>;
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
    const fieldSchema = { type: 'duration' } satisfies FieldSchemaForConvert<'duration'>;
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
    const fieldSchema = { type: 'email' } satisfies FieldSchemaForConvert<'email'>;
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
    const fieldSchema = { type: 'externalSyncSource' } satisfies FieldSchemaForConvert<'externalSyncSource'>;
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
    const fieldSchema = { type: 'formula', options: { result: { type: 'number' } } } satisfies FieldSchemaForConvert<'formula'>;
    it("formula can't be written to", () => {
      // @ts-expect-error should be null
      expect(() => convertValueForWrite(42, fieldSchema)).toThrow();
    });
    it("formula should convert to result type for read", () => {
      expect(convertValueFromRead(42, fieldSchema)).toBe(42);
    });
  });
  describe("lastModifiedBy", () => {
    const fieldSchema = { type: 'lastModifiedBy' } satisfies FieldSchemaForConvert<'lastModifiedBy'>;
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
    const fieldSchema = { type: 'lastModifiedTime' } satisfies FieldSchemaForConvert<'lastModifiedTime'>;
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
    const fieldSchema = { type: 'multilineText' } satisfies FieldSchemaForConvert<'multilineText'>;
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
    const fieldSchema = { type: 'multipleAttachments' } satisfies FieldSchemaForConvert<'multipleAttachments'>;
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
    const fieldSchema = { type: 'multipleCollaborators' } satisfies FieldSchemaForConvert<'multipleCollaborators'>;
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
    const fieldSchema = { type: 'multipleLookupValues', options: { result: { type: 'singleLineText' } } } satisfies FieldSchemaForConvert;
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
    const fieldSchema = { type: 'multipleRecordLinks' } satisfies FieldSchemaForConvert<'multipleRecordLinks'>;
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
    const fieldSchema = { type: 'multipleSelects', options: { choices: [{ id: "selGood", name: "good" }, { id: "selBad", name: "bad" }] } } as const satisfies FieldSchemaForConvert;
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
    const fieldSchema = { type: 'number' } satisfies FieldSchemaForConvert<'number'>;
    it("number should convert for write", () => {
      expect(convertValueForWrite(42.5, fieldSchema)).toBe(42.5);
      expect(convertValueFromRead(null, fieldSchema)).toBeNull();
      expect(convertValueForWrite(undefined, fieldSchema)).toBeUndefined();
    });
  });
  describe("percent", () => {
    const fieldSchema = { type: 'percent' } satisfies FieldSchemaForConvert<'percent'>;
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
    const fieldSchema = { type: 'phoneNumber' } satisfies FieldSchemaForConvert<'phoneNumber'>;
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
    const fieldSchema = { type: 'rating' } satisfies FieldSchemaForConvert<'rating'>;
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
    const fieldSchema = { type: 'richText' } satisfies FieldSchemaForConvert<'richText'>;
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
    const fieldSchema = { type: 'rollup', options: { result: { type: 'singleLineText' } } } satisfies FieldSchemaForConvert<'rollup'>;
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
    const fieldSchema = { type: 'singleCollaborator' } satisfies FieldSchemaForConvert<'singleCollaborator'>;
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
    const fieldSchema = { type: 'singleLineText' } satisfies FieldSchemaForConvert<'singleLineText'>;
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
    const fieldSchema = {
      type: 'singleSelect',
      options: { choices: [{ id: "selTodo", name: "todo" }, { id: "selDone", name: "done" }] }
    } as const satisfies FieldSchemaForConvert<'singleSelect'>;
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
    const fieldSchema = { type: 'url' } satisfies FieldSchemaForConvert<'url'>;
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