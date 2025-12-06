/**
 * Tests for field to Zod conversion
 */

import { describe, it, expect } from 'vitest';
import { makeFieldWriteValidator } from './field-to-zod.ts';
import * as testFields from '../fields/_example-fields.ts';

describe('fieldTypeToZod', () => {
  it('should convert singleLineText to z.string()', () => {
    const schema = makeFieldWriteValidator(testFields.SINGLE_LINE_TEXT);
    expect(schema.type).toBe('string');
    expect(() => schema.parse('test')).not.toThrow();
    expect(() => schema.parse(123)).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on string
    expect(() => schema.gt(5)).toThrow();
  });

  it('should convert email to z.email()', () => {
    const schema = makeFieldWriteValidator(testFields.EMAIL);
    expect(schema.type).toBe('string');
    expect(schema.def.format).toBe('email');
    expect(() => schema.parse('test@example.com')).not.toThrow();
    expect(() => schema.parse('invalid')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on string
    expect(() => schema.gt(5)).toThrow();
  });

  it('should convert number to z.number()', () => {
    const schema = makeFieldWriteValidator(testFields.NUMBER);
    expect(() => schema.parse(123)).not.toThrow();
    expect(() => schema.parse('123')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use length on number
    expect(() => schema.length()).toThrow();
  });

  it('should convert checkbox to z.boolean()', () => {
    const schema = makeFieldWriteValidator(testFields.CHECKBOX);
    expect(() => schema.parse(true)).not.toThrow();
    expect(() => schema.parse('true')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use length on boolean
    expect(() => schema.length()).toThrow();
  });

  it('should convert singleSelect with choices to z.enum()', () => {
    const schema = makeFieldWriteValidator(testFields.SINGLE_SELECT);
    expect(() => schema.parse('todo')).not.toThrow();
    expect(() => schema.parse('selTodo')).not.toThrow();
    expect(() => schema.parse('Bogus')).toThrow();
    expect(() => schema.parse('selBogus')).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use length on enum
    expect(() => schema.length()).toThrow();
  });

  it('should convert multipleSelects to z.array(z.enum())', () => {
    const schema = makeFieldWriteValidator(testFields.MULTIPLE_SELECTS);
    expect(schema.type).toBe('array');
    expect(schema.def.element.type).toBe('enum');
    expect(() => schema.parse(['good', 'bad', 'selGood'])).not.toThrow();
    expect(() => schema.parse(['Invalid'])).toThrow();
    // verify that our type infers correctly
    // @ts-expect-error can't use gt on array
    expect(() => schema.gt(5)).toThrow();
  });

  it('should convert date to regex pattern', () => {
    const schema = makeFieldWriteValidator(testFields.DATE);
    expect(schema.type).toBe('string');
    expect(schema.format).toBe('date');
    expect(schema.parse('2024-01-15')).toBe('2024-01-15');
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

