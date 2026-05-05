/**
 * Tests for field to Zod conversion
 */

import { describe, it, expect } from 'vitest';
import { makeFieldWriteValidator, InferFieldWriteValidator } from 'airtable-kit/validators';
import * as testFields from './_example-fields.ts';
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



// Examples for testing validator inference
type _aiWriteValidator = InferFieldWriteValidator<typeof testFields.AI_TEXT>;
type _autoNumberWriteValidator = InferFieldWriteValidator<typeof testFields.AUTO_NUMBER>;
type _barcodeWriteValidator = InferFieldWriteValidator<typeof testFields.BARCODE>;
type _buttonWriteValidator = InferFieldWriteValidator<typeof testFields.BUTTON>;
type _checkboxWriteValidator = InferFieldWriteValidator<typeof testFields.CHECKBOX>;
type _countWriteValidator = InferFieldWriteValidator<typeof testFields.COUNT>;
type _createdByWriteValidator = InferFieldWriteValidator<typeof testFields.CREATED_BY>;
type _createdTimeWriteValidator = InferFieldWriteValidator<typeof testFields.CREATED_TIME>;
type _currencyWriteValidator = InferFieldWriteValidator<typeof testFields.CURRENCY>;
type _dateWriteValidator = InferFieldWriteValidator<typeof testFields.DATE>;
type _dateTimeWriteValidator = InferFieldWriteValidator<typeof testFields.DATE_TIME>;
type _durationWriteValidator = InferFieldWriteValidator<typeof testFields.DURATION>;
type _emailWriteValidator = InferFieldWriteValidator<typeof testFields.EMAIL>;
type _externalSyncSourceWriteValidator = InferFieldWriteValidator<typeof testFields.EXTERNAL_SYNC_SOURCE>;
type _formulaWriteValidator = InferFieldWriteValidator<typeof testFields.FORMULA>;
type _lastModifiedByWriteValidator = InferFieldWriteValidator<typeof testFields.LAST_MODIFIED_BY>;
type _lastModifiedTimeWriteValidator = InferFieldWriteValidator<typeof testFields.LAST_MODIFIED_TIME>;
type _multilineTextWriteValidator = InferFieldWriteValidator<typeof testFields.MULTILINE_TEXT>;
type _multipleAttachmentsWriteValidator = InferFieldWriteValidator<typeof testFields.MULTIPLE_ATTACHMENTS>;
type _multipleCollaboratorsWriteValidator = InferFieldWriteValidator<typeof testFields.MULTIPLE_COLLABORATORS>;
type _multipleLookupValuesWriteValidator = InferFieldWriteValidator<typeof testFields.MULTIPLE_LOOKUP_VALUES>;
type _multipleRecordLinksWriteValidator = InferFieldWriteValidator<typeof testFields.MULTIPLE_RECORD_LINKS>;
type _multipleSelectsWriteValidator = InferFieldWriteValidator<typeof testFields.MULTIPLE_SELECTS>;
type _numberWriteValidator = InferFieldWriteValidator<typeof testFields.NUMBER>;
type _percentWriteValidator = InferFieldWriteValidator<typeof testFields.PERCENT>;
type _phoneNumberWriteValidator = InferFieldWriteValidator<typeof testFields.PHONE_NUMBER>;
type _ratingWriteValidator = InferFieldWriteValidator<typeof testFields.RATING>;
type _richTextWriteValidator = InferFieldWriteValidator<typeof testFields.RICH_TEXT>;
type _rollupWriteValidator = InferFieldWriteValidator<typeof testFields.ROLLUP>;
type _singleCollaboratorWriteValidator = InferFieldWriteValidator<typeof testFields.SINGLE_COLLABORATOR>;
type _singleLineTextWriteValidator = InferFieldWriteValidator<typeof testFields.SINGLE_LINE_TEXT>;
type _singleSelectWriteValidator = InferFieldWriteValidator<typeof testFields.SINGLE_SELECT>;
type _urlWriteValidator = InferFieldWriteValidator<typeof testFields.URL>;

// Test inferred ts types
type _aiWriteType = z.infer<_aiWriteValidator>
type _autoNumberWriteType = z.infer<_autoNumberWriteValidator>
type _barcodeWriteType = z.infer<_barcodeWriteValidator>
type _buttonWriteType = z.infer<_buttonWriteValidator>
type _checkboxWriteType = z.infer<_checkboxWriteValidator>
type _countWriteType = z.infer<_countWriteValidator>
type _createdByWriteType = z.infer<_createdByWriteValidator>
type _createdTimeWriteType = z.infer<_createdTimeWriteValidator>
type _currencyWriteType = z.infer<_currencyWriteValidator>
type _dateWriteType = z.infer<_dateWriteValidator>
type _dateTimeWriteType = z.infer<_dateTimeWriteValidator>
type _durationWriteType = z.infer<_durationWriteValidator>
type _emailWriteType = z.infer<_emailWriteValidator>
type _externalSyncSourceWriteType = z.infer<_externalSyncSourceWriteValidator>
type _formulaWriteType = z.infer<_formulaWriteValidator>
type _lastModifiedByWriteType = z.infer<_lastModifiedByWriteValidator>
type _lastModifiedTimeWriteType = z.infer<_lastModifiedTimeWriteValidator>
type _multilineTextWriteType = z.infer<_multilineTextWriteValidator>
type _multipleAttachmentsWriteType = z.infer<_multipleAttachmentsWriteValidator>
type _multipleCollaboratorsWriteType = z.infer<_multipleCollaboratorsWriteValidator>
type _multipleLookupValuesWriteType = z.infer<_multipleLookupValuesWriteValidator>
type _multipleRecordLinksWriteType = z.infer<_multipleRecordLinksWriteValidator>
type _multipleSelectsWriteType = z.infer<_multipleSelectsWriteValidator>
type _numberWriteType = z.infer<_numberWriteValidator>
type _percentWriteType = z.infer<_percentWriteValidator>
type _phoneNumberWriteType = z.infer<_phoneNumberWriteValidator>
type _ratingWriteType = z.infer<_ratingWriteValidator>
type _richTextWriteType = z.infer<_richTextWriteValidator>
type _rollupWriteType = z.infer<_rollupWriteValidator>
type _singleCollaboratorWriteType = z.infer<_singleCollaboratorWriteValidator>
type _singleLineTextWriteType = z.infer<_singleLineTextWriteValidator>
type _singleSelectWriteType = z.infer<_singleSelectWriteValidator>
type _urlWriteType = z.infer<_urlWriteValidator>