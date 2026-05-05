/**
 * Convert Airtable field types to Zod schemas
 */

import { z } from 'zod';
import { RecordIdSchema } from './index.ts';
import { FieldSchemaRead } from '../fields/types.ts';

const BARCODE_VALIDATOR = z.strictObject({
  text: z.string().nullable(),
  type: z.string().optional(),
}).nullable();
const BOOLEAN_VALIDATOR = z.boolean(); // NOT nullable, Airtable checkboxes are either true or false
const SINGLE_COLLABORATOR_VALIDATOR = z.strictObject({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
}).nullable();
const DATE_VALIDATOR = z.iso.date().nullable();
const DATE_TIME_VALIDATOR = z.iso.datetime({ local: true }).nullable();
const EMAIL_VALIDATOR = z.email().nullable();
const MULTIPLE_ATTACHMENTS_VALIDATOR = z.array(z.strictObject({
  url: z.url(),
  filename: z.string(),
}));
const MULTIPLE_COLLABORATORS_VALIDATOR = z.array(SINGLE_COLLABORATOR_VALIDATOR);
const MULTIPLE_RECORD_LINKS_VALIDATOR = z.array(RecordIdSchema);
const NUMBER_VALIDATOR = z.number().nullable();
const READONLY_VALIDATOR = z.never();
const STRING_VALIDATOR = z.string().nullable();
const URL_VALIDATOR = z.url().nullable();

type SelectChoiceName<T extends FieldSchemaRead<'singleSelect'> | FieldSchemaRead<'multipleSelects'>> = T extends { options: { choices: ReadonlyArray<{ name: infer N }> } } ? N & string : never;
type SingleSelectValidator<T extends FieldSchemaRead<'singleSelect'> | FieldSchemaRead<'multipleSelects'>> = z.ZodEnum<{ [K in SelectChoiceName<T>]: K }>;
type MultipleSelectValidator<T extends FieldSchemaRead<'multipleSelects'>> = z.ZodArray<SingleSelectValidator<T>>;

function makeSingleSelectValidator<T extends FieldSchemaRead<'singleSelect'>>(field: T): SingleSelectValidator<T> {
  const names = field.options.choices.map((c) => c.name);
  const ids = field.options.choices.map((c) => c.id);
  const allValues = [...names, ...ids];
  return z.enum(allValues) as SingleSelectValidator<T>;
}

function makeMultipleSelectValidator<T extends FieldSchemaRead<'multipleSelects'>>(field: T): MultipleSelectValidator<T> {
  const names = field.options.choices.map((c) => c.name);
  const ids = field.options.choices.map((c) => c.id);
  const allValues = [...names, ...ids];
  return z.array(z.enum(allValues)) as MultipleSelectValidator<T>;
}

const writeValidators = {
  aiText: <T extends FieldSchemaRead<'aiText'>>(fieldSchema: T) => READONLY_VALIDATOR,
  autoNumber: <T extends FieldSchemaRead<'autoNumber'>>(fieldSchema: T) => READONLY_VALIDATOR,
  barcode: <T extends FieldSchemaRead<'barcode'>>(fieldSchema: T) => BARCODE_VALIDATOR,
  button: <T extends FieldSchemaRead<'button'>>(fieldSchema: T) => READONLY_VALIDATOR,
  checkbox: <T extends FieldSchemaRead<'checkbox'>>(fieldSchema: T) => BOOLEAN_VALIDATOR,
  count: <T extends FieldSchemaRead<'count'>>(fieldSchema: T) => READONLY_VALIDATOR,
  createdBy: <T extends FieldSchemaRead<'createdBy'>>(fieldSchema: T) => READONLY_VALIDATOR,
  createdTime: <T extends FieldSchemaRead<'createdTime'>>(fieldSchema: T) => READONLY_VALIDATOR,
  currency: <T extends FieldSchemaRead<'currency'>>(fieldSchema: T) => NUMBER_VALIDATOR,
  date: <T extends FieldSchemaRead<'date'>>(fieldSchema: T) => DATE_VALIDATOR,
  dateTime: <T extends FieldSchemaRead<'dateTime'>>(fieldSchema: T) => DATE_TIME_VALIDATOR,
  duration: <T extends FieldSchemaRead<'duration'>>(fieldSchema: T) => NUMBER_VALIDATOR,
  email: <T extends FieldSchemaRead<'email'>>(fieldSchema: T) => EMAIL_VALIDATOR,
  externalSyncSource: <T extends FieldSchemaRead<'externalSyncSource'>>(fieldSchema: T) => z.any(), // todo
  formula: <T extends FieldSchemaRead<'formula'>>(fieldSchema: T) => READONLY_VALIDATOR,
  lastModifiedBy: <T extends FieldSchemaRead<'lastModifiedBy'>>(fieldSchema: T) => READONLY_VALIDATOR,
  lastModifiedTime: <T extends FieldSchemaRead<'lastModifiedTime'>>(fieldSchema: T) => READONLY_VALIDATOR,
  multilineText: <T extends FieldSchemaRead<'multilineText'>>(fieldSchema: T) => STRING_VALIDATOR,
  multipleAttachments: <T extends FieldSchemaRead<'multipleAttachments'>>(fieldSchema: T) => MULTIPLE_ATTACHMENTS_VALIDATOR,
  multipleCollaborators: <T extends FieldSchemaRead<'multipleCollaborators'>>(fieldSchema: T) => MULTIPLE_COLLABORATORS_VALIDATOR,
  multipleLookupValues: <T extends FieldSchemaRead<'multipleLookupValues'>>(fieldSchema: T) => READONLY_VALIDATOR,
  multipleRecordLinks: <T extends FieldSchemaRead<'multipleRecordLinks'>>(fieldSchema: T) => MULTIPLE_RECORD_LINKS_VALIDATOR,
  multipleSelects: makeMultipleSelectValidator,
  number: <T extends FieldSchemaRead<'number'>>(fieldSchema: T) => NUMBER_VALIDATOR,
  percent: <T extends FieldSchemaRead<'percent'>>(fieldSchema: T) => NUMBER_VALIDATOR,
  phoneNumber: <T extends FieldSchemaRead<'phoneNumber'>>(fieldSchema: T) => STRING_VALIDATOR,
  rating: <T extends FieldSchemaRead<'rating'>>(fieldSchema: T) => NUMBER_VALIDATOR,
  richText: <T extends FieldSchemaRead<'richText'>>(fieldSchema: T) => STRING_VALIDATOR,
  rollup: <T extends FieldSchemaRead<'rollup'>>(fieldSchema: T) => READONLY_VALIDATOR,
  singleCollaborator: <T extends FieldSchemaRead<'singleCollaborator'>>(fieldSchema: T) => SINGLE_COLLABORATOR_VALIDATOR,
  singleLineText: <T extends FieldSchemaRead<'singleLineText'>>(fieldSchema: T) => STRING_VALIDATOR,
  singleSelect: makeSingleSelectValidator,
  url: <T extends FieldSchemaRead<'url'>>(fieldSchema: T) => URL_VALIDATOR,
} as const;

export type InferFieldWriteValidator<F extends FieldSchemaRead> =
  F extends FieldSchemaRead<'aiText'> ? ReturnType<typeof writeValidators.aiText<F>> :
  F extends FieldSchemaRead<'autoNumber'> ? ReturnType<typeof writeValidators.autoNumber<F>> :
  F extends FieldSchemaRead<'barcode'> ? ReturnType<typeof writeValidators.barcode<F>> :
  F extends FieldSchemaRead<'button'> ? ReturnType<typeof writeValidators.button<F>> :
  F extends FieldSchemaRead<'checkbox'> ? ReturnType<typeof writeValidators.checkbox<F>> :
  F extends FieldSchemaRead<'count'> ? ReturnType<typeof writeValidators.count<F>> :
  F extends FieldSchemaRead<'createdBy'> ? ReturnType<typeof writeValidators.createdBy<F>> :
  F extends FieldSchemaRead<'createdTime'> ? ReturnType<typeof writeValidators.createdTime<F>> :
  F extends FieldSchemaRead<'currency'> ? ReturnType<typeof writeValidators.currency<F>> :
  F extends FieldSchemaRead<'date'> ? ReturnType<typeof writeValidators.date<F>> :
  F extends FieldSchemaRead<'dateTime'> ? ReturnType<typeof writeValidators.dateTime<F>> :
  F extends FieldSchemaRead<'duration'> ? ReturnType<typeof writeValidators.duration<F>> :
  F extends FieldSchemaRead<'email'> ? ReturnType<typeof writeValidators.email<F>> :
  F extends FieldSchemaRead<'externalSyncSource'> ? ReturnType<typeof writeValidators.externalSyncSource<F>> :
  F extends FieldSchemaRead<'formula'> ? ReturnType<typeof writeValidators.formula<F>> :
  F extends FieldSchemaRead<'lastModifiedBy'> ? ReturnType<typeof writeValidators.lastModifiedBy<F>> :
  F extends FieldSchemaRead<'lastModifiedTime'> ? ReturnType<typeof writeValidators.lastModifiedTime<F>> :
  F extends FieldSchemaRead<'multilineText'> ? ReturnType<typeof writeValidators.multilineText<F>> :
  F extends FieldSchemaRead<'multipleAttachments'> ? ReturnType<typeof writeValidators.multipleAttachments<F>> :
  F extends FieldSchemaRead<'multipleCollaborators'> ? ReturnType<typeof writeValidators.multipleCollaborators<F>> :
  F extends FieldSchemaRead<'multipleLookupValues'> ? ReturnType<typeof writeValidators.multipleLookupValues<F>> :
  F extends FieldSchemaRead<'multipleRecordLinks'> ? ReturnType<typeof writeValidators.multipleRecordLinks<F>> :
  F extends FieldSchemaRead<'multipleSelects'> ? ReturnType<typeof writeValidators.multipleSelects<F>> :
  F extends FieldSchemaRead<'number'> ? ReturnType<typeof writeValidators.number<F>> :
  F extends FieldSchemaRead<'percent'> ? ReturnType<typeof writeValidators.percent<F>> :
  F extends FieldSchemaRead<'phoneNumber'> ? ReturnType<typeof writeValidators.phoneNumber<F>> :
  F extends FieldSchemaRead<'rating'> ? ReturnType<typeof writeValidators.rating<F>> :
  F extends FieldSchemaRead<'richText'> ? ReturnType<typeof writeValidators.richText<F>> :
  F extends FieldSchemaRead<'rollup'> ? ReturnType<typeof writeValidators.rollup<F>> :
  F extends FieldSchemaRead<'singleCollaborator'> ? ReturnType<typeof writeValidators.singleCollaborator<F>> :
  F extends FieldSchemaRead<'singleLineText'> ? ReturnType<typeof writeValidators.singleLineText<F>> :
  F extends FieldSchemaRead<'singleSelect'> ? ReturnType<typeof writeValidators.singleSelect<F>> :
  F extends FieldSchemaRead<'url'> ? ReturnType<typeof writeValidators.url<F>> :
  never;

/**
 * Convert a {@link FieldSchema} to a Zod schema that can be used to validate data being written to Airtable.
 */
export function makeFieldWriteValidator<T extends FieldSchemaRead>(field: T): InferFieldWriteValidator<T> {
  const validatorMaker = writeValidators[field.type] as any;
  let validator = validatorMaker(field);
  if (field.description) {
    validator = validator.describe(field.description) as typeof validator;
  }
  return validator;
}