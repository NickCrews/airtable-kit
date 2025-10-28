/**
 * Comprehensive tests for converters
 */

import { describe, it, expect } from 'vitest';
import { CONVERTERS, BarcodeValue, MultipleAttachment } from './converters';
import type {
  FieldSchema,
  SingleSelect,
  MultipleSelects,
  SelectChoice,
} from '../schema/fields';

describe('Converters', () => {
  describe('Read-only fields (makeTo returns null)', () => {
    it('aiText should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldAiText',
        name: 'AI Text',
        type: 'aiText',
        options: { state: 'generated', isStale: false, value: null },
      };
      const converter = CONVERTERS.aiText.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('aiText makeFrom should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldAiText',
        name: 'AI Text',
        type: 'aiText',
        options: { state: 'generated', isStale: false, value: null },
      };
      const converter = CONVERTERS.aiText.makeFrom(fieldSchema as any);
      expect(converter('Generated text')).toBe('Generated text');
    });

    it('autoNumber should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldAutoNumber',
        name: 'Auto Number',
        type: 'autoNumber',
      };
      const converter = CONVERTERS.autoNumber.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('autoNumber makeFrom should convert to number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldAutoNumber',
        name: 'Auto Number',
        type: 'autoNumber',
      };
      const converter = CONVERTERS.autoNumber.makeFrom(fieldSchema as any);
      expect(converter(42)).toBe(42);
    });

    it('button should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldButton',
        name: 'Button',
        type: 'button',
      };
      const converter = CONVERTERS.button.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('count should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCount',
        name: 'Count',
        type: 'count',
        options: {},
      };
      const converter = CONVERTERS.count.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('createdBy should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCreatedBy',
        name: 'Created By',
        type: 'createdBy',
      };
      const converter = CONVERTERS.createdBy.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('createdTime should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCreatedTime',
        name: 'Created Time',
        type: 'createdTime',
      };
      const converter = CONVERTERS.createdTime.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('formula should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldFormula',
        name: 'Formula',
        type: 'formula',
        options: {},
      };
      const converter = CONVERTERS.formula.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('lastModifiedBy should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLastModifiedBy',
        name: 'Last Modified By',
        type: 'lastModifiedBy',
      };
      const converter = CONVERTERS.lastModifiedBy.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('lastModifiedTime should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLastModifiedTime',
        name: 'Last Modified Time',
        type: 'lastModifiedTime',
      };
      const converter = CONVERTERS.lastModifiedTime.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });

    it('rollup should be read-only', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldRollup',
        name: 'Rollup',
        type: 'rollup',
        options: {},
      };
      const converter = CONVERTERS.rollup.makeTo(fieldSchema as any);
      expect(converter).toBeNull();
    });
  });

  describe('Barcode', () => {
    it('makeTo should pass through barcode value', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldBarcode',
        name: 'Barcode',
        type: 'barcode',
      };
      const converter = CONVERTERS.barcode.makeTo(fieldSchema as any);
      const barcode: BarcodeValue = { text: '123456789', type: 'ean13' };
      expect(converter(barcode)).toEqual(barcode);
    });

    it('makeFrom should convert to barcode value', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldBarcode',
        name: 'Barcode',
        type: 'barcode',
      };
      const converter = CONVERTERS.barcode.makeFrom(fieldSchema as any);
      const barcode = { text: '123456789', type: 'ean13' };
      expect(converter(barcode)).toEqual(barcode);
    });
  });

  describe('Checkbox', () => {
    it('makeTo should pass through boolean', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCheckbox',
        name: 'Checkbox',
        type: 'checkbox',
        options: {},
      };
      const converter = CONVERTERS.checkbox.makeTo(fieldSchema as any);
      expect(converter(true)).toBe(true);
      expect(converter(false)).toBe(false);
    });

    it('makeFrom should convert to boolean', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCheckbox',
        name: 'Checkbox',
        type: 'checkbox',
        options: {},
      };
      const converter = CONVERTERS.checkbox.makeFrom(fieldSchema as any);
      expect(converter(true)).toBe(true);
      expect(converter(false)).toBe(false);
    });
  });

  describe('Currency', () => {
    it('makeTo should pass through number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCurrency',
        name: 'Currency',
        type: 'currency',
        options: { precision: 2, symbol: '$' },
      };
      const converter = CONVERTERS.currency.makeTo(fieldSchema as any);
      expect(converter(123.45)).toBe(123.45);
    });

    it('makeFrom should convert to number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCurrency',
        name: 'Currency',
        type: 'currency',
        options: { precision: 2, symbol: '$' },
      };
      const converter = CONVERTERS.currency.makeFrom(fieldSchema as any);
      expect(converter(123.45)).toBe(123.45);
    });
  });

  describe('Date', () => {
    it('makeTo should convert Date object to ISO date string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDate',
        name: 'Date',
        type: 'date',
        options: {},
      };
      const converter = CONVERTERS.date.makeTo(fieldSchema as any);
      const date = new Date('2024-03-15T10:30:00Z');
      expect(converter(date)).toBe('2024-03-15');
    });

    it('makeTo should pass through date string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDate',
        name: 'Date',
        type: 'date',
        options: {},
      };
      const converter = CONVERTERS.date.makeTo(fieldSchema as any);
      expect(converter('2024-03-15')).toBe('2024-03-15');
    });

    it('makeFrom should return date string as-is', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDate',
        name: 'Date',
        type: 'date',
        options: {},
      };
      const converter = CONVERTERS.date.makeFrom(fieldSchema as any);
      expect(converter('2024-03-15')).toBe('2024-03-15');
    });
  });

  describe('DateTime', () => {
    it('makeTo should convert Date object to ISO string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDateTime',
        name: 'DateTime',
        type: 'dateTime',
        options: {},
      };
      const converter = CONVERTERS.dateTime.makeTo(fieldSchema as any);
      const date = new Date('2024-03-15T10:30:00Z');
      expect(converter(date)).toBe('2024-03-15T10:30:00.000Z');
    });

    it('makeTo should pass through ISO string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDateTime',
        name: 'DateTime',
        type: 'dateTime',
        options: {},
      };
      const converter = CONVERTERS.dateTime.makeTo(fieldSchema as any);
      const isoString = '2024-03-15T10:30:00.000Z';
      expect(converter(isoString)).toBe(isoString);
    });

    it('makeFrom should convert ISO string to Date object', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDateTime',
        name: 'DateTime',
        type: 'dateTime',
        options: {},
      };
      const converter = CONVERTERS.dateTime.makeFrom(fieldSchema as any);
      const result = converter('2024-03-15T10:30:00.000Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-03-15T10:30:00.000Z');
    });

    it('createdTime makeFrom should convert to Date object', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCreatedTime',
        name: 'Created Time',
        type: 'createdTime',
      };
      const converter = CONVERTERS.createdTime.makeFrom(fieldSchema as any);
      const result = converter('2024-03-15T10:30:00.000Z');
      expect(result).toBeInstanceOf(Date);
    });

    it('lastModifiedTime makeFrom should convert to Date object', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLastModifiedTime',
        name: 'Last Modified Time',
        type: 'lastModifiedTime',
      };
      const converter = CONVERTERS.lastModifiedTime.makeFrom(fieldSchema as any);
      const result = converter('2024-03-15T10:30:00.000Z');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('Duration', () => {
    it('makeTo should pass through number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDuration',
        name: 'Duration',
        type: 'duration',
        options: {},
      };
      const converter = CONVERTERS.duration.makeTo(fieldSchema as any);
      expect(converter(3600)).toBe(3600);
    });

    it('makeFrom should convert to number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDuration',
        name: 'Duration',
        type: 'duration',
        options: {},
      };
      const converter = CONVERTERS.duration.makeFrom(fieldSchema as any);
      expect(converter(3600)).toBe(3600);
    });
  });

  describe('Text fields', () => {
    it('email makeTo should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldEmail',
        name: 'Email',
        type: 'email',
      };
      const converter = CONVERTERS.email.makeTo(fieldSchema as any);
      expect(converter('test@example.com')).toBe('test@example.com');
    });

    it('email makeFrom should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldEmail',
        name: 'Email',
        type: 'email',
      };
      const converter = CONVERTERS.email.makeFrom(fieldSchema as any);
      expect(converter('test@example.com')).toBe('test@example.com');
    });

    it('multilineText makeTo should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldMultilineText',
        name: 'Multiline Text',
        type: 'multilineText',
      };
      const converter = CONVERTERS.multilineText.makeTo(fieldSchema as any);
      expect(converter('Line 1\nLine 2')).toBe('Line 1\nLine 2');
    });

    it('phoneNumber makeTo should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldPhoneNumber',
        name: 'Phone Number',
        type: 'phoneNumber',
      };
      const converter = CONVERTERS.phoneNumber.makeTo(fieldSchema as any);
      expect(converter('+1234567890')).toBe('+1234567890');
    });

    it('richText makeTo should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldRichText',
        name: 'Rich Text',
        type: 'richText',
      };
      const converter = CONVERTERS.richText.makeTo(fieldSchema as any);
      expect(converter('**bold**')).toBe('**bold**');
    });

    it('singleLineText makeTo should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldSingleLineText',
        name: 'Single Line Text',
        type: 'singleLineText',
      };
      const converter = CONVERTERS.singleLineText.makeTo(fieldSchema as any);
      expect(converter('Hello')).toBe('Hello');
    });

    it('url makeTo should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldUrl',
        name: 'URL',
        type: 'url',
      };
      const converter = CONVERTERS.url.makeTo(fieldSchema as any);
      expect(converter('https://example.com')).toBe('https://example.com');
    });
  });

  describe('Number fields', () => {
    it('number makeTo should pass through number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldNumber',
        name: 'Number',
        type: 'number',
        options: {},
      };
      const converter = CONVERTERS.number.makeTo(fieldSchema as any);
      expect(converter(42)).toBe(42);
      expect(converter(3.14)).toBe(3.14);
    });

    it('percent makeTo should pass through number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldPercent',
        name: 'Percent',
        type: 'percent',
        options: {},
      };
      const converter = CONVERTERS.percent.makeTo(fieldSchema as any);
      expect(converter(0.75)).toBe(0.75);
    });

    it('rating makeTo should pass through number', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldRating',
        name: 'Rating',
        type: 'rating',
        options: {},
      };
      const converter = CONVERTERS.rating.makeTo(fieldSchema as any);
      expect(converter(5)).toBe(5);
    });
  });

  describe('MultipleAttachments', () => {
    it('makeTo should preserve url and filename', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldAttachments',
        name: 'Attachments',
        type: 'multipleAttachments',
        options: {},
      };
      const converter = CONVERTERS.multipleAttachments.makeTo(fieldSchema as any);
      const attachments: MultipleAttachment = [
        { url: 'https://example.com/file1.pdf', filename: 'file1.pdf' },
        { url: 'https://example.com/file2.jpg', filename: 'file2.jpg' },
      ];
      const result = converter(attachments);
      expect(result).toEqual(attachments);
    });

    it('makeFrom should convert to attachment array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldAttachments',
        name: 'Attachments',
        type: 'multipleAttachments',
        options: {},
      };
      const converter = CONVERTERS.multipleAttachments.makeFrom(fieldSchema as any);
      const attachments = [
        { url: 'https://example.com/file1.pdf', filename: 'file1.pdf' },
      ];
      expect(converter(attachments)).toEqual(attachments);
    });
  });

  describe('MultipleCollaborators', () => {
    it('makeTo should pass through user array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCollaborators',
        name: 'Collaborators',
        type: 'multipleCollaborators',
      };
      const converter = CONVERTERS.multipleCollaborators.makeTo(fieldSchema as any);
      const users = [
        { id: 'usr1', email: 'user1@example.com', name: 'User 1' },
        { id: 'usr2', email: 'user2@example.com', name: 'User 2' },
      ];
      expect(converter(users)).toEqual(users);
    });

    it('makeFrom should convert to user array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCollaborators',
        name: 'Collaborators',
        type: 'multipleCollaborators',
      };
      const converter = CONVERTERS.multipleCollaborators.makeFrom(fieldSchema as any);
      const users = [
        { id: 'usr1', email: 'user1@example.com', name: 'User 1' },
      ];
      expect(converter(users)).toEqual(users);
    });
  });

  describe('MultipleLookupValues', () => {
    it('makeTo should pass through unknown array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLookup',
        name: 'Lookup',
        type: 'multipleLookupValues',
        options: {},
      };
      const converter = CONVERTERS.multipleLookupValues.makeTo(fieldSchema as any);
      const values = ['value1', 'value2', 123];
      expect(converter(values)).toEqual(values);
    });

    it('makeFrom should convert to unknown array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLookup',
        name: 'Lookup',
        type: 'multipleLookupValues',
        options: {},
      };
      const converter = CONVERTERS.multipleLookupValues.makeFrom(fieldSchema as any);
      const values = ['value1', 'value2'];
      expect(converter(values)).toEqual(values);
    });
  });

  describe('MultipleRecordLinks', () => {
    it('makeTo should pass through string array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLinks',
        name: 'Links',
        type: 'multipleRecordLinks',
        options: {},
      };
      const converter = CONVERTERS.multipleRecordLinks.makeTo(fieldSchema as any);
      const links = ['rec1', 'rec2', 'rec3'];
      expect(converter(links)).toEqual(links);
    });

    it('makeFrom should convert to string array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLinks',
        name: 'Links',
        type: 'multipleRecordLinks',
        options: {},
      };
      const converter = CONVERTERS.multipleRecordLinks.makeFrom(fieldSchema as any);
      const links = ['rec1', 'rec2'];
      expect(converter(links)).toEqual(links);
    });
  });

  describe('MultipleSelects', () => {
    const fieldSchema: MultipleSelects = {
      id: 'fldMultiSelect',
      name: 'Multi Select',
      type: 'multipleSelects',
      options: {
        choices: [
          { id: 'sel1', name: 'Option 1', color: 'blue' },
          { id: 'sel2', name: 'Option 2', color: 'green' },
          { id: 'sel3', name: 'Option 3', color: 'red' },
        ],
      },
    };

    it('makeTo should convert option names to IDs', () => {
      const converter = CONVERTERS.multipleSelects.makeTo(fieldSchema);
      const result = converter(['Option 1', 'Option 3']);
      expect(result).toEqual(['sel1', 'sel3']);
    });

    it('makeTo should pass through IDs', () => {
      const converter = CONVERTERS.multipleSelects.makeTo(fieldSchema);
      const result = converter(['sel1', 'sel2']);
      expect(result).toEqual(['sel1', 'sel2']);
    });

    it('makeTo should handle mix of IDs and names', () => {
      const converter = CONVERTERS.multipleSelects.makeTo(fieldSchema);
      const result = converter(['sel1', 'Option 2', 'sel3']);
      expect(result).toEqual(['sel1', 'sel2', 'sel3']);
    });

    it('makeTo should throw error for invalid option', () => {
      const converter = CONVERTERS.multipleSelects.makeTo(fieldSchema);
      expect(() => converter(['Invalid Option'])).toThrow(
        'No option found for value: Invalid Option'
      );
    });

    it('makeFrom should convert to choice array', () => {
      const converter = CONVERTERS.multipleSelects.makeFrom(fieldSchema);
      const choices = [
        { id: 'sel1', name: 'Option 1', color: 'blue' },
        { id: 'sel2', name: 'Option 2', color: 'green' },
      ];
      expect(converter(choices)).toEqual(choices);
    });
  });

  describe('SingleSelect', () => {
    const fieldSchema: SingleSelect = {
      id: 'fldSingleSelect',
      name: 'Single Select',
      type: 'singleSelect',
      options: {
        choices: [
          { id: 'sel1', name: 'Option 1', color: 'blue' },
          { id: 'sel2', name: 'Option 2', color: 'green' },
          { id: 'sel3', name: 'Option 3', color: 'red' },
        ],
      },
    };

    it('makeTo should convert option name to ID', () => {
      const converter = CONVERTERS.singleSelect.makeTo(fieldSchema);
      const result = converter('Option 1');
      expect(result).toBe('sel1');
    });

    it('makeTo should pass through ID', () => {
      const converter = CONVERTERS.singleSelect.makeTo(fieldSchema);
      const result = converter('sel2');
      expect(result).toBe('sel2');
    });

    it('makeTo should throw error for invalid option', () => {
      const converter = CONVERTERS.singleSelect.makeTo(fieldSchema);
      expect(() => converter('Invalid Option')).toThrow(
        "No option found for value 'Invalid Option' in field 'Single Select'"
      );
    });

    it('makeTo error should list available options', () => {
      const converter = CONVERTERS.singleSelect.makeTo(fieldSchema);
      expect(() => converter('Invalid')).toThrow(
        'Available options: Option 1, Option 2, Option 3, sel1, sel2, sel3'
      );
    });

    it('makeFrom should convert to choice object', () => {
      const converter = CONVERTERS.singleSelect.makeFrom(fieldSchema);
      const choice = { id: 'sel1', name: 'Option 1', color: 'blue' };
      expect(converter(choice)).toEqual(choice);
    });
  });

  describe('SingleCollaborator', () => {
    it('makeTo should pass through user write object', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCollaborator',
        name: 'Collaborator',
        type: 'singleCollaborator',
      };
      const converter = CONVERTERS.singleCollaborator.makeTo(fieldSchema as any);
      const user = { id: 'usr1', email: 'user@example.com' };
      expect(converter(user)).toEqual(user);
    });

    it('makeFrom should convert to user object', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCollaborator',
        name: 'Collaborator',
        type: 'singleCollaborator',
      };
      const converter = CONVERTERS.singleCollaborator.makeFrom(fieldSchema as any);
      const user = { id: 'usr1', email: 'user@example.com', name: 'User 1' };
      expect(converter(user)).toEqual(user);
    });
  });

  describe('User fields', () => {
    it('createdBy makeFrom should convert to user object', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCreatedBy',
        name: 'Created By',
        type: 'createdBy',
      };
      const converter = CONVERTERS.createdBy.makeFrom(fieldSchema as any);
      const user = { id: 'usr1', email: 'user@example.com', name: 'User 1' };
      expect(converter(user)).toEqual(user);
    });

    it('lastModifiedBy makeFrom should convert to user object', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldLastModifiedBy',
        name: 'Last Modified By',
        type: 'lastModifiedBy',
      };
      const converter = CONVERTERS.lastModifiedBy.makeFrom(fieldSchema as any);
      const user = { id: 'usr1', email: 'user@example.com' };
      expect(converter(user)).toEqual(user);
    });
  });

  describe('ExternalSyncSource', () => {
    it('makeTo should pass through value', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldSync',
        name: 'Sync Source',
        type: 'externalSyncSource',
        options: { choices: [] },
      };
      const converter = CONVERTERS.externalSyncSource.makeTo(fieldSchema as any);
      const value = { someData: 'test' };
      expect(converter(value)).toEqual(value);
    });

    it('makeFrom should pass through value', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldSync',
        name: 'Sync Source',
        type: 'externalSyncSource',
        options: { choices: [] },
      };
      const converter = CONVERTERS.externalSyncSource.makeFrom(fieldSchema as any);
      const value = { someData: 'test' };
      expect(converter(value)).toEqual(value);
    });
  });

  describe('Formula and Rollup', () => {
    it('formula makeFrom should convert to string', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldFormula',
        name: 'Formula',
        type: 'formula',
        options: {},
      };
      const converter = CONVERTERS.formula.makeFrom(fieldSchema as any);
      expect(converter('calculated value')).toBe('calculated value');
    });

    it('rollup makeFrom should return value as-is', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldRollup',
        name: 'Rollup',
        type: 'rollup',
        options: {},
      };
      const converter = CONVERTERS.rollup.makeFrom(fieldSchema as any);
      expect(converter(42)).toBe(42);
      expect(converter('text')).toBe('text');
      expect(converter([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty attachment array', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldAttachments',
        name: 'Attachments',
        type: 'multipleAttachments',
        options: {},
      };
      const converter = CONVERTERS.multipleAttachments.makeTo(fieldSchema as any);
      expect(converter([])).toEqual([]);
    });

    it('should handle empty multipleSelects array', () => {
      const fieldSchema: MultipleSelects = {
        id: 'fldMultiSelect',
        name: 'Multi Select',
        type: 'multipleSelects',
        options: {
          choices: [
            { id: 'sel1', name: 'Option 1', color: 'blue' },
          ],
        },
      };
      const converter = CONVERTERS.multipleSelects.makeTo(fieldSchema);
      expect(converter([])).toEqual([]);
    });

    it('should handle zero for number fields', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldNumber',
        name: 'Number',
        type: 'number',
        options: {},
      };
      const converter = CONVERTERS.number.makeTo(fieldSchema as any);
      expect(converter(0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldCurrency',
        name: 'Currency',
        type: 'currency',
        options: {},
      };
      const converter = CONVERTERS.currency.makeTo(fieldSchema as any);
      expect(converter(-100.50)).toBe(-100.50);
    });

    it('should handle dates at midnight UTC', () => {
      const fieldSchema: FieldSchema = {
        id: 'fldDate',
        name: 'Date',
        type: 'date',
        options: {},
      };
      const converter = CONVERTERS.date.makeTo(fieldSchema as any);
      const date = new Date('2024-03-15T00:00:00Z');
      expect(converter(date)).toBe('2024-03-15');
    });
  });
});
