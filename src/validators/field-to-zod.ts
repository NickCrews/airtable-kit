/**
 * Convert Airtable field types to Zod schemas
 */

import { z } from 'zod';
import { type FieldSchema } from '../types.ts';
import { RecordIdSchema } from './index.ts';
import * as fields from '../fields/index.ts';
import * as testFields from '../fields/_example-fields.ts';

const BARCODE_VALIDATOR = z.strictObject({
  text: z.string(),
  type: z.string().optional(),
});
const BOOLEAN_VALIDATOR = z.boolean();
const SINGLE_COLLABORATOR_VALIDATOR = z.strictObject({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
});
const DATE_VALIDATOR = z.iso.date();
const DATE_TIME_VALIDATOR = z.iso.datetime({ local: true });
const EMAIL_VALIDATOR = z.email();
const MULTIPLE_ATTACHMENTS_VALIDATOR = z.array(z.strictObject({
  url: z.url(),
  filename: z.string(),
}));
const MULTIPLE_COLLABORATORS_VALIDATOR = z.array(SINGLE_COLLABORATOR_VALIDATOR);
const MULTIPLE_RECORD_LINKS_VALIDATOR = z.array(RecordIdSchema);
const NUMBER_VALIDATOR = z.number();
const READONLY_VALIDATOR = z.never();
const STRING_VALIDATOR = z.string();
const URL_VALIDATOR = z.url();

type SelectChoiceName<T extends fields.SingleSelect | fields.MultipleSelects> = T extends (fields.SingleSelect<infer C> | fields.MultipleSelects<infer C>) ? C["name"] : never;
type SingleSelectValidator<T extends fields.SingleSelect | fields.MultipleSelects> = z.ZodEnum<{ [K in SelectChoiceName<T>]: K }>;
type MultipleSelectValidator<T extends fields.MultipleSelects> = z.ZodArray<SingleSelectValidator<T>>;

function makeSingleSelectValidator<T extends fields.SingleSelect>(field: T): SingleSelectValidator<T> {
  const values = field.options.choices.map((c) => c.name);
  return z.enum(values) as SingleSelectValidator<T>;
}

function makeMultipleSelectValidator<T extends fields.MultipleSelects>(field: T): MultipleSelectValidator<T> {
  const values = field.options.choices.map((c) => c.name);
  return z.array(z.enum(values)) as MultipleSelectValidator<T>;
}

const writeValidators = {
  aiText: <T extends fields.AiText>(_fieldSchema: T) => READONLY_VALIDATOR,
  autoNumber: <T extends fields.AutoNumber>(_fieldSchema: T) => READONLY_VALIDATOR,
  barcode: <T extends fields.Barcode>(_fieldSchema: T) => BARCODE_VALIDATOR,
  button: <T extends fields.Button>(_fieldSchema: T) => READONLY_VALIDATOR,
  checkbox: <T extends fields.Checkbox>(_fieldSchema: T) => BOOLEAN_VALIDATOR,
  count: <T extends fields.Count>(_fieldSchema: T) => READONLY_VALIDATOR,
  createdBy: <T extends fields.CreatedBy>(_fieldSchema: T) => READONLY_VALIDATOR,
  createdTime: <T extends fields.CreatedTime>(_fieldSchema: T) => READONLY_VALIDATOR,
  currency: <T extends fields.Currency>(_fieldSchema: T) => NUMBER_VALIDATOR,
  date: <T extends fields.Date>(_fieldSchema: T) => DATE_VALIDATOR,
  dateTime: <T extends fields.DateTime>(_fieldSchema: T) => DATE_TIME_VALIDATOR,
  duration: <T extends fields.Duration>(_fieldSchema: T) => NUMBER_VALIDATOR,
  email: <T extends fields.Email>(_fieldSchema: T) => EMAIL_VALIDATOR,
  externalSyncSource: <T extends fields.ExternalSyncSource>(_fieldSchema: T) => z.any(), // todo
  formula: <T extends fields.Formula>(_fieldSchema: T) => READONLY_VALIDATOR,
  lastModifiedBy: <T extends fields.LastModifiedBy>(_fieldSchema: T) => READONLY_VALIDATOR,
  lastModifiedTime: <T extends fields.LastModifiedTime>(_fieldSchema: T) => READONLY_VALIDATOR,
  multilineText: <T extends fields.MultilineText>(_fieldSchema: T) => STRING_VALIDATOR,
  multipleAttachments: <T extends fields.MultipleAttachments>(_fieldSchema: T) => MULTIPLE_ATTACHMENTS_VALIDATOR,
  multipleCollaborators: <T extends fields.MultipleCollaborators>(_fieldSchema: T) => MULTIPLE_COLLABORATORS_VALIDATOR,
  multipleLookupValues: <T extends fields.MultipleLookupValues>(_fieldSchema: T) => READONLY_VALIDATOR,
  multipleRecordLinks: <T extends fields.MultipleRecordLinks>(_fieldSchema: T) => MULTIPLE_RECORD_LINKS_VALIDATOR,
  multipleSelects: makeMultipleSelectValidator,
  number: <T extends fields.Number>(_fieldSchema: T) => NUMBER_VALIDATOR,
  percent: <T extends fields.Percent>(_fieldSchema: T) => NUMBER_VALIDATOR,
  phoneNumber: <T extends fields.PhoneNumber>(_fieldSchema: T) => STRING_VALIDATOR,
  rating: <T extends fields.Rating>(_fieldSchema: T) => NUMBER_VALIDATOR,
  richText: <T extends fields.RichText>(_fieldSchema: T) => STRING_VALIDATOR,
  rollup: <T extends fields.Rollup>(_fieldSchema: T) => READONLY_VALIDATOR,
  singleCollaborator: <T extends fields.SingleCollaborator>(_fieldSchema: T) => SINGLE_COLLABORATOR_VALIDATOR,
  singleLineText: <T extends fields.SingleLineText>(_fieldSchema: T) => STRING_VALIDATOR,
  singleSelect: makeSingleSelectValidator,
  url: <T extends fields.Url>(_fieldSchema: T) => URL_VALIDATOR,
} as const;

export type inferFieldWriteValidator<F extends FieldSchema> =
  F extends fields.AiText ? ReturnType<typeof writeValidators.aiText<F>> :
  F extends fields.AutoNumber ? ReturnType<typeof writeValidators.autoNumber<F>> :
  F extends fields.Barcode ? ReturnType<typeof writeValidators.barcode<F>> :
  F extends fields.Button ? ReturnType<typeof writeValidators.button<F>> :
  F extends fields.Checkbox ? ReturnType<typeof writeValidators.checkbox<F>> :
  F extends fields.Count ? ReturnType<typeof writeValidators.count<F>> :
  F extends fields.CreatedBy ? ReturnType<typeof writeValidators.createdBy<F>> :
  F extends fields.CreatedTime ? ReturnType<typeof writeValidators.createdTime<F>> :
  F extends fields.Currency ? ReturnType<typeof writeValidators.currency<F>> :
  F extends fields.Date ? ReturnType<typeof writeValidators.date<F>> :
  F extends fields.DateTime ? ReturnType<typeof writeValidators.dateTime<F>> :
  F extends fields.Duration ? ReturnType<typeof writeValidators.duration<F>> :
  F extends fields.Email ? ReturnType<typeof writeValidators.email<F>> :
  F extends fields.ExternalSyncSource ? ReturnType<typeof writeValidators.externalSyncSource<F>> :
  F extends fields.Formula ? ReturnType<typeof writeValidators.formula<F>> :
  F extends fields.LastModifiedBy ? ReturnType<typeof writeValidators.lastModifiedBy<F>> :
  F extends fields.LastModifiedTime ? ReturnType<typeof writeValidators.lastModifiedTime<F>> :
  F extends fields.MultilineText ? ReturnType<typeof writeValidators.multilineText<F>> :
  F extends fields.MultipleAttachments ? ReturnType<typeof writeValidators.multipleAttachments<F>> :
  F extends fields.MultipleCollaborators ? ReturnType<typeof writeValidators.multipleCollaborators<F>> :
  F extends fields.MultipleLookupValues ? ReturnType<typeof writeValidators.multipleLookupValues<F>> :
  F extends fields.MultipleRecordLinks ? ReturnType<typeof writeValidators.multipleRecordLinks<F>> :
  F extends fields.MultipleSelects ? ReturnType<typeof writeValidators.multipleSelects<F>> :
  F extends fields.Number ? ReturnType<typeof writeValidators.number<F>> :
  F extends fields.Percent ? ReturnType<typeof writeValidators.percent<F>> :
  F extends fields.PhoneNumber ? ReturnType<typeof writeValidators.phoneNumber<F>> :
  F extends fields.Rating ? ReturnType<typeof writeValidators.rating<F>> :
  F extends fields.RichText ? ReturnType<typeof writeValidators.richText<F>> :
  F extends fields.Rollup ? ReturnType<typeof writeValidators.rollup<F>> :
  F extends fields.SingleCollaborator ? ReturnType<typeof writeValidators.singleCollaborator<F>> :
  F extends fields.SingleLineText ? ReturnType<typeof writeValidators.singleLineText<F>> :
  F extends fields.SingleSelect ? ReturnType<typeof writeValidators.singleSelect<F>> :
  F extends fields.Url ? ReturnType<typeof writeValidators.url<F>> :
  never;

/**
 * Convert a {@link FieldSchema} to a Zod schema that can be used to validate data being written to Airtable.
 */
export function makeFieldWriteValidator<T extends FieldSchema>(field: T): inferFieldWriteValidator<T> {
  const validatorMaker = writeValidators[field.type] as any;
  let validator = validatorMaker(field);
  if (field.description) {
    validator = validator.describe(field.description) as typeof validator;
  }
  return validator;
}

// Examples for testing validator inference
type _aiWriteValidator = inferFieldWriteValidator<typeof testFields.AI_TEXT>;
type _autoNumberWriteValidator = inferFieldWriteValidator<typeof testFields.AUTO_NUMBER>;
type _barcodeWriteValidator = inferFieldWriteValidator<typeof testFields.BARCODE>;
type _buttonWriteValidator = inferFieldWriteValidator<typeof testFields.BUTTON>;
type _checkboxWriteValidator = inferFieldWriteValidator<typeof testFields.CHECKBOX>;
type _countWriteValidator = inferFieldWriteValidator<typeof testFields.COUNT>;
type _createdByWriteValidator = inferFieldWriteValidator<typeof testFields.CREATED_BY>;
type _createdTimeWriteValidator = inferFieldWriteValidator<typeof testFields.CREATED_TIME>;
type _currencyWriteValidator = inferFieldWriteValidator<typeof testFields.CURRENCY>;
type _dateWriteValidator = inferFieldWriteValidator<typeof testFields.DATE>;
type _dateTimeWriteValidator = inferFieldWriteValidator<typeof testFields.DATE_TIME>;
type _durationWriteValidator = inferFieldWriteValidator<typeof testFields.DURATION>;
type _emailWriteValidator = inferFieldWriteValidator<typeof testFields.EMAIL>;
type _externalSyncSourceWriteValidator = inferFieldWriteValidator<typeof testFields.EXTERNAL_SYNC_SOURCE>;
type _formulaWriteValidator = inferFieldWriteValidator<typeof testFields.FORMULA>;
type _lastModifiedByWriteValidator = inferFieldWriteValidator<typeof testFields.LAST_MODIFIED_BY>;
type _lastModifiedTimeWriteValidator = inferFieldWriteValidator<typeof testFields.LAST_MODIFIED_TIME>;
type _multilineTextWriteValidator = inferFieldWriteValidator<typeof testFields.MULTILINE_TEXT>;
type _multipleAttachmentsWriteValidator = inferFieldWriteValidator<typeof testFields.MULTIPLE_ATTACHMENTS>;
type _multipleCollaboratorsWriteValidator = inferFieldWriteValidator<typeof testFields.MULTIPLE_COLLABORATORS>;
type _multipleLookupValuesWriteValidator = inferFieldWriteValidator<typeof testFields.MULTIPLE_LOOKUP_VALUES>;
type _multipleRecordLinksWriteValidator = inferFieldWriteValidator<typeof testFields.MULTIPLE_RECORD_LINKS>;
type _multipleSelectsWriteValidator = inferFieldWriteValidator<typeof testFields.MULTIPLE_SELECTS>;
type _numberWriteValidator = inferFieldWriteValidator<typeof testFields.NUMBER>;
type _percentWriteValidator = inferFieldWriteValidator<typeof testFields.PERCENT>;
type _phoneNumberWriteValidator = inferFieldWriteValidator<typeof testFields.PHONE_NUMBER>;
type _ratingWriteValidator = inferFieldWriteValidator<typeof testFields.RATING>;
type _richTextWriteValidator = inferFieldWriteValidator<typeof testFields.RICH_TEXT>;
type _rollupWriteValidator = inferFieldWriteValidator<typeof testFields.ROLLUP>;
type _singleCollaboratorWriteValidator = inferFieldWriteValidator<typeof testFields.SINGLE_COLLABORATOR>;
type _singleLineTextWriteValidator = inferFieldWriteValidator<typeof testFields.SINGLE_LINE_TEXT>;
type _singleSelectWriteValidator = inferFieldWriteValidator<typeof testFields.SINGLE_SELECT>;
type _urlWriteValidator = inferFieldWriteValidator<typeof testFields.URL>;

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