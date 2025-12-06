/**
 * Tests for field to Zod conversion
 */

import { describe, it, expect } from 'vitest';
import { makeFieldWriteValidator } from './field-to-zod.ts';
import * as testFields from '../fields/_example-fields.ts';
import { z } from 'zod';

describe('fieldTypeToZod', () => {
  it('should convert singleLineText to z.string()', () => {
    const schema = makeFieldWriteValidator(testFields.SINGLE_LINE_TEXT);
    expect(z.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "type": "string",
          },
          {
            "type": "null",
          },
        ],
      }
    `)
    expect(schema.parse('test')).toBe('test');
    expect(schema.parse('')).toBe('');
    expect(schema.parse(null)).toBe(null);
    expect(() => schema.parse(123)).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on string
    expect(() => schema.gt(5)).toThrow();
  });

  it('should convert email to z.email()', () => {
    const schema = makeFieldWriteValidator(testFields.EMAIL);
    expect(z.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "format": "email",
            "pattern": "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
            "type": "string",
          },
          {
            "type": "null",
          },
        ],
      }
    `)
    expect(schema.parse('test@example.com')).toBe('test@example.com');
    expect(schema.parse(null)).toBe(null);
    expect(() => schema.parse('invalid')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on string
    expect(() => schema.gt(5)).toThrow();
  });

  it('should convert number to z.number()', () => {
    const schema = makeFieldWriteValidator(testFields.NUMBER);
    expect(z.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "type": "number",
          },
          {
            "type": "null",
          },
        ],
      }
    `)
    expect(schema.parse(123)).toBe(123);
    expect(schema.parse(0)).toBe(0);
    expect(schema.parse(null)).toBe(null);
    expect(() => schema.parse('123')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use length on number
    expect(() => schema.length()).toThrow();
  });

  it('should convert checkbox to z.boolean()', () => {
    const schema = makeFieldWriteValidator(testFields.CHECKBOX);
    expect(z.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "boolean",
      }
    `)
    expect(schema.parse(true)).toBe(true);
    expect(schema.parse(false)).toBe(false);
    expect(() => schema.parse(null)).toThrow();
    expect(() => schema.parse('true')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use length on boolean
    expect(() => schema.length()).toThrow();
  });

  it('should convert singleSelect with choices to z.enum()', () => {
    const schema = makeFieldWriteValidator(testFields.SINGLE_SELECT);
    expect(z.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "enum": [
          "todo",
          "done",
          "selTodo",
          "selDone",
        ],
        "type": "string",
      }
    `)
    expect(schema.parse('todo')).toBe('todo');
    expect(schema.parse('selTodo')).toBe('selTodo');
    expect(() => schema.parse('Bogus')).toThrow();
    expect(() => schema.parse('selBogus')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use length on enum
    expect(() => schema.length()).toThrow();
  });

  it('should convert multipleSelects to z.array(z.enum())', () => {
    const schema = makeFieldWriteValidator(testFields.MULTIPLE_SELECTS);
    expect(z.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "items": {
          "enum": [
            "good",
            "bad",
            "selGood",
            "selBad",
          ],
          "type": "string",
        },
        "type": "array",
      }
    `)
    expect(schema.parse(['good', 'bad', 'selGood'])).toEqual(['good', 'bad', 'selGood']);
    expect(schema.parse([])).toEqual([]);
    expect(() => schema.parse(['Invalid'])).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on array
    expect(() => schema.gt(5)).toThrow();
  });

  it('should convert date to regex pattern', () => {
    const schema = makeFieldWriteValidator(testFields.DATE);
    expect(z.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "format": "date",
            "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
            "type": "string",
          },
          {
            "type": "null",
          },
        ],
      }
    `)
    expect(schema.parse('2024-01-15')).toBe('2024-01-15');
    expect(schema.parse(null)).toBe(null);
    expect(() => schema.parse('01/15/2024')).toThrow();
    expect(() => schema.parse(12345)).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on string
    expect(() => schema.gt(5)).toThrow();
  });

  it('should throw error for rollup (read-only)', () => {
    const schema = makeFieldWriteValidator(testFields.ROLLUP);
    expect(schema.type).toBe('never');
    expect(() => schema.parse('any value')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on never
    expect(() => schema.gt(5)).toThrow();
  });

  it('should throw error for button (read-only)', () => {
    const schema = makeFieldWriteValidator(testFields.BUTTON);
    expect(schema.type).toBe('never');
    expect(() => schema.parse('any value')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on never
    expect(() => schema.gt(5)).toThrow();
  });
});

