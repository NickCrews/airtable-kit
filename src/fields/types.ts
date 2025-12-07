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
import { FieldId, TableId, type SelectId } from "../types.ts";

export type FieldTypeAndOptions = Omit<FieldSchemaRead, "id" | "name" | "description">

export type SelectChoiceSchemaRead = {
  id: SelectId;
  name: string;
  color: SelectColor;
}
export type SelectChoiceSchemaWrite = {
  name: string;
  color: SelectColor;
}
export interface AiTextSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "aiText";
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

export type AutoNumberSchemaRead = {
  id: FieldId;
  name: string;
  type: "autoNumber";
  description?: string;
}
export type AutoNumberSchemaCreate = Omit<AutoNumberSchemaRead, "id">;

export interface BarcodeSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "barcode";
};
export type BarcodeSchemaCreate = Omit<BarcodeSchemaRead, "id">;


export type ButtonSchemaRead = {
  id: FieldId;
  name: string;
  type: "button";
  description?: string;
};
export type ButtonSchemaCreate = Omit<ButtonSchemaRead, "id">;

export type CheckboxIcon =
  | "check"
  | "xCheckbox"
  | "star"
  | "heart"
  | "thumbsUp"
  | "flag"
  | "dot";
export interface CheckboxSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "checkbox";
  options: {
    icon: CheckboxIcon;
    color: BrightColor;
  }
}
export type CheckboxSchemaCreate = Omit<CheckboxSchemaRead, "id">

export interface CountSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "count";
  options: {
    /** false when recordLinkFieldId is null, e.g. the referenced column was deleted. */
    isValid: boolean;
    recordLinkFieldId?: FieldId | null;
  };
}
export type CountSchemaCreate = Omit<CountSchemaRead, "id">
export interface CreatedBySchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "createdBy";
}
export type CreatedBySchemaCreate = Omit<CreatedBySchemaRead, "id">;
export interface CreatedTimeSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "createdTime";
};
export type CreatedTimeSchemaCreate = Omit<CreatedTimeSchemaRead, "id">;
export interface CurrencySchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "currency";
  options: {
    /** Indicates the number of digits shown to the right of the decimal point for this field. (0-7 inclusive) */
    precision: number;
    symbol: string;
  };
}
export type CurrencySchemaCreate = Omit<CurrencySchemaRead, "id">;

export type DateFormatName = "local" | "friendly" | "us" | "european" | "iso";
export type DateFormatFormat = "l" | "LL" | "M/D/YYYY" | "D/M/YYYY" | "YYYY-MM-DD";
export type TimeFormatName = "12hour" | "24hour";
export type TimeFormatFormat = "h:mma" | "HH:mm";

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

interface DateTime {
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
export interface DurationSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "duration";
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

export interface EmailSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "email";
};
export type EmailSchemaCreate = Omit<EmailSchemaRead, "id">;
export interface ExternalSyncSourceSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "externalSyncSource";
};
export type ExternalSyncSourceSchemaCreate = never;
export interface FormulaSchemaRead {
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

export type FormulaSchemaCreate = never;
// https://airtable.com/developers/web/api/field-model#lastmodifiedby
export interface LastModifiedBySchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "lastModifiedBy";
}
export type LastModifiedBySchemaCreate = never;
// https://airtable.com/developers/web/api/field-model#lastmodifiedtime
export interface LastModifiedTimeSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "lastModifiedTime";
}
export type LastModifiedTimeSchemaCreate = never;
export interface MultilineTextSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "multilineText";
}
export type MultilineTextSchemaCreate = Omit<MultilineTextSchemaRead, "id">;
export interface MultipleAttachmentsSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleAttachments";
  options: {
    isReversed: boolean;
  };
}
export interface MultipleAttachmentsSchemaCreate {
  name: string;
  description?: string;
  type: "multipleAttachments";
};
export interface MultipleCollaboratorsSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleCollaborators";
}
export type MultipleCollaboratorsSchemaCreate = Omit<MultipleCollaboratorsSchemaRead, "id">;

export interface MultipleLookupValuesSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleLookupValues";
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
export interface MultipleRecordLinksSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "multipleRecordLinks";
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
export interface PercentSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "percent";
  options: {
    /** The number of digits shown to the right of the decimal point for this field. (0-8 inclusive) */
    precision: number;
  };
}
export type PercentSchemaCreate = Omit<PercentSchemaRead, "id">;
export interface PhoneNumberSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "phoneNumber";
}
export type PhoneNumberSchemaCreate = Omit<PhoneNumberSchemaRead, "id">;
export interface RatingSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "rating";
  options: {
    max: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    icon: "star" | "heart" | "thumbsUp" | "flag" | "dot";
    color?: BrightColor;
  };
}
export type RatingSchemaCreate = Omit<RatingSchemaRead, "id">;
export interface RichTextSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "richText";
}
export type RichTextSchemaCreate = Omit<RichTextSchemaRead, "id">;
interface Rollup {
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
export interface SingleCollaboratorSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "singleCollaborator";
}
export type SingleCollaboratorSchemaCreate = Omit<SingleCollaboratorSchemaRead, "id">;
export interface SingleLineTextSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "singleLineText";
}
export type SingleLineTextSchemaCreate = Omit<SingleLineTextSchemaRead, "id">;

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
export interface UrlSchemaRead {
  id: FieldId;
  name: string;
  description?: string;
  type: "url";
}
export type UrlSchemaCreate = Omit<UrlSchemaRead, "id">;


const READ_SCHEMAS = {
  aiText: null as unknown as AiTextSchemaRead,
  autoNumber: null as unknown as AutoNumberSchemaRead,
  barcode: null as unknown as BarcodeSchemaRead,
  button: null as unknown as ButtonSchemaRead,
  checkbox: null as unknown as CheckboxSchemaRead,
  count: null as unknown as CountSchemaRead,
  createdBy: null as unknown as CreatedBySchemaRead,
  createdTime: null as unknown as CreatedTimeSchemaRead,
  currency: null as unknown as CurrencySchemaRead,
  date: null as unknown as DateSchemaRead,
  dateTime: null as unknown as DateTimeSchemaRead,
  duration: null as unknown as DurationSchemaRead,
  email: null as unknown as EmailSchemaRead,
  externalSyncSource: null as unknown as ExternalSyncSourceSchemaRead,
  formula: null as unknown as FormulaSchemaRead,
  lastModifiedBy: null as unknown as LastModifiedBySchemaRead,
  lastModifiedTime: null as unknown as LastModifiedTimeSchemaRead,
  multilineText: null as unknown as MultilineTextSchemaRead,
  multipleAttachments: null as unknown as MultipleAttachmentsSchemaRead,
  multipleCollaborators: null as unknown as MultipleCollaboratorsSchemaRead,
  multipleLookupValues: null as unknown as MultipleLookupValuesSchemaRead,
  multipleRecordLinks: null as unknown as MultipleRecordLinksSchemaRead,
  multipleSelects: null as unknown as MultipleSelectsSchemaRead,
  number: null as unknown as NumberSchemaRead,
  percent: null as unknown as PercentSchemaRead,
  phoneNumber: null as unknown as PhoneNumberSchemaRead,
  rating: null as unknown as RatingSchemaRead,
  richText: null as unknown as RichTextSchemaRead,
  rollup: null as unknown as RollupSchemaRead,
  singleCollaborator: null as unknown as SingleCollaboratorSchemaRead,
  singleLineText: null as unknown as SingleLineTextSchemaRead,
  singleSelect: null as unknown as SingleSelectSchemaRead,
  url: null as unknown as UrlSchemaRead,
};

/**
 * Union of all field schemas from {@link fields}
 * 
 * Each field schema is an extension of the metadata from the [airtable API](https://airtable.com/developers/web/api/field-model)
 * It is an object with at least the following properties:
 * - `id`: The ID of the field, like `fldxxxxxxxxxxxxxx`
 * - `type`: The {@link FieldType} code, eg 'singleLineText'
 * - `name`: A friendly name to refer to the field in your code, eg 'dueDate'
 * 
 * Additionally, they MAY contain properties:
 * - `options`: Some fields have extra metadata, such as a `singleSelect` field keeps track of the list of choices.
 *    These extra properties are included for some field types under the `options` property.
 * - `description`: An optional description for the field.
 *    During code generation, this is pulled from the description set in the Airtable UI.
 *    During Zod validator generation, this is added as a description to the Zod schema,
 *    so that it shows up in any generate JSON Schema or OpenAPI docs.
 */
/**
 * One of the string type codes from the [Airtable API](https://airtable.com/developers/web/api/field-model), eg 'singleSelect'
 */
export type FieldType = keyof typeof READ_SCHEMAS;
export type FieldSchemaRead<T extends FieldType = FieldType> = typeof READ_SCHEMAS[T];

const CREATE_SCHEMAS = {
  aiText: null as unknown as AiTextSchemaCreate,
  autoNumber: null as unknown as AutoNumberSchemaCreate,
  barcode: null as unknown as BarcodeSchemaCreate,
  button: null as unknown as ButtonSchemaCreate,
  checkbox: null as unknown as CheckboxSchemaCreate,
  count: null as unknown as CountSchemaCreate,
  createdBy: null as unknown as CreatedBySchemaCreate,
  createdTime: null as unknown as CreatedTimeSchemaCreate,
  currency: null as unknown as CurrencySchemaCreate,
  date: null as unknown as DateSchemaCreate,
  dateTime: null as unknown as DateTimeSchemaCreate,
  duration: null as unknown as DurationSchemaCreate,
  email: null as unknown as EmailSchemaCreate,
  externalSyncSource: null as unknown as ExternalSyncSourceSchemaCreate,
  formula: null as unknown as FormulaSchemaCreate,
  lastModifiedBy: null as unknown as LastModifiedBySchemaCreate,
  lastModifiedTime: null as unknown as LastModifiedTimeSchemaCreate,
  multilineText: null as unknown as MultilineTextSchemaCreate,
  multipleAttachments: null as unknown as MultipleAttachmentsSchemaCreate,
  multipleCollaborators: null as unknown as MultipleCollaboratorsSchemaCreate,
  multipleLookupValues: null as unknown as MultipleLookupValuesSchemaCreate,
  multipleRecordLinks: null as unknown as MultipleRecordLinksSchemaCreate,
  multipleSelects: null as unknown as MultipleSelectsSchemaCreate,
  number: null as unknown as NumberSchemaCreate,
  percent: null as unknown as PercentSchemaCreate,
  phoneNumber: null as unknown as PhoneNumberSchemaCreate,
  rating: null as unknown as RatingSchemaCreate,
  richText: null as unknown as RichTextSchemaCreate,
  rollup: null as unknown as RollupSchemaCreate,
  singleCollaborator: null as unknown as SingleCollaboratorSchemaCreate,
  singleLineText: null as unknown as SingleLineTextSchemaCreate,
  singleSelect: null as unknown as SingleSelectSchemaCreate,
  url: null as unknown as UrlSchemaCreate,
};

/**
 * The schemas for when you want to create a field in Airtable.
 * 
 * In general, this is
 * ```
 * {
 *   name: string
 *   type: FieldType // eg "autoNumber", "dateTime", etc
 *   options: any // if relevant for type
 * }
 * ```
 * which is like the {@link FieldSchemaRead} you get when you read table's schema, but
 * - without the ID
 * - the the options being required (if relevant for that type)
*/
export type FieldSchemaCreate<T extends FieldType = FieldType> = typeof CREATE_SCHEMAS[T];