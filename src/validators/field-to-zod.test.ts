/**
 * Tests for field to Zod conversion
 */

import { describe, it, expect } from 'vitest';
import { makeFieldWriteValidator } from './field-to-zod.ts';
import { type FieldSchema } from '../types.ts';

describe('Field to Zod Conversion', () => {
  describe('fieldTypeToZod', () => {
    it('should convert singleLineText to z.string()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Text', type: 'singleLineText' };
      const schema = makeFieldWriteValidator(field);
      expect(schema.type).toBe('string');
      expect(() => schema.parse('test')).not.toThrow();
      expect(() => schema.parse(123)).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use gt on string
      expect(() => schema.gt(5)).toThrow();
    });

    it('should convert email to z.email()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Email', type: 'email' };
      const schema = makeFieldWriteValidator(field);
      expect(schema.type).toBe('string');
      expect(schema.def.format).toBe('email');
      expect(() => schema.parse('test@example.com')).not.toThrow();
      expect(() => schema.parse('invalid')).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use gt on string
      expect(() => schema.gt(5)).toThrow();
    });

    it('should convert number to z.number()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Number', type: 'number' };
      const schema = makeFieldWriteValidator(field);
      expect(() => schema.parse(123)).not.toThrow();
      expect(() => schema.parse('123')).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use length on number
      expect(() => schema.length()).toThrow();
    });

    it('should convert checkbox to z.boolean()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Checkbox', type: 'checkbox' };
      const schema = makeFieldWriteValidator(field);
      expect(() => schema.parse(true)).not.toThrow();
      expect(() => schema.parse('true')).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use length on boolean
      expect(() => schema.length()).toThrow();
    });

    it('should convert singleSelect with choices to z.enum()', () => {
      const field: FieldSchema = {
        id: 'fld1',
        name: 'Status',
        type: 'singleSelect',
        options: {
          choices: [
            { id: 'sel1', name: 'Todo' },
            { id: 'sel2', name: 'Done' },
          ],
        },
      };
      const schema = makeFieldWriteValidator(field);
      expect(() => schema.parse('Todo')).not.toThrow();
      expect(() => schema.parse('Invalid')).toThrow();
      expect(() => schema.parse('sel1')).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use length on enum
      expect(() => schema.length()).toThrow();
    });

    it('should convert multipleSelects to z.array(z.enum())', () => {
      const field: FieldSchema = {
        id: 'fld1',
        name: 'Tags',
        type: 'multipleSelects',
        options: {
          choices: [
            { id: 'sel1', name: 'Tag1' },
            { id: 'sel2', name: 'Tag2' },
          ],
        },
      };
      const schema = makeFieldWriteValidator(field);
      expect(schema.type).toBe('array');
      expect(schema.def.element.type).toBe('enum');
      expect(() => schema.parse(['Tag1', 'Tag2'])).not.toThrow();
      expect(() => schema.parse(['Invalid'])).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use gt on array
      expect(() => schema.gt(5)).toThrow();
    });

    it('should convert date to regex pattern', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Date', type: 'date' };
      const schema = makeFieldWriteValidator(field);
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
      const field: FieldSchema = {
        id: 'fld1',
        name: 'Rollup',
        type: 'rollup',
        options: {
          result: { type: 'number' },
          isValid: true,
        },
      };
      const schema = makeFieldWriteValidator(field);
      expect(schema.type).toBe('never');
      expect(() => schema.parse('any value')).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use gt on never
      expect(() => schema.gt(5)).toThrow();
    });

    it('should throw error for button (read-only)', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Button', type: 'button' };
      const schema = makeFieldWriteValidator(field);
      expect(schema.type).toBe('never');
      expect(() => schema.parse('any value')).toThrow();
      // verify that our type infers correctly
      // @ts-expect-error can't use gt on never
      expect(() => schema.gt(5)).toThrow();
    });
  });
});
