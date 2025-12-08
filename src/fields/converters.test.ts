/**
 * Comprehensive tests for converters
 */

import { describe, expect, it } from "vitest";
import { convertValueForWrite, convertValueFromRead } from "./converters.ts";
import * as FIELDS from "./_example-fields.ts";

describe("Converters", () => {
  describe("bogus field schemas", () => {
    it("should throw on read", () => {
      // @ts-expect-error
      expect(() => convertValueFromRead("some value", { type: "bogus" })).toThrow();
    });
    it("should throw on write", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite("some value", { type: "bogus" })).toThrow();
    });
    it("should throw on a real field type but bogus options", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite("format", { type: "singleSelect", options: { choices: ["wrong", "format"] } })).toThrow();
    });
  });
  describe("aiText", () => {
    it("aiText can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite("some slop", { type: "aiText" })).toThrow();
      // @ts-expect-error
      expect(() => convertValueForWrite("some slop", { type: "aiText", bogusField: true })).toThrow();
    });
    it("aiText makeFrom should convert from read", () => {
      const v = { state: "generated" as const, isStale: false, value: "Generated AI text" };
      expect(convertValueFromRead(v, FIELDS.AI_TEXT)).toBe(v);
      expect(convertValueFromRead(v, { type: "aiText" })).toBe(v);
      // @ts-expect-error incorrect type for the options field
      expect(convertValueFromRead(v, { type: "aiText", options: "bogus" })).toBe(v);
    });
  });
  describe("autoNumber", () => {
    it("autoNumber can't be written to", () => {
      // @ts-expect-error autoNumber field is not writable
      expect(() => convertValueForWrite(42, FIELDS.AUTO_NUMBER)).toThrow();
    });
    it("autoNumber should convert from read", () => {
      expect(convertValueFromRead(42, FIELDS.AUTO_NUMBER)).toBe(42);
    });
    it("autoNumber should throw on invalid values on read", () => {
      // @ts-expect-error
      expect(() => convertValueFromRead(null, FIELDS.AUTO_NUMBER)).toThrow();
      // @ts-expect-error
      expect(() => convertValueFromRead("foo", FIELDS.AUTO_NUMBER)).toThrow();
    });
  });
  describe("barcode", () => {
    it("barcode should convert to BarcodeValue for read", () => {
      const value = { text: "123456", type: "upce" };
      expect(convertValueFromRead(value, FIELDS.BARCODE)).toEqual(value);
    });
    it("barcode should convert values for write", () => {
      const value = { text: "123456", type: "upce" };
      expect(convertValueForWrite(value, FIELDS.BARCODE)).toEqual(value);
      expect(convertValueForWrite(null, FIELDS.BARCODE)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.BARCODE)).toBeNull();
    });
    it("barcode should still pass through illegal values", () => {
      // @ts-expect-error invalid barcode type
      expect(convertValueForWrite("123456", FIELDS.BARCODE)).toEqual("123456");
    });
  });
  describe("button", () => {
    it("button can't be read from", () => {
      // @ts-expect-error
      expect(() => convertValueFromRead("some value", { type: "button" })).toThrow();
    });
    it("button can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite("some value", { type: "button" })).toThrow();
    });
  });
  describe("checkbox", () => {
    it("checkbox should convert to boolean for read", () => {
      expect(convertValueFromRead(true, FIELDS.CHECKBOX)).toBe(true);
      expect(convertValueFromRead(false, FIELDS.CHECKBOX)).toBe(false);
    });
    it("checkbox should convert values for write", () => {
      expect(convertValueForWrite(true, FIELDS.CHECKBOX)).toBe(true);
      expect(convertValueForWrite(false, FIELDS.CHECKBOX)).toBe(false);
      expect(convertValueForWrite(null, FIELDS.CHECKBOX)).toBe(false);
      expect(convertValueForWrite(undefined, FIELDS.CHECKBOX)).toBe(false);
    });
  });
  describe("count", () => {
    it("count should can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite(42, FIELDS.COUNT)).toThrow();
    });
    it("count makeFrom should convert to number", () => {
      expect(convertValueFromRead(42, FIELDS.COUNT)).toBe(42);
    });
  });
  describe("createdBy", () => {
    it("createdBy can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite({ id: "usr123", email: "test@example.com" }, FIELDS.CREATED_BY)).toThrow();
    });
    it("createdBy should convert to User", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertValueFromRead(user, FIELDS.CREATED_BY)).toEqual(user);
    });
  });
  describe("createdTime", () => {
    it("createdTime can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite(new Date(), FIELDS.CREATED_TIME)).toThrow();
    });
    it("createdTime should convert to Date", () => {
      const dateStr = "2024-01-15T10:30:00.000Z";
      const result = convertValueFromRead(dateStr, FIELDS.CREATED_TIME);
      expect(result).toBe(dateStr);
    });
  });
  describe("currency", () => {
    it("currency should convert for write", () => {
      expect(convertValueForWrite(99.99, FIELDS.CURRENCY)).toBe(99.99);
      expect(convertValueForWrite(0, FIELDS.CURRENCY)).toBe(0);
      expect(convertValueForWrite(null, FIELDS.CURRENCY)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.CURRENCY)).toBeNull();
    });
    it("currency should convert to number for read", () => {
      expect(convertValueFromRead(99.99, FIELDS.CURRENCY)).toBe(99.99);
      expect(convertValueFromRead(0, FIELDS.CURRENCY)).toBe(0);
      expect(convertValueFromRead(null, FIELDS.CURRENCY)).toBeNull();
    });
  });
  describe("date", () => {
    it("date should convert Date to ISO string for write", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(convertValueForWrite(date, FIELDS.DATE)).toBe("2024-01-15");
    });
    it("date should accept date string for write", () => {
      expect(convertValueForWrite("2024-01-15", FIELDS.DATE)).toBe("2024-01-15");
    });
    it("date for write bad strings should typecheck but pass through", () => {
      // @ts-expect-error invalid date string
      expect(convertValueForWrite("not a date", FIELDS.DATE)).toBe("not a date");
    });
    it("date should handle null for write", () => {
      expect(convertValueForWrite(null, FIELDS.DATE)).toBeNull();
    });
    it("date should handle undefined for write", () => {
      expect(convertValueForWrite(undefined, FIELDS.DATE)).toBeNull();
    });
    it("date should convert to string for read", () => {
      expect(convertValueFromRead("2024-01-15", FIELDS.DATE)).toBe("2024-01-15");
    });
  });
  describe("dateTime", () => {
    it("dateTime should convert Date to ISO string for write", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(convertValueForWrite(date, FIELDS.DATE_TIME)).toBe(date.toISOString());
    });
    it("dateTime should pass through ISO string in UTC for write", () => {
      const isoStr = "2024-01-15T10:30:00.000Z";
      expect(convertValueForWrite(isoStr, FIELDS.DATE_TIME)).toBe(isoStr);
    });
    it("dateTime should pass through ISO string in other timezone for write", () => {
      const isoStr = "2024-01-15T10:30:00-05:00";
      expect(convertValueForWrite(isoStr, FIELDS.DATE_TIME)).toBe(isoStr);
    });
    it("dateTime should pass through ISO string with no timezone for write", () => {
      const isoStr = "2024-01-15T10:30:00";
      expect(convertValueForWrite(isoStr, FIELDS.DATE_TIME)).toBe(isoStr);
    });
    it("dateTime should handle null for write", () => {
      expect(convertValueForWrite(null, FIELDS.DATE_TIME)).toBeNull();
    });
    it("dateTime should handle undefined for write", () => {
      expect(convertValueForWrite(undefined, FIELDS.DATE_TIME)).toBeNull();
    });
    it("dateTime should convert to Date for read", () => {
      const isoStr = "2024-01-15T10:30:00.000Z";
      const result = convertValueFromRead(isoStr, FIELDS.DATE_TIME);
      expect(result).toBe(isoStr);
    });
    it("dateTime should handle null for read", () => {
      expect(convertValueFromRead(null, FIELDS.DATE_TIME)).toBeNull();
    });
  });
  describe("duration", () => {
    it("duration should convert for write", () => {
      expect(convertValueForWrite(3600, FIELDS.DURATION)).toBe(3600);
      expect(convertValueForWrite(0, FIELDS.DURATION)).toBe(0);
      expect(convertValueForWrite(null, FIELDS.DURATION)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.DURATION)).toBeNull();
    });
    it("duration should convert to number for read", () => {
      expect(convertValueFromRead(3600, FIELDS.DURATION)).toBe(3600);
      expect(convertValueFromRead(0, FIELDS.DURATION)).toBe(0);
      expect(convertValueFromRead(null, FIELDS.DURATION)).toBeNull();
      expect(convertValueFromRead(undefined, FIELDS.DURATION)).toBeNull();
    });
  });
  describe("email", () => {
    it("email should convert for write", () => {
      expect(convertValueForWrite("test@example.com", FIELDS.EMAIL)).toBe("test@example.com");
      expect(convertValueForWrite(null, FIELDS.EMAIL)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.EMAIL)).toBeNull();
    });
    it("email should convert to string for read", () => {
      expect(convertValueFromRead("test@example.com", FIELDS.EMAIL)).toBe("test@example.com");
      expect(convertValueFromRead(null, FIELDS.EMAIL)).toBeNull();
      expect(convertValueFromRead(undefined, FIELDS.EMAIL)).toBeNull();
    });
  });
  describe("externalSyncSource", () => {
    it("externalSyncSource should pass through for write", () => {
      const value = { someData: "test" };
      expect(convertValueForWrite(value, FIELDS.EXTERNAL_SYNC_SOURCE)).toEqual(value);
    });
    it("externalSyncSource should pass through for read", () => {
      const value = { someData: "test" };
      expect(convertValueFromRead(value, FIELDS.EXTERNAL_SYNC_SOURCE)).toEqual(value);
    });
  });
  describe("formula", () => {
    describe("formula with checkbox result", () => {
      const checkboxSchema = {
        type: "formula",
        options: { isValid: true, result: { type: "checkbox" } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite(true, checkboxSchema)).toThrow();
      });
      it.fails('for read converts undefined to false', () => {
        // @ts-expect-error
        const result = convertValueFromRead(undefined, checkboxSchema);
        expect(result).toBe(false);
      });
      it("for read should handle true and false", () => {
        let x: boolean | null = convertValueFromRead(true, checkboxSchema);
        expect(x).toBe(true);
        // We should get a type error because the schema says the result is a boolean
        // @ts-expect-error
        let y: string = convertValueFromRead(false, checkboxSchema);
        expect(y).toBe(false);
      });
    });
    describe("formula with number result", () => {
      const numberSchema = {
        type: "formula",
        options: { isValid: true, result: { type: "number" } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite(42, numberSchema)).toThrow();
      });
      it("read should handle numbers", () => {
        let x: number | null = convertValueFromRead(2, numberSchema);
        expect(x).toBe(2);
        // We should get a type error because the schema says the result is nullable
        // @ts-expect-error
        let y: number = convertValueFromRead(0, numberSchema);
        expect(y).toBe(0);
        // We should get a type error because the schema says the result is a number.
        // @ts-expect-error
        let z: string = convertValueFromRead(null, numberSchema);
        expect(z).toBeNull();
      });
    });
    describe("formula with singleLineText result", () => {
      const singleLineTextSchema = {
        type: "formula",
        options: { isValid: true, result: { type: "singleLineText" } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite("hello", singleLineTextSchema)).toThrow();
      });
      it("formula for read should handle singleLineText", () => {
        let x: string | null = convertValueFromRead("hello", singleLineTextSchema);
        expect(x).toBe("hello");
        // We should get a type error because the schema says the result is nullable
        // @ts-expect-error
        let y: string = convertValueFromRead("", singleLineTextSchema);
        expect(y).toBe("");
        // We should get a type error because the schema says the result is a string
        // @ts-expect-error
        let z: number = convertValueFromRead(null, singleLineTextSchema);
        expect(z).toBeNull();
      });
    });
  });
  describe("lastModifiedBy", () => {
    it("lastModifiedBy can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite({ id: "usr123", email: "test@example.com" }, FIELDS.LAST_MODIFIED_BY)).toThrow();
    });
    it("lastModifiedBy should convert to User", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertValueFromRead(user, FIELDS.LAST_MODIFIED_BY)).toEqual(user);
    });
  });
  describe("lastModifiedTime", () => {
    it("lastModifiedTime can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite(new Date(), { type: "lastModifiedTime" })).toThrow();
    });
    it("lastModifiedTime should convert to UtcTimestamp", () => {
      const dateStr = "2024-01-15T10:30:00.000Z";
      const result = convertValueFromRead(dateStr, { type: "lastModifiedTime" });
      expect(result).toBe(dateStr);
    });
  });
  describe("multilineText", () => {
    it("multilineText should convert for write", () => {
      const text = "Line 1\nLine 2\nLine 3";
      expect(convertValueForWrite(text, FIELDS.MULTILINE_TEXT)).toBe(text);
      expect(convertValueForWrite(null, FIELDS.MULTILINE_TEXT)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.MULTILINE_TEXT)).toBeNull();
    });
    it("multilineText should convert to string for read", () => {
      const text = "Line 1\nLine 2\nLine 3";
      expect(convertValueFromRead(text, FIELDS.MULTILINE_TEXT)).toBe(text);
    });
  });
  describe("multipleAttachments", () => {
    it("multipleAttachments should convert array for write", () => {
      const attachments = [
        { url: "https://example.com/file1.pdf", filename: "file1.pdf" },
        { url: "https://example.com/file2.png" }
      ];
      const result = convertValueForWrite(attachments, FIELDS.MULTIPLE_ATTACHMENTS);
      expect(result).toEqual(attachments);
    });
    it("multipleAttachments should handle nullish for write", () => {
      expect(convertValueForWrite(null, FIELDS.MULTIPLE_ATTACHMENTS)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.MULTIPLE_ATTACHMENTS)).toBeNull();
    });
    it("multipleAttachments should convert to array for read", () => {
      const attachments = [
        { id: "att1" as const, url: "https://example.com/file1.pdf", filename: "file1.pdf", type: "application/pdf", size: 12345 },
        { id: "att2" as const, url: "https://example.com/file2.png", filename: "file2.png", type: "application/png", size: 67890 }
      ];
      expect(convertValueFromRead(attachments, FIELDS.MULTIPLE_ATTACHMENTS)).toEqual(attachments);
    });
  });
  describe("multipleCollaborators", () => {
    it("multipleCollaborators should convert array for write", () => {
      const users = [
        { id: "usr1", email: "user1@example.com" },
        { id: "usr2", email: "user2@example.com" }
      ];
      expect(convertValueForWrite(users, FIELDS.MULTIPLE_COLLABORATORS)).toEqual(users);
    });
    it("multipleCollaborators should handle null/undefined as empty array for write", () => {
      expect(convertValueForWrite(null, FIELDS.MULTIPLE_COLLABORATORS)).toEqual([]);
      expect(convertValueForWrite(undefined, FIELDS.MULTIPLE_COLLABORATORS)).toEqual([]);
    });
    it("multipleCollaborators should convert to array for read", () => {
      const users = [
        { id: "usr1", email: "user1@example.com", name: "User 1" },
        { id: "usr2", email: "user2@example.com", name: "User 2" }
      ];
      expect(convertValueFromRead(users, FIELDS.MULTIPLE_COLLABORATORS)).toEqual(users);
    });
  });
  describe("multipleLookupValues", () => {
    describe("multipleLookupValues with checkbox result", () => {
      const checkboxSchema = {
        type: "multipleLookupValues",
        options: { isValid: true, result: { type: "checkbox" } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite([true, false], checkboxSchema)).toThrow();
      });
      it("for read should handle boolean arrays", () => {
        let x: (boolean | null)[] | null = convertValueFromRead([true, false, true], checkboxSchema);
        expect(x).toEqual([true, false, true]);
        // We should get a type error because the schema says the result is a boolean array
        // @ts-expect-error
        let y: string[] = convertValueFromRead([false], checkboxSchema);
        expect(y).toEqual([false]);
      });
      it("for read should handle null", () => {
        let x: (boolean | null)[] | null = convertValueFromRead(null, checkboxSchema);
        expect(x).toEqual([]);
      });
    });
    describe("multipleLookupValues with number result", () => {
      const numberSchema = {
        type: "multipleLookupValues",
        options: { isValid: true, result: { type: "number" } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite([1, 2, 3], numberSchema)).toThrow();
      });
      it("read should handle number arrays", () => {
        let x: (number | null)[] | null = convertValueFromRead([1, 2, null, 3], numberSchema);
        expect(x).toEqual([1, 2, null, 3]);
        // We should get a type error because the schema says the result is a number array
        // @ts-expect-error
        let y: string[] = convertValueFromRead([42], numberSchema);
        expect(y).toEqual([42]);
      });
      it("read should handle null", () => {
        let x: (number | null)[] | null = convertValueFromRead(null, numberSchema);
        expect(x).toEqual([]);
      });
    });
    describe("multipleLookupValues with singleLineText result", () => {
      const singleLineTextSchema = {
        type: "multipleLookupValues",
        options: { isValid: true, result: { type: "singleLineText" } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite(["hello", "world"], singleLineTextSchema)).toThrow();
      });
      it("for read should handle string arrays", () => {
        let x: (string | null)[] | null = convertValueFromRead(["hello", null, "world"], singleLineTextSchema);
        expect(x).toEqual(["hello", null, "world"]);
        // We should get a type error because the schema says the result is a string array
        // @ts-expect-error
        let y: number[] = convertValueFromRead(["test"], singleLineTextSchema);
        expect(y).toEqual(["test"]);
      });
      it("for read should handle null", () => {
        let x: (string | null)[] | null = convertValueFromRead(null, singleLineTextSchema);
        expect(x).toEqual([]);
      });
    });
    it("multipleLookupValues (legacy test) can't be written to", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite([1, 2, 3], FIELDS.MULTIPLE_LOOKUP_VALUES)).toThrow();
    });
    it("multipleLookupValues (legacy test) should convert to array for read", () => {
      const values = ["value1", "value2", "value3"];
      expect(convertValueFromRead(values, FIELDS.MULTIPLE_LOOKUP_VALUES)).toEqual(values);
    });
  });
  describe("multipleRecordLinks", () => {
    it("multipleRecordLinks should convert array for write", () => {
      const links = ["rec123", "rec456"] as const;
      expect(convertValueForWrite(links, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual(links);
    });
    it("multipleRecordLinks should typecheck array for write", () => {
      const links = ["not the right format", "foo bar"] as const;
      // @ts-expect-error should be never
      expect(convertValueForWrite(links, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual(links);
    });
    it("multipleRecordLinks should handle null/undefined as empty array for write", () => {
      expect(convertValueForWrite(null, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual([]);
      expect(convertValueForWrite(undefined, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual([]);
    });
    it("multipleRecordLinks should convert to array for read", () => {
      const links = ["rec123" as const, "rec456" as const];
      expect(convertValueFromRead(links, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual(links);
    });
    it("multipleRecordLinks should typecheck for read of bad values, but pass", () => {
      const links = ["foo" as const, "bar" as const];
      // @ts-expect-error
      expect(convertValueFromRead(links, FIELDS.MULTIPLE_RECORD_LINKS)).toEqual(links);
    });
  });
  describe("multipleSelects", () => {
    it("multipleSelects should convert choice IDs for write", () => {
      const result = convertValueForWrite(["selGood"], FIELDS.MULTIPLE_SELECTS);
      expect(result).toEqual(["selGood"]);
    });
    it("multipleSelects should convert choice names to IDs for write", () => {
      const result = convertValueForWrite(["good", "bad"], FIELDS.MULTIPLE_SELECTS);
      expect(result).toEqual(["selGood", "selBad"]);
    });
    it("multipleSelects should handle null/undefined as empty array for write", () => {
      expect(convertValueForWrite(null, FIELDS.MULTIPLE_SELECTS)).toEqual([]);
      expect(convertValueForWrite(undefined, FIELDS.MULTIPLE_SELECTS)).toEqual([]);
    });
    it("multipleSelects should throw on invalid choice for write", () => {
      // @ts-expect-error should be never
      expect(() => convertValueForWrite(["invalid"], FIELDS.MULTIPLE_SELECTS)).toThrow();
    });
    it("multipleSelects should convert to array of choices for read", () => {
      expect(convertValueFromRead(["good", "bad"], FIELDS.MULTIPLE_SELECTS)).toEqual(["good", "bad"]);
      expect(convertValueFromRead([], FIELDS.MULTIPLE_SELECTS)).toEqual([]);
      expect(convertValueFromRead(null, FIELDS.MULTIPLE_SELECTS)).toEqual([]);
      expect(convertValueFromRead(undefined, FIELDS.MULTIPLE_SELECTS)).toEqual([]);
      expect(() => convertValueFromRead(["selGood"], FIELDS.MULTIPLE_SELECTS)).toThrow();
    });
  });
  describe("number", () => {
    it("number should convert for write", () => {
      expect(convertValueForWrite(42.5, FIELDS.NUMBER)).toBe(42.5);
      expect(convertValueFromRead(null, FIELDS.NUMBER)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.NUMBER)).toBeNull();
    });
  });
  describe("percent", () => {
    it("percent should convert for write", () => {
      expect(convertValueForWrite(0.75, FIELDS.PERCENT)).toBe(0.75);
      expect(convertValueForWrite(null, FIELDS.PERCENT)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.PERCENT)).toBeNull();
    });
    it("percent should convert to number for read", () => {
      expect(convertValueFromRead(0.75, FIELDS.PERCENT)).toBe(0.75);
    });
  });
  describe("phoneNumber", () => {
    it("phoneNumber should convert for write", () => {
      expect(convertValueForWrite("+1-555-123-4567", FIELDS.PHONE_NUMBER)).toBe("+1-555-123-4567");
      expect(convertValueForWrite(null, FIELDS.PHONE_NUMBER)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.PHONE_NUMBER)).toBeNull();
    });
    it("phoneNumber should convert to string for read", () => {
      expect(convertValueFromRead("+1-555-123-4567", FIELDS.PHONE_NUMBER)).toBe("+1-555-123-4567");
    });
  });
  describe("rating", () => {
    it("rating should convert for write", () => {
      expect(convertValueForWrite(4, FIELDS.RATING)).toBe(4);
      expect(convertValueForWrite(null, FIELDS.RATING)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.RATING)).toBeNull();
    });
    it("rating should convert to number for read", () => {
      expect(convertValueFromRead(4, FIELDS.RATING)).toBe(4);
    });
  });
  describe("richText", () => {
    it("richText should convert for write", () => {
      const html = "<p>Rich <strong>text</strong></p>";
      expect(convertValueForWrite(html, FIELDS.RICH_TEXT)).toBe(html);
      expect(convertValueForWrite(null, FIELDS.RICH_TEXT)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.RICH_TEXT)).toBeNull();
    });
    it("richText should convert to string for read", () => {
      const html = "<p>Rich <strong>text</strong></p>";
      expect(convertValueFromRead(html, FIELDS.RICH_TEXT)).toBe(html);
    });
  });
  describe("rollup", () => {
    describe("rollup with checkbox result", () => {
      const checkboxSchema = {
        type: "rollup",
        options: { isValid: true, result: { type: "checkbox" } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite(true, checkboxSchema)).toThrow();
      });
      it("for read should handle true and false", () => {
        let x: boolean | null = convertValueFromRead(true, checkboxSchema);
        expect(x).toBe(true);
        // We should get a type error because the schema says the result is a boolean
        // @ts-expect-error
        let y: string = convertValueFromRead(false, checkboxSchema);
        expect(y).toBe(false);
      });
      it("for read should handle null", () => {
        // We should get a type error because the schema says the result is a boolean
        // @ts-expect-error
        let z: boolean = convertValueFromRead(null, checkboxSchema);
        expect(z).toBeNull();
      });
    });
    describe("rollup with number result", () => {
      const numberSchema = {
        type: "rollup",
        options: { isValid: true as const, result: { type: "number" as const } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite(42, numberSchema)).toThrow();
      });
      it("rollup for read should handle number", () => {
        let x: number | null = convertValueFromRead(42, numberSchema);
        expect(x).toBe(42);
        // We should get a type error because the schema says the result is a number.
        // @ts-expect-error
        let y: string = convertValueFromRead(null, numberSchema);
        expect(y).toBeNull();
      });
    });
    describe("rollup with singleLineText result", () => {
      const singleLineTextSchema = {
        type: "rollup",
        options: { isValid: true as const, result: { type: "singleLineText" as const } }
      } as const
      it("can't be written to", () => {
        // @ts-expect-error
        expect(() => convertValueForWrite("hello", singleLineTextSchema)).toThrow();
      });
      it("rollup for read should handle singleLineText", () => {
        let x: string | null = convertValueFromRead("hello", singleLineTextSchema);
        expect(x).toBe("hello");
        // We should get a type error because the schema says the result is a string
        // @ts-expect-error
        let y: number = convertValueFromRead(null, singleLineTextSchema);
        expect(y).toBeNull();
      });
    });
  });
  describe("singleCollaborator", () => {
    it("singleCollaborator should convert user for write", () => {
      const user = { id: "usr123", email: "test@example.com" };
      expect(convertValueForWrite(user, FIELDS.SINGLE_COLLABORATOR)).toEqual(user);
    });
    it("singleCollaborator should handle nullish for write", () => {
      expect(convertValueForWrite(null, FIELDS.SINGLE_COLLABORATOR)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.SINGLE_COLLABORATOR)).toBeNull();
    });
    it("singleCollaborator should convert to User for read", () => {
      const user = { id: "usr123", email: "test@example.com", name: "Test User" };
      expect(convertValueFromRead(user, FIELDS.SINGLE_COLLABORATOR)).toEqual(user);
    });
  });
  describe("singleLineText", () => {
    it("singleLineText should convert for write", () => {
      expect(convertValueForWrite("Hello World", FIELDS.SINGLE_LINE_TEXT)).toBe("Hello World");
      expect(convertValueForWrite(null, FIELDS.SINGLE_LINE_TEXT)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.SINGLE_LINE_TEXT)).toBeNull();
    });
    it("singleLineText should convert to string for read", () => {
      expect(convertValueFromRead("Hello World", FIELDS.SINGLE_LINE_TEXT)).toBe("Hello World");
    });
  });
  describe("singleSelect", () => {
    it("singleSelect for write should convert choice ID", () => {
      expect(convertValueForWrite("selTodo", FIELDS.SINGLE_SELECT)).toBe("selTodo");
    });
    it("singleSelect for write should convert choice name to ID", () => {
      expect(convertValueForWrite("todo", FIELDS.SINGLE_SELECT)).toBe("selTodo");
      expect(convertValueForWrite("done", FIELDS.SINGLE_SELECT)).toBe("selDone");
    });
    it("singleSelect for write should handle null", () => {
      expect(convertValueForWrite(null, FIELDS.SINGLE_SELECT)).toBeNull();
    });
    it("singleSelect for write should handle undefined", () => {
      expect(convertValueForWrite(undefined, FIELDS.SINGLE_SELECT)).toBeNull();
    });
    it("singleSelect for write should throw on invalid choice", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite("invalid", FIELDS.SINGLE_SELECT)).toThrow();
    });
    it("singleSelect for write should typecheck and error on missing or invalid choices", () => {
      // @ts-expect-error
      expect(() => convertValueForWrite("selTodo", { type: "singleSelect" })).toThrow();
      // @ts-expect-error
      expect(() => convertValueForWrite("selTodo", { type: "singleSelect", options: { choices: 5 } })).toThrow();
    });
    it("singleSelect for read should convert choice names", () => {
      expect(convertValueFromRead("todo", FIELDS.SINGLE_SELECT)).toEqual("todo");
      expect(convertValueFromRead(null, FIELDS.SINGLE_SELECT)).toBeNull();
      expect(convertValueFromRead(undefined, FIELDS.SINGLE_SELECT)).toBeNull();
    });
    it("singleSelect for read should throw on invalid choice", () => {
      // @ts-expect-error
      expect(() => convertValueFromRead("bogus", FIELDS.SINGLE_SELECT)).toThrow();
      // @ts-expect-error
      expect(() => convertValueFromRead("selTodo", FIELDS.SINGLE_SELECT)).toThrow();
    });
  });
  describe("url", () => {
    it("url should convert for write", () => {
      expect(convertValueForWrite("https://example.com", FIELDS.URL)).toBe("https://example.com");
      expect(convertValueForWrite(null, FIELDS.URL)).toBeNull();
      expect(convertValueForWrite(undefined, FIELDS.URL)).toBeNull();
    });
    it("url should convert to string for read", () => {
      expect(convertValueFromRead("https://example.com", FIELDS.URL)).toBe("https://example.com");
    });
  });
});