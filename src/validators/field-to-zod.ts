/**
 * Convert Airtable field types to Zod schemas
 */

import { z } from 'zod';
import { type FieldSchema, type FieldType } from '../types.ts';
import { RecordIdSchema } from './index.ts';
import * as fields from '../fields/index.ts';
import * as testFields from '../fields/_example-fields.ts';

const ANY_TYPES = [
  'externalSyncSource',
] as const satisfies FieldType[];
const ANY_VALIDATOR = z.any();

const BARCODE_TYPES = [
  'barcode',
] as const satisfies FieldType[];
const BARCODE_VALIDATOR = z.strictObject({
  text: z.string(),
  type: z.string().optional(),
});

const BOOLEAN_TYPES = [
  'checkbox',
] as const satisfies FieldType[];
const BOOLEAN_VALIDATOR = z.boolean();

const COLLABORATOR_TYPES = [
  'singleCollaborator',
] as const satisfies FieldType[];
const COLLABORATOR_VALIDATOR = z.strictObject({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
});

const DATE_TYPES = [
  'date',
] as const satisfies FieldType[];
const DATE_VALIDATOR = z.iso.date();

const DATE_TIME_TYPES = [
  'dateTime',
] as const satisfies FieldType[];
const DATE_TIME_VALIDATOR = z.iso.datetime({ local: true });

const EMAIL_TYPES = [
  'email',
] as const satisfies FieldType[];
const EMAIL_VALIDATOR = z.email();

const MULTIPLE_ATTACHMENT_TYPES = [
  'multipleAttachments',
] as const satisfies FieldType[];
const MULTIPLE_ATTACHMENT_VALIDATOR = z.array(z.strictObject({
  url: z.url(),
  filename: z.string(),
}));

const MULTIPLE_COLLABORATOR_TYPES = [
  'multipleCollaborators',
] as const satisfies FieldType[];
const MULTIPLE_COLLABORATOR_VALIDATOR = z.array(COLLABORATOR_VALIDATOR);

const MULTIPLE_RECORD_LINK_TYPES = [
  'multipleRecordLinks',
] as const satisfies FieldType[];
const MULTIPLE_RECORD_LINK_VALIDATOR = z.array(RecordIdSchema);

const NUMBER_TYPES = [
  'number',
  'percent',
  'currency',
  'duration',
  'rating',
] as const satisfies FieldType[];
const NUMBER_VALIDATOR = z.number();

const READONLY_TYPES = [
  'aiText',
  'autoNumber',
  'button',
  'count',
  'createdBy',
  'createdTime',
  'formula',
  'lastModifiedBy',
  'lastModifiedTime',
  'multipleLookupValues',
  'rollup',
] as const satisfies FieldType[];
const READONLY_VALIDATOR = z.never();

const STRING_TYPES = [
  'singleLineText',
  'multilineText',
  'richText',
  'phoneNumber',
] as const satisfies FieldType[];
const STRING_VALIDATOR = z.string();

const URL_TYPES = [
  'url',
] as const satisfies FieldType[];
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

/** Given a {@link FieldSchema}, infer the type of the Zod validator. */
export type inferZod<F extends FieldSchema> =
  F extends { type: typeof ANY_TYPES[number] } ? typeof ANY_VALIDATOR
  : F extends { type: typeof BARCODE_TYPES[number] } ? typeof BARCODE_VALIDATOR
  : F extends { type: typeof BOOLEAN_TYPES[number] } ? typeof BOOLEAN_VALIDATOR
  : F extends { type: typeof COLLABORATOR_TYPES[number] } ? typeof COLLABORATOR_VALIDATOR
  : F extends { type: typeof DATE_TYPES[number] } ? typeof DATE_VALIDATOR
  : F extends { type: typeof DATE_TIME_TYPES[number] } ? typeof DATE_TIME_VALIDATOR
  : F extends { type: typeof EMAIL_TYPES[number] } ? typeof EMAIL_VALIDATOR
  : F extends { type: typeof NUMBER_TYPES[number] } ? typeof NUMBER_VALIDATOR
  : F extends { type: typeof MULTIPLE_COLLABORATOR_TYPES[number] } ? typeof MULTIPLE_COLLABORATOR_VALIDATOR
  : F extends { type: typeof MULTIPLE_ATTACHMENT_TYPES[number] } ? typeof MULTIPLE_ATTACHMENT_VALIDATOR
  : F extends { type: typeof MULTIPLE_RECORD_LINK_TYPES[number] } ? typeof MULTIPLE_RECORD_LINK_VALIDATOR
  : F extends { type: typeof READONLY_TYPES[number] } ? typeof READONLY_VALIDATOR
  : F extends { type: typeof STRING_TYPES[number] } ? typeof STRING_VALIDATOR
  : F extends { type: typeof URL_TYPES[number] } ? typeof URL_VALIDATOR
  : F extends fields.SingleSelect ? SingleSelectValidator<Extract<F, fields.SingleSelect>>
  : F extends fields.MultipleSelects ? MultipleSelectValidator<Extract<F, fields.MultipleSelects>>
  : never;

type AiZod = inferZod<typeof testFields.AI_TEXT>;
type AutoNumberZod = inferZod<typeof testFields.AUTO_NUMBER>;
type BarcodeZod = inferZod<typeof testFields.BARCODE>;
type ButtonZod = inferZod<typeof testFields.BUTTON>;
type CheckboxZod = inferZod<typeof testFields.CHECKBOX>;
type CountZod = inferZod<typeof testFields.COUNT>;
type CreatedByZod = inferZod<typeof testFields.CREATED_BY>;
type CreatedTimeZod = inferZod<typeof testFields.CREATED_TIME>;
type CurrencyZod = inferZod<typeof testFields.CURRENCY>;
type DateZod = inferZod<typeof testFields.DATE>;
type DateTimeZod = inferZod<typeof testFields.DATE_TIME>;
type DurationZod = inferZod<typeof testFields.DURATION>;
type EmailZod = inferZod<typeof testFields.EMAIL>;
type ExternalSyncSourceZod = inferZod<typeof testFields.EXTERNAL_SYNC_SOURCE>;
type FormulaZod = inferZod<typeof testFields.FORMULA>;
type LastModifiedByZod = inferZod<typeof testFields.LAST_MODIFIED_BY>;
type LastModifiedTimeZod = inferZod<typeof testFields.LAST_MODIFIED_TIME>;
type MultilineTextZod = inferZod<typeof testFields.MULTILINE_TEXT>;
type MultipleAttachmentsZod = inferZod<typeof testFields.MULTIPLE_ATTACHMENTS>;
type MultipleCollaboratorsZod = inferZod<typeof testFields.MULTIPLE_COLLABORATORS>;
type MultipleLookupValuesZod = inferZod<typeof testFields.MULTIPLE_LOOKUP_VALUES>;
type MultipleRecordLinksZod = inferZod<typeof testFields.MULTIPLE_RECORD_LINKS>;
type MultipleSelectsZod = inferZod<typeof testFields.MULTIPLE_SELECTS>;
type NumberZod = inferZod<typeof testFields.NUMBER>;
type PercentZod = inferZod<typeof testFields.PERCENT>;
type PhoneNumberZod = inferZod<typeof testFields.PHONE_NUMBER>;
type RatingZod = inferZod<typeof testFields.RATING>;
type RichTextZod = inferZod<typeof testFields.RICH_TEXT>;
type RollupZod = inferZod<typeof testFields.ROLLUP>;
type SingleCollaboratorZod = inferZod<typeof testFields.SINGLE_COLLABORATOR>;
type SingleLineTextZod = inferZod<typeof testFields.SINGLE_LINE_TEXT>;
type SingleSelectZod = inferZod<typeof testFields.SINGLE_SELECT>;
type UrlZod = inferZod<typeof testFields.URL>;

/**
 * Convert a field type to a Zod schema
 */
export function fieldSchemaToZod<T extends FieldSchema>(field: T): inferZod<T> {
  let validator = _fieldSchemaToZod(field);
  if (field.description) {
    validator = validator.describe(field.description) as typeof validator;
  }
  return validator;
}

// Helper to narrow array includes from https://www.petermekhaeil.com/til/ts-array-includes/
function includes<T extends U, U>(arr: ReadonlyArray<T>, searchElement: U): searchElement is T {
  return arr.includes(searchElement as T);
}

function _fieldSchemaToZod<T extends FieldSchema>(field: T): inferZod<T> {
  const fieldType = field.type as FieldType;
  if (includes(ANY_TYPES, fieldType)) {
    return ANY_VALIDATOR as inferZod<T>;
  }
  if (includes(BOOLEAN_TYPES, fieldType)) {
    return BOOLEAN_VALIDATOR as inferZod<T>;
  }
  if (includes(BARCODE_TYPES, fieldType)) {
    return BARCODE_VALIDATOR as inferZod<T>;
  }
  if (includes(COLLABORATOR_TYPES, fieldType)) {
    return COLLABORATOR_VALIDATOR as inferZod<T>;
  }
  if (includes(DATE_TYPES, fieldType)) {
    return DATE_VALIDATOR as inferZod<T>;
  }
  if (includes(DATE_TIME_TYPES, fieldType)) {
    return DATE_TIME_VALIDATOR as inferZod<T>;
  }
  if (includes(EMAIL_TYPES, fieldType)) {
    return EMAIL_VALIDATOR as inferZod<T>;
  }
  if (includes(MULTIPLE_ATTACHMENT_TYPES, fieldType)) {
    return MULTIPLE_ATTACHMENT_VALIDATOR as inferZod<T>;
  }
  if (includes(MULTIPLE_COLLABORATOR_TYPES, fieldType)) {
    return MULTIPLE_COLLABORATOR_VALIDATOR as inferZod<T>;
  }
  if (includes(MULTIPLE_RECORD_LINK_TYPES, fieldType)) {
    return MULTIPLE_RECORD_LINK_VALIDATOR as inferZod<T>;
  }
  if (includes(NUMBER_TYPES, fieldType)) {
    return NUMBER_VALIDATOR as inferZod<T>;
  }
  if (includes(READONLY_TYPES, fieldType)) {
    return READONLY_VALIDATOR as inferZod<T>;
  }
  if (includes(STRING_TYPES, fieldType)) {
    return STRING_VALIDATOR as inferZod<T>;
  }
  if (includes(URL_TYPES, fieldType)) {
    return URL_VALIDATOR as inferZod<T>;
  }
  if (fieldType === 'singleSelect') {
    return makeSingleSelectValidator(field as fields.SingleSelect) as inferZod<T>;
  }
  if (fieldType === 'multipleSelects') {
    return makeMultipleSelectValidator(field as fields.MultipleSelects) as inferZod<T>;
  }
  throw new Error(`Unsupported field type: ${fieldType satisfies never}`);
}