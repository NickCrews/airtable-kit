/**
 * Airtable field type definitions
 */
import { type Timezone } from "./timezones.js";
import { type BrightColor, type SelectColor } from "./colors.js";

export type FieldId = `fld${string}`;
interface FieldBase {
  id: FieldId;
  name: string;
}

export type SelectChoice<
  I extends `sel${string}` = `sel${string}`,
  N extends string = string,
> = {
  id: I;
  name: N;
  color?: SelectColor;
};

export interface AiText extends FieldBase {
  type: "aiText";
  options:
    | {
      state: "empty" | "loading" | "generated";
      isStale: boolean;
      value: string | null;
    }
    | {
      state: "error";
      errorType: string;
      isStale: boolean;
      value: string | null;
    };
}
export interface AutoNumber extends FieldBase {
  type: "autoNumber";
}
export interface Barcode extends FieldBase {
  type: "barcode";
}
export interface Button extends FieldBase {
  type: "button";
}
export interface Checkbox extends FieldBase {
  type: "checkbox";
  options: {
    icon?:
      | "check"
      | "xCheckbox"
      | "star"
      | "heart"
      | "thumbsUp"
      | "flag"
      | "dot";
    color?: BrightColor;
  };
}
export interface Count extends FieldBase {
  type: "count";
  options: {
    recordLinkFieldId?: string;
  };
}
export interface CreatedBy extends FieldBase {
  type: "createdBy";
}
export interface CreatedTime extends FieldBase {
  type: "createdTime";
}
export interface Currency extends FieldBase {
  type: "currency";
  options: {
    /** Indicates the number of digits shown to the right of the decimal point for this field. (0-7 inclusive) */
    precision?: number;
    symbol?: string;
  };
}

export interface DateFormatOptions {
  name: "local" | "friendly" | "us" | "european" | "iso";
  format: "l" | "LL" | "M/D/YYYY" | "D/M/YYYY" | "YYYY-MM-DD";
}

export interface TimeFormatOptions {
  name: "12hour" | "24hour";
  format: "h:mma" | "HH:mm";
}

export interface Date extends FieldBase {
  type: "date";
  options?: {
    dateFormat?: DateFormatOptions;
  };
}

export interface DateTime extends FieldBase {
  type: "dateTime";
  options?: {
    dateFormat?: DateFormatOptions;
    timeFormat?: TimeFormatOptions;
    timeZone?: Timezone;
  };
}

/** An integer representing number of seconds. */
export interface Duration extends FieldBase {
  type: "duration";
  options: {
    durationFormat?:
      | "h:mm"
      | "h:mm:ss"
      | "h:mm:ss.S"
      | "h:mm:ss.SS"
      | "h:mm:ss.SSS";
  };
}
export interface Email extends FieldBase {
  type: "email";
}
export interface ExternalSyncSource<C extends SelectChoice = SelectChoice>
  extends FieldBase {
  type: "externalSyncSource";
  options: {
    choices: readonly C[];
  };
}
export interface Formula extends FieldBase {
  type: "formula";
  options: {
    isValid?: boolean;
    formula?: string;
    referencedFieldIds?: readonly string[];
    result?: Omit<FieldSchema, "id" | "name">;
  };
}
export interface LastModifiedBy extends FieldBase {
  type: "lastModifiedBy";
}
export interface LastModifiedTime extends FieldBase {
  type: "lastModifiedTime";
}
export interface MultilineText extends FieldBase {
  type: "multilineText";
}
export interface MultipleAttachments extends FieldBase {
  type: "multipleAttachments";
  options: {
    isReversed?: boolean;
  };
}
export interface MultipleCollaborators extends FieldBase {
  type: "multipleCollaborators";
}
export interface MultipleLookupValues extends FieldBase {
  type: "multipleLookupValues";
  options: {
    /** Is the field currently valid (e.g. false if the linked record field has been deleted) */
    isValid?: boolean;
    recordLinkFieldId?: string;
    fieldIdInLinkedTable?: string;
    result?: Omit<FieldSchema, "id" | "name">;
  };
}
export interface MultipleRecordLinks extends FieldBase {
  type: "multipleRecordLinks";
  options: {
    linkedTableId?: string;
    isReversed?: boolean;
    prefersSingleRecordLink?: boolean;
    inverseLinkFieldId?: string;
  };
}
export interface MultipleSelects<C extends SelectChoice = SelectChoice>
  extends FieldBase {
  type: "multipleSelects";
  options: {
    choices: readonly C[];
  };
}
/** An integer or decimal number showing decimal digits. Precision set with the field config. */
export interface Number extends FieldBase {
  type: "number";
  options?: {
    /** The number of digits shown to the right of the decimal point for this field. (0-8 inclusive) */
    precision?: number;
  };
}
export interface Percent extends FieldBase {
  type: "percent";
  options?: {
    /** The number of digits shown to the right of the decimal point for this field. (0-8 inclusive) */
    precision?: number;
  };
}
export interface PhoneNumber extends FieldBase {
  type: "phoneNumber";
}
export interface Rating extends FieldBase {
  type: "rating";
  options?: {
    /** from 1 to 10, inclusive */
    max?: number;
    icon?: "star" | "heart" | "thumbsUp" | "flag" | "dot";
    color?: BrightColor;
  };
}
export interface RichText extends FieldBase {
  type: "richText";
}
export interface Rollup extends FieldBase {
  type: "rollup";
  options: {
    recordLinkFieldId?: string;
    fieldIdInLinkedTable?: string;
  };
}
export interface SingleCollaborator extends FieldBase {
  type: "singleCollaborator";
}
export interface SingleLineText extends FieldBase {
  type: "singleLineText";
}
export interface SingleSelect<C extends SelectChoice = SelectChoice>
  extends FieldBase {
  type: "singleSelect";
  options: {
    choices: readonly C[];
  };
}
export interface Url extends FieldBase {
  type: "url";
}

/**
 * Field namespace for type constructors
 */
export const Field = {
  AiText: null as unknown as AiText,
  AutoNumber: null as unknown as AutoNumber,
  Barcode: null as unknown as Barcode,
  Button: null as unknown as Button,
  Checkbox: null as unknown as Checkbox,
  Count: null as unknown as Count,
  CreatedBy: null as unknown as CreatedBy,
  CreatedTime: null as unknown as CreatedTime,
  Currency: null as unknown as Currency,
  Date: null as unknown as Date,
  DateTime: null as unknown as DateTime,
  Duration: null as unknown as Duration,
  Email: null as unknown as Email,
  ExternalSyncSource: null as unknown as ExternalSyncSource,
  Formula: null as unknown as Formula,
  LastModifiedBy: null as unknown as LastModifiedBy,
  LastModifiedTime: null as unknown as LastModifiedTime,
  MultilineText: null as unknown as MultilineText,
  MultipleAttachments: null as unknown as MultipleAttachments,
  MultipleCollaborators: null as unknown as MultipleCollaborators,
  MultipleLookupValues: null as unknown as MultipleLookupValues,
  MultipleRecordLinks: null as unknown as MultipleRecordLinks,
  MultipleSelects: null as unknown as MultipleSelects,
  Number: null as unknown as Number,
  Percent: null as unknown as Percent,
  PhoneNumber: null as unknown as PhoneNumber,
  Rating: null as unknown as Rating,
  RichText: null as unknown as RichText,
  Rollup: null as unknown as Rollup,
  SingleCollaborator: null as unknown as SingleCollaborator,
  SingleLineText: null as unknown as SingleLineText,
  SingleSelect: null as unknown as SingleSelect,
  Url: null as unknown as Url,
};
/**
 * Union of all field schemas
 */
export type FieldSchema = typeof Field[keyof typeof Field];
/**
 * Field type code (just the string type)
 */
export type FieldType = FieldSchema["type"];
