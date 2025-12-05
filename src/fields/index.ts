/**
 * Airtable field type definitions
 */

// This should ONLY export the individual field schemas,
// so users can do
// ```
// import * as fields from 'airtable/fields';
// type MyField = fields.SingleSelect;
// ```
// If we export other stuff here, the namespace will be polluted,
// and we lose the semantics of "everything in fields is a field schema".
import { type Timezone } from "./timezones.ts";
import { type BrightColor, type SelectColor } from "./colors.ts";
import { type FieldSchema } from "./types.ts";
import { FieldId, TableId, type SelectId } from "../types.ts";

type FieldTypeAndOptions = Omit<FieldSchema, "id" | "name" | "description">

export type SelectChoice = {
  id: SelectId;
  name: string;
  color?: SelectColor;
};
export type SelectChoiceSchemaRead = {
  id: SelectId;
  name: string;
  color: SelectColor;
}
export type SelectChoiceSchemaWrite = {
  name: string;
  color: SelectColor;
}

export interface AiText {
  id: FieldId;
  name: string;
  description?: string;
  type: "aiText";
}
export interface AiTextSchemaRead extends AiText {
  options: {
    /** The prompt that is used to generate the results in the AI field, additional object types may be added in the future. Currently, this is an array of strings or objects that identify any fields interpolated into the prompt. */
    prompt: Array<string | { fieldId: FieldId }>
    referencedFieldIds: Array<FieldId>
  }
}
export type AiTextSchemaCreate = never

export type AiTextValueRead = {
  state: "empty" | "loading" | "generated";
  isStale: boolean;
  value: string | null;
} | {
  state: "error";
  errorType: string;
  isStale: boolean;
  value: string | null;
};
export type AiTextValueCreate = never

export interface AutoNumber {
  id: FieldId;
  name: string;
  type: "autoNumber";
  description?: string;
}
export type AutoNumberSchemaRead = AutoNumber
export type AutoNumberSchemaCreate = Omit<AutoNumber, "id">;

export interface Barcode {
  id: FieldId;
  name: string;
  description?: string;
  type: "barcode";
}
export type BarcodeSchemaRead = Barcode;
export type BarcodeSchemaCreate = Omit<Barcode, "id">;
export interface Button {
  id: FieldId;
  name: string;
  type: "button";
  description?: string;
}
export type ButtonSchemaRead = Button;
export type ButtonSchemaCreate = Omit<Button, "id">;
type CheckboxIcon =
  | "check"
  | "xCheckbox"
  | "star"
  | "heart"
  | "thumbsUp"
  | "flag"
  | "dot";
export interface Checkbox {
  id: FieldId;
  name: string;
  description?: string;
  type: "checkbox";
  options?: {
    icon?: CheckboxIcon;
    color?: BrightColor;
  }
}
export interface CheckboxSchemaRead extends Checkbox {
  options: {
    icon: CheckboxIcon;
    color: BrightColor;
  }
}
export type CheckboxSchemaCreate = Omit<CheckboxSchemaRead, "id">

export interface Count {
  id: FieldId;
  name: string;
  description?: string;
  type: "count";
  options?: {
    /** false when recordLinkFieldId is null, e.g. the referenced column was deleted. */
    isValid?: boolean;
    recordLinkFieldId?: FieldId | null;
  };
}
export interface CountSchemaRead extends Count {
  options: {
    /** false when recordLinkFieldId is null, e.g. the referenced column was deleted. */
    isValid: boolean;
    recordLinkFieldId?: FieldId | null;
  };
}
export type CountSchemaCreate = Omit<CountSchemaRead, "id">
export interface CreatedBy {
  id: FieldId;
  name: string;
  description?: string;
  type: "createdBy";
}
export type CreatedBySchemaRead = CreatedBy;
export type CreatedBySchemaCreate = Omit<CreatedBy, "id">;
export interface CreatedTime {
  id: FieldId;
  name: string;
  description?: string;
  type: "createdTime";
}
export type CreatedTimeSchemaRead = CreatedTime;
export type CreatedTimeSchemaCreate = Omit<CreatedTime, "id">;
export interface Currency {
  id: FieldId;
  name: string;
  description?: string;
  type: "currency";
  options?: {
    /** Indicates the number of digits shown to the right of the decimal point for this field. (0-7 inclusive) */
    precision?: number;
    symbol?: string;
  };
}
export interface CurrencySchemaRead extends Currency {
  options: {
    /** Indicates the number of digits shown to the right of the decimal point for this field. (0-7 inclusive) */
    precision: number;
    symbol: string;
  };
}
export type CurrencySchemaCreate = Omit<CurrencySchemaRead, "id">;

type DateFormatName = "local" | "friendly" | "us" | "european" | "iso";
type DateFormatFormat = "l" | "LL" | "M/D/YYYY" | "D/M/YYYY" | "YYYY-MM-DD";
type TimeFormatName = "12hour" | "24hour";
type TimeFormatFormat = "h:mma" | "HH:mm";

export interface Date {
  id: FieldId;
  name: string;
  description?: string;
  type: "date";
}
export interface DateSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "date";
  options: {
    dateFormat: {
      name: DateFormatName;
      format: DateFormatFormat;
    };
  };
}
export interface DateSchemaCreate {
  name: string;
  type: "date";
  description?: string;
  options: {
    dateFormat: {
      name: DateFormatName;
      /** When writing, the format may be omitted. */
      format?: DateFormatFormat;
    };
  };
}

export interface DateTime {
  id: FieldId;
  name: string;
  description?: string;
  type: "dateTime";
}
export interface DateTimeSchemaRead extends DateTime {
  options: {
    timeZone: Timezone;
    dateFormat: {
      name: DateFormatName;
      format: DateFormatFormat;
    };
    timeFormat: {
      name: TimeFormatName;
      format: TimeFormatFormat;
    }
  };
}
export interface DateTimeSchemaCreate {
  name: string;
  description?: string;
  type: "dateTime";
  options: {
    timeZone: Timezone;
    dateFormat: {
      name: DateFormatName;
      format?: DateFormatFormat;
    };
    timeFormat: {
      name: TimeFormatName;
      format?: TimeFormatFormat;
    }
  };
}

/** An integer representing number of seconds. */
export interface Duration {
  id: FieldId;
  name: string;
  description?: string;
  type: "duration";
}
export interface DurationSchemaRead extends Duration {
  options: {
    durationFormat:
    | "h:mm"
    | "h:mm:ss"
    | "h:mm:ss.S"
    | "h:mm:ss.SS"
    | "h:mm:ss.SSS";
  };
}
export type DurationSchemaCreate = Omit<DurationSchemaRead, "id">;

export interface Email {
  id: FieldId;
  name: string;
  description?: string;
  type: "email";
}
export type EmailSchemaRead = Email;
export type EmailSchemaCreate = Omit<Email, "id">;
export interface ExternalSyncSource {
  id: FieldId;
  name: string;
  description?: string;
  type: "externalSyncSource";
}
export type ExternalSyncSourceSchemaRead = ExternalSyncSource;
export type ExternalSyncSourceSchemaCreate = never;
export interface Formula {
  id: FieldId;
  name: string;
  description?: string;
  type: "formula";
  options: {
    formula?: string;
    referencedFieldIds?: readonly FieldId[];
    isValid: boolean;
    // This determines the type when reading from the API,
    // so we need it for type inference
    result: FieldTypeAndOptions;
  };
}
export interface FormulaSchemaRead extends Formula {
  options: {
    formula: string;
    referencedFieldIds: readonly FieldId[];
    result: FieldTypeAndOptions;
    isValid: boolean;
  };
}
// TODO: is this correct?
export interface FormulaSchemaCreate {
  name: string;
  description?: string;
  type: "formula";
  options: {
    formula: string;
  };
}
// https://airtable.com/developers/web/api/field-model#lastmodifiedby
export interface LastModifiedBy {
  id: FieldId;
  name: string;
  description?: string;
  type: "lastModifiedBy";
}
export type LastModifiedBySchemaRead = LastModifiedBy;
export type LastModifiedBySchemaCreate = never;
// https://airtable.com/developers/web/api/field-model#lastmodifiedtime
export interface LastModifiedTime {
  id: FieldId;
  name: string;
  description?: string;
  type: "lastModifiedTime";
}
export type LastModifiedTimeSchemaRead = LastModifiedTime;
export type LastModifiedTimeSchemaCreate = never;
export interface MultilineText {
  id: FieldId;
  name: string;
  description?: string;
  type: "multilineText";
}
export type MultilineTextSchemaRead = MultilineText;
export type MultilineTextSchemaCreate = Omit<MultilineText, "id">;
export interface MultipleAttachments {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleAttachments";
  option?: {
    isReversed?: boolean;
  };
}
export interface MultipleAttachmentsSchemaRead extends MultipleAttachments {
  option: {
    isReversed: boolean;
  };
}
export interface MultipleAttachmentsSchemaCreate {
  name: string;
  description?: string;
  type: "multipleAttachments";
};
export interface MultipleCollaborators {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleCollaborators";
}
export type MultipleCollaboratorsSchemaRead = MultipleCollaborators;
export type MultipleCollaboratorsSchemaCreate = Omit<MultipleCollaborators, "id">;
export interface MultipleLookupValues {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleLookupValues";
  options: {
    // This determines the type when reading from the API,
    // so we need it for type inference
    result: FieldTypeAndOptions;
    /** Is the field currently valid (e.g. false if the linked record field has been deleted) */
    isValid: boolean;
    recordLinkFieldId?: FieldId;
    fieldIdInLinkedTable?: FieldId;
  };
}
export interface MultipleLookupValuesSchemaRead extends MultipleLookupValues {
  options: {
    recordLinkFieldId: FieldId;
    fieldIdInLinkedTable: FieldId;
    result: FieldTypeAndOptions;
    /** Is the field currently valid (e.g. false if the linked record field has been deleted) */
    isValid: boolean;
  };
}
export interface MultipleLookupValuesSchemaCreate {
  name: string;
  description?: string;
  type: "multipleLookupValues";
  options: {
    recordLinkFieldId: FieldId;
    fieldIdInLinkedTable: FieldId;
  }
}
export interface MultipleRecordLinks {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleRecordLinks";
  options?: {
    linkedTableId?: TableId;
    inverseLinkFieldId?: FieldId;
    prefersSingleRecordLink?: boolean;
    isReversed?: boolean;

  }
}
export interface MultipleRecordLinksSchemaRead extends MultipleRecordLinks {
  options: {
    linkedTableId: TableId;
    inverseLinkFieldId: FieldId;
    prefersSingleRecordLink: boolean;
    isReversed: boolean;
  };
}
export interface MultipleRecordLinksSchemaCreate {
  name: string;
  description?: string;
  type: "multipleRecordLinks"
  options: {
    linkedTableId: TableId;
    inverseLinkFieldId: FieldId;
    prefersSingleRecordLink: boolean;
  };
}
export interface MultipleSelects<C extends SelectChoice = SelectChoice> {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleSelects";
  options: {
    choices: readonly C[];
  };
}
export interface MultipleSelectsSchemaRead<C extends SelectChoiceSchemaRead = SelectChoiceSchemaRead> {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleSelects";
  options: {
    choices: readonly C[];
  };
}
export interface MultipleSelectsSchemaCreate<C extends SelectChoiceSchemaWrite = SelectChoiceSchemaWrite> {
  name: string;
  description?: string;
  type: "multipleSelects";
  options: {
    choices: readonly C[];
  };
}
/** An integer or decimal number showing decimal digits. Precision set with the field config. */
export interface Number {
  id: FieldId;
  name: string;
  description?: string;
  type: "number";
  options?: {
    /** The number of digits shown to the right of the decimal point for this field. (0-8 inclusive) */
    precision?: number;
  };
}
export interface NumberSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "number";
  options: {
    /** The number of digits shown to the right of the decimal point for this field. (0-8 inclusive) */
    precision: number;
  };
}
export type NumberSchemaCreate = Omit<NumberSchemaRead, "id">
export interface Percent {
  id: FieldId;
  name: string;
  description?: string;
  type: "percent";
  options?: {
    /** The number of digits shown to the right of the decimal point for this field. (0-8 inclusive) */
    precision?: number;
  };
}
export interface PercentSchemaRead extends Percent {
  options: {
    /** The number of digits shown to the right of the decimal point for this field. (0-8 inclusive) */
    precision: number;
  };
}
export type PercentSchemaCreate = Omit<PercentSchemaRead, "id">;
export interface PhoneNumber {
  id: FieldId;
  name: string;
  description?: string;
  type: "phoneNumber";
}
export type PhoneNumberSchemaRead = PhoneNumber;
export type PhoneNumberSchemaCreate = Omit<PhoneNumber, "id">;
export interface Rating {
  id: FieldId;
  name: string;
  description?: string;
  type: "rating";
  options?: {
    max?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    icon?: "star" | "heart" | "thumbsUp" | "flag" | "dot";
    color?: BrightColor;
  };
}
export interface RatingSchemaRead extends Rating {
  options: {
    max: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    icon: "star" | "heart" | "thumbsUp" | "flag" | "dot";
    color: BrightColor;
  };
}
export type RatingSchemaCreate = Omit<RatingSchemaRead, "id">;
export interface RichText {
  id: FieldId;
  name: string;
  description?: string;
  type: "richText";
}
export type RichTextSchemaRead = RichText;
export type RichTextSchemaCreate = Omit<RichText, "id">;
export interface Rollup {
  id: FieldId;
  name: string;
  description?: string;
  type: "rollup";
  options: {
    recordLinkFieldId?: FieldId;
    fieldIdInLinkedTable?: FieldId;
    referencedFieldIds?: FieldId[];
    // This determines the type when reading from the API,
    // so we need it for type inference
    result: FieldTypeAndOptions;
    isValid: boolean;
  };
}
export interface RollupSchemaRead extends Rollup {
  options: {
    recordLinkFieldId: FieldId;
    fieldIdInLinkedTable: FieldId;
    referencedFieldIds?: FieldId[];
    result: FieldTypeAndOptions;
    isValid: boolean;
  };
}
export type RollupSchemaCreate = Omit<RollupSchemaRead, "id">;
export interface SingleCollaborator {
  id: FieldId;
  name: string;
  description?: string;
  type: "singleCollaborator";
}
export type SingleCollaboratorSchemaRead = SingleCollaborator;
export type SingleCollaboratorSchemaCreate = Omit<SingleCollaborator, "id">;
export interface SingleLineText {
  id: FieldId;
  name: string;
  description?: string;
  type: "singleLineText";
}
export type SingleLineTextSchemaRead = SingleLineText;
export type SingleLineTextSchemaCreate = Omit<SingleLineText, "id">;
export interface SingleSelect<C extends SelectChoice = SelectChoice> {
  id: FieldId;
  name: string;
  description?: string;
  type: "singleSelect";
  options: {
    choices: readonly C[];
  };
}
export interface SingleSelectSchemaRead<C extends SelectChoiceSchemaRead = SelectChoiceSchemaRead> {
  id: FieldId;
  name: string;
  description?: string;
  type: "singleSelect";
  options: {
    choices: readonly C[];
  };
}
export interface SingleSelectSchemaCreate<C extends SelectChoiceSchemaWrite = SelectChoiceSchemaWrite> {
  name: string;
  description?: string;
  type: "singleSelect";
  options: {
    choices: readonly C[];
  };
}
export interface Url {
  id: FieldId;
  name: string;
  description?: string;
  type: "url";
}
export type UrlSchemaRead = Url;
export type UrlSchemaCreate = Omit<Url, "id">;
