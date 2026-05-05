/**
 * Convert Airtable field types to Zod schemas
 */

import { z } from 'zod';
import { RecordIdSchema } from './index.ts';
import * as f from '../fields/types.ts';

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

type SelectChoiceName<T extends f.SingleSelectSchemaRead | f.MultipleSelectsSchemaRead> = T extends (f.SingleSelectSchemaRead<infer C> | f.MultipleSelectsSchemaRead<infer C>) ? C["name"] : never;
type SingleSelectValidator<T extends f.SingleSelectSchemaRead | f.MultipleSelectsSchemaRead> = z.ZodEnum<{ [K in SelectChoiceName<T>]: K }>;
type MultipleSelectValidator<T extends f.MultipleSelectsSchemaRead> = z.ZodArray<SingleSelectValidator<T>>;

function makeSingleSelectValidator<T extends f.SingleSelectSchemaRead>(field: T): SingleSelectValidator<T> {
  const names = field.options.choices.map((c) => c.name);
  const ids = field.options.choices.map((c) => c.id);
  const allValues = [...names, ...ids];
  return z.enum(allValues) as SingleSelectValidator<T>;
}

function makeMultipleSelectValidator<T extends f.MultipleSelectsSchemaRead>(field: T): MultipleSelectValidator<T> {
  const names = field.options.choices.map((c) => c.name);
  const ids = field.options.choices.map((c) => c.id);
  const allValues = [...names, ...ids];
  return z.array(z.enum(allValues)) as MultipleSelectValidator<T>;
}

const writeValidators = {
  aiText: <T extends f.AiTextSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  autoNumber: <T extends f.AutoNumberSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  barcode: <T extends f.BarcodeSchemaRead>(fieldSchema: T) => BARCODE_VALIDATOR,
  button: <T extends f.ButtonSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  checkbox: <T extends f.CheckboxSchemaRead>(fieldSchema: T) => BOOLEAN_VALIDATOR,
  count: <T extends f.CountSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  createdBy: <T extends f.CreatedBySchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  createdTime: <T extends f.CreatedTimeSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  currency: <T extends f.CurrencySchemaRead>(fieldSchema: T) => NUMBER_VALIDATOR,
  date: <T extends f.DateSchemaRead>(fieldSchema: T) => DATE_VALIDATOR,
  dateTime: <T extends f.DateTimeSchemaRead>(fieldSchema: T) => DATE_TIME_VALIDATOR,
  duration: <T extends f.DurationSchemaRead>(fieldSchema: T) => NUMBER_VALIDATOR,
  email: <T extends f.EmailSchemaRead>(fieldSchema: T) => EMAIL_VALIDATOR,
  externalSyncSource: <T extends f.ExternalSyncSourceSchemaRead>(fieldSchema: T) => z.any(), // todo
  formula: <T extends f.FormulaSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  lastModifiedBy: <T extends f.LastModifiedBySchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  lastModifiedTime: <T extends f.LastModifiedTimeSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  multilineText: <T extends f.MultilineTextSchemaRead>(fieldSchema: T) => STRING_VALIDATOR,
  multipleAttachments: <T extends f.MultipleAttachmentsSchemaRead>(fieldSchema: T) => MULTIPLE_ATTACHMENTS_VALIDATOR,
  multipleCollaborators: <T extends f.MultipleCollaboratorsSchemaRead>(fieldSchema: T) => MULTIPLE_COLLABORATORS_VALIDATOR,
  multipleLookupValues: <T extends f.MultipleLookupValuesSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  multipleRecordLinks: <T extends f.MultipleRecordLinksSchemaRead>(fieldSchema: T) => MULTIPLE_RECORD_LINKS_VALIDATOR,
  multipleSelects: makeMultipleSelectValidator,
  number: <T extends f.NumberSchemaRead>(fieldSchema: T) => NUMBER_VALIDATOR,
  percent: <T extends f.PercentSchemaRead>(fieldSchema: T) => NUMBER_VALIDATOR,
  phoneNumber: <T extends f.PhoneNumberSchemaRead>(fieldSchema: T) => STRING_VALIDATOR,
  rating: <T extends f.RatingSchemaRead>(fieldSchema: T) => NUMBER_VALIDATOR,
  richText: <T extends f.RichTextSchemaRead>(fieldSchema: T) => STRING_VALIDATOR,
  rollup: <T extends f.RollupSchemaRead>(fieldSchema: T) => READONLY_VALIDATOR,
  singleCollaborator: <T extends f.SingleCollaboratorSchemaRead>(fieldSchema: T) => SINGLE_COLLABORATOR_VALIDATOR,
  singleLineText: <T extends f.SingleLineTextSchemaRead>(fieldSchema: T) => STRING_VALIDATOR,
  singleSelect: makeSingleSelectValidator,
  url: <T extends f.UrlSchemaRead>(fieldSchema: T) => URL_VALIDATOR,
} as const;

export type InferFieldWriteValidator<F extends f.FieldSchemaRead> =
  F extends f.AiTextSchemaRead ? ReturnType<typeof writeValidators.aiText<F>> :
  F extends f.AutoNumberSchemaRead ? ReturnType<typeof writeValidators.autoNumber<F>> :
  F extends f.BarcodeSchemaRead ? ReturnType<typeof writeValidators.barcode<F>> :
  F extends f.ButtonSchemaRead ? ReturnType<typeof writeValidators.button<F>> :
  F extends f.CheckboxSchemaRead ? ReturnType<typeof writeValidators.checkbox<F>> :
  F extends f.CountSchemaRead ? ReturnType<typeof writeValidators.count<F>> :
  F extends f.CreatedBySchemaRead ? ReturnType<typeof writeValidators.createdBy<F>> :
  F extends f.CreatedTimeSchemaRead ? ReturnType<typeof writeValidators.createdTime<F>> :
  F extends f.CurrencySchemaRead ? ReturnType<typeof writeValidators.currency<F>> :
  F extends f.DateSchemaRead ? ReturnType<typeof writeValidators.date<F>> :
  F extends f.DateTimeSchemaRead ? ReturnType<typeof writeValidators.dateTime<F>> :
  F extends f.DurationSchemaRead ? ReturnType<typeof writeValidators.duration<F>> :
  F extends f.EmailSchemaRead ? ReturnType<typeof writeValidators.email<F>> :
  F extends f.ExternalSyncSourceSchemaRead ? ReturnType<typeof writeValidators.externalSyncSource<F>> :
  F extends f.FormulaSchemaRead ? ReturnType<typeof writeValidators.formula<F>> :
  F extends f.LastModifiedBySchemaRead ? ReturnType<typeof writeValidators.lastModifiedBy<F>> :
  F extends f.LastModifiedTimeSchemaRead ? ReturnType<typeof writeValidators.lastModifiedTime<F>> :
  F extends f.MultilineTextSchemaRead ? ReturnType<typeof writeValidators.multilineText<F>> :
  F extends f.MultipleAttachmentsSchemaRead ? ReturnType<typeof writeValidators.multipleAttachments<F>> :
  F extends f.MultipleCollaboratorsSchemaRead ? ReturnType<typeof writeValidators.multipleCollaborators<F>> :
  F extends f.MultipleLookupValuesSchemaRead ? ReturnType<typeof writeValidators.multipleLookupValues<F>> :
  F extends f.MultipleRecordLinksSchemaRead ? ReturnType<typeof writeValidators.multipleRecordLinks<F>> :
  F extends f.MultipleSelectsSchemaRead ? ReturnType<typeof writeValidators.multipleSelects<F>> :
  F extends f.NumberSchemaRead ? ReturnType<typeof writeValidators.number<F>> :
  F extends f.PercentSchemaRead ? ReturnType<typeof writeValidators.percent<F>> :
  F extends f.PhoneNumberSchemaRead ? ReturnType<typeof writeValidators.phoneNumber<F>> :
  F extends f.RatingSchemaRead ? ReturnType<typeof writeValidators.rating<F>> :
  F extends f.RichTextSchemaRead ? ReturnType<typeof writeValidators.richText<F>> :
  F extends f.RollupSchemaRead ? ReturnType<typeof writeValidators.rollup<F>> :
  F extends f.SingleCollaboratorSchemaRead ? ReturnType<typeof writeValidators.singleCollaborator<F>> :
  F extends f.SingleLineTextSchemaRead ? ReturnType<typeof writeValidators.singleLineText<F>> :
  F extends f.SingleSelectSchemaRead ? ReturnType<typeof writeValidators.singleSelect<F>> :
  F extends f.UrlSchemaRead ? ReturnType<typeof writeValidators.url<F>> :
  never;

/**
 * Convert a {@link FieldSchema} to a Zod schema that can be used to validate data being written to Airtable.
 */
export function makeFieldWriteValidator<T extends f.FieldSchemaRead>(field: T): InferFieldWriteValidator<T> {
  const validatorMaker = writeValidators[field.type] as any;
  let validator = validatorMaker(field);
  if (field.description) {
    validator = validator.describe(field.description) as typeof validator;
  }
  return validator;
}