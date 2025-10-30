/**
 * Tests for field to Zod conversion
 */

import { describe, it, expect } from 'vitest';
import { fieldSchemaToZod } from './field-to-zod.ts';
import { type FieldSchema } from '../types.ts';

describe('Field to Zod Conversion', () => {
  describe('fieldTypeToZod', () => {
    it('should convert singleLineText to z.string()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Text', type: 'singleLineText' };
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse('test')).not.toThrow();
      expect(() => schema.parse(123)).toThrow();
    });

    it('should convert email to z.string().email()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Email', type: 'email' };
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse('test@example.com')).not.toThrow();
      expect(() => schema.parse('invalid')).toThrow();
    });

    it('should convert number to z.number()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Number', type: 'number' };
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse(123)).not.toThrow();
      expect(() => schema.parse('123')).toThrow();
    });

    it('should convert checkbox to z.boolean()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Checkbox', type: 'checkbox' };
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse(true)).not.toThrow();
      expect(() => schema.parse('true')).toThrow();
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
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse('Todo')).not.toThrow();
      expect(() => schema.parse('Invalid')).toThrow();
      expect(() => schema.parse('sel1')).toThrow();
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
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse(['Tag1', 'Tag2'])).not.toThrow();
      expect(() => schema.parse(['Invalid'])).toThrow();
    });

    it('should convert date to regex pattern', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Date', type: 'date' };
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse('2024-01-15')).not.toThrow();
      expect(() => schema.parse('01/15/2024')).toThrow();
    });

    it('should throw error for rollup (read-only)', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Rollup', type: 'rollup' };
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse('any value')).toThrow();
    });

    it('should throw error for button (read-only)', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Button', type: 'button' };
      const schema = fieldSchemaToZod(field);
      expect(() => schema.parse('any value')).toThrow();
    });
  });
});
