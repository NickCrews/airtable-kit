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

interface FieldBase {
  id: `fld${string}`;
  /** Any name you want to refer to the field in your code. The name "id" is not allowed, as that is reserved for the record's record ID */
  name: Exclude<string, "id">;
  description?: string;
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
  options?: {
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
  options?: {
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
  options?: {
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
  options?: {
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
  options?: {
    choices: readonly C[];
  };
}
export interface Formula extends FieldBase {
  type: "formula";
  options?: {
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
  option?: {
    isReversed?: boolean;
  };
}
export interface MultipleCollaborators extends FieldBase {
  type: "multipleCollaborators";
}
export interface MultipleLookupValues extends FieldBase {
  type: "multipleLookupValues";
  options?: {
    /** Is the field currently valid (e.g. false if the linked record field has been deleted) */
    isValid?: boolean;
    recordLinkFieldId?: string;
    fieldIdInLinkedTable?: string;
    result?: Omit<FieldSchema, "id" | "name">;
  };
}
export interface MultipleRecordLinks extends FieldBase {
  type: "multipleRecordLinks";
  options?: {
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
  options?: {
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
