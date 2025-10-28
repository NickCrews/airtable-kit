/**
 * Tests for field to Zod conversion
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { fieldTypeToZod, fieldTypeToTS } from './field-to-zod.js';
import type { FieldSchema } from '../schema/types.js';

describe('Field to Zod Conversion', () => {
  describe('fieldTypeToZod', () => {
    it('should convert singleLineText to z.string()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Text', type: 'singleLineText' };
      const schema = fieldTypeToZod(field);
      expect(() => schema.parse('test')).not.toThrow();
      expect(() => schema.parse(123)).toThrow();
    });

    it('should convert email to z.string().email()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Email', type: 'email' };
      const schema = fieldTypeToZod(field);
      expect(() => schema.parse('test@example.com')).not.toThrow();
      expect(() => schema.parse('invalid')).toThrow();
    });

    it('should convert number to z.number()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Number', type: 'number' };
      const schema = fieldTypeToZod(field);
      expect(() => schema.parse(123)).not.toThrow();
      expect(() => schema.parse('123')).toThrow();
    });

    it('should convert checkbox to z.boolean()', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Checkbox', type: 'checkbox' };
      const schema = fieldTypeToZod(field);
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
      const schema = fieldTypeToZod(field);
      expect(() => schema.parse('Todo')).not.toThrow();
      expect(() => schema.parse('Invalid')).toThrow();
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
      const schema = fieldTypeToZod(field);
      expect(() => schema.parse(['Tag1', 'Tag2'])).not.toThrow();
      expect(() => schema.parse(['Invalid'])).toThrow();
    });

    it('should convert date to regex pattern', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Date', type: 'date' };
      const schema = fieldTypeToZod(field);
      expect(() => schema.parse('2024-01-15')).not.toThrow();
      expect(() => schema.parse('01/15/2024')).toThrow();
    });
  });

  describe('fieldTypeToTS', () => {
    it('should convert singleLineText to string', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Text', type: 'singleLineText' };
      expect(fieldTypeToTS(field)).toBe('string');
    });

    it('should convert number to number', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Number', type: 'number' };
      expect(fieldTypeToTS(field)).toBe('number');
    });

    it('should convert checkbox to boolean', () => {
      const field: FieldSchema = { id: 'fld1', name: 'Checkbox', type: 'checkbox' };
      expect(fieldTypeToTS(field)).toBe('boolean');
    });

    it('should convert singleSelect to union type', () => {
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
      expect(fieldTypeToTS(field)).toBe("'Todo' | 'Done'");
    });
  });
});
