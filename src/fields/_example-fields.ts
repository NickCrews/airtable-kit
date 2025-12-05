import * as fields from './index.ts';

export const AI_TEXT = {
    type: 'aiText',
    id: 'fldAIText',
    name: 'AI Text Field',
} as const satisfies fields.AiText;

export const AUTO_NUMBER = {
    type: 'autoNumber',
    id: 'fldAutoNumber',
    name: 'Auto Number Field',
} as const satisfies fields.AutoNumber;

export const BARCODE = {
    type: 'barcode',
    id: 'fldBarcode',
    name: 'Barcode Field',
} as const satisfies fields.Barcode;

export const BUTTON = {
    type: 'button',
    id: 'fldButton',
    name: 'Button Field',
} as const satisfies fields.Button;

export const CHECKBOX = {
    type: 'checkbox',
    id: 'fldCheckbox',
    name: 'Checkbox Field',
    options: {
        icon: 'check',
        color: 'blueBright',
    },
} as const satisfies fields.Checkbox;

export const COUNT = {
    type: 'count',
    id: 'fldCount',
    name: 'Count Field',
    options: {
        recordLinkFieldId: 'fldLinkedRecords',
    },
} as const satisfies fields.Count;

export const CREATED_BY = {
    type: 'createdBy',
    id: 'fldCreatedBy',
    name: 'Created By Field',
} as const satisfies fields.CreatedBy;

export const CREATED_TIME = {
    type: 'createdTime',
    id: 'fldCreatedTime',
    name: 'Created Time Field',
} as const satisfies fields.CreatedTime;

export const CURRENCY = {
    type: 'currency',
    id: 'fldCurrency',
    name: 'Currency Field',
    options: {
        symbol: '$',
        precision: 2,
    },
} as const satisfies fields.Currency;

export const DATE = {
    type: 'date',
    id: 'fldDate',
    name: 'Date Field',
} as const satisfies fields.Date;

export const DATE_TIME = {
    type: 'dateTime',
    id: 'fldDateTime',
    name: 'DateTime Field',
} as const satisfies fields.DateTime;

export const DURATION = {
    type: 'duration',
    id: 'fldDuration',
    name: 'Duration Field',
} as const satisfies fields.Duration;

export const EMAIL = {
    type: 'email',
    id: 'fldEmail',
    name: 'Email Field',
} as const satisfies fields.Email;

export const EXTERNAL_SYNC_SOURCE = {
    type: 'externalSyncSource',
    id: 'fldExternalSyncSource',
    name: 'External Sync Source Field',
} as const satisfies fields.ExternalSyncSource;

export const FORMULA = {
    type: 'formula',
    id: 'fldFormula',
    name: 'Formula Field',
    options: {
        isValid: true,
        result: {
            type: 'number',
        }
    },
} as const satisfies fields.Formula;

export const LAST_MODIFIED_BY = {
    type: 'lastModifiedBy',
    id: 'fldLastModifiedBy',
    name: 'Last Modified By Field',
} as const satisfies fields.LastModifiedBy;

export const LAST_MODIFIED_TIME = {
    type: 'lastModifiedTime',
    id: 'fldLastModifiedTime',
    name: 'Last Modified Time Field',
} as const satisfies fields.LastModifiedTime;

export const MULTILINE_TEXT = {
    type: 'multilineText',
    id: 'fldMultilineText',
    name: 'Multiline Text Field',
} as const satisfies fields.MultilineText;

export const MULTIPLE_ATTACHMENTS = {
    type: 'multipleAttachments',
    id: 'fldMultipleAttachments',
    name: 'Multiple Attachments Field',
} as const satisfies fields.MultipleAttachments;

export const MULTIPLE_COLLABORATORS = {
    type: 'multipleCollaborators',
    id: 'fldMultipleCollaborators',
    name: 'Multiple Collaborators Field',
} as const satisfies fields.MultipleCollaborators;

export const MULTIPLE_LOOKUP_VALUES = {
    type: 'multipleLookupValues',
    id: 'fldMultipleLookupValues',
    name: 'Multiple Lookup Values Field',
    options: {
        isValid: true,
        result: {
            type: 'singleLineText',
        },
    },
} as const satisfies fields.MultipleLookupValues;

export const MULTIPLE_RECORD_LINKS = {
    type: 'multipleRecordLinks',
    id: 'fldMultipleRecordLinks',
    name: 'Multiple Record Links Field',
} as const satisfies fields.MultipleRecordLinks;

export const MULTIPLE_SELECTS = {
    type: 'multipleSelects',
    id: 'fldMultipleSelects',
    name: 'Multiple Selects Field',
    options: {
        choices: [
            { id: 'selGood', name: 'good', color: 'greenLight1' },
            { id: 'selBad', name: 'bad', color: 'redLight1' },
        ],
    },
} as const satisfies fields.MultipleSelects;

export const NUMBER = {
    type: 'number',
    id: 'fldNumber',
    name: 'Number Field',
    options: {
        precision: 2,
    },
} as const satisfies fields.Number;

export const PERCENT = {
    type: 'percent',
    id: 'fldPercent',
    name: 'Percent Field',
    options: {
        precision: 1,
    },
} as const satisfies fields.Percent;

export const PHONE_NUMBER = {
    type: 'phoneNumber',
    id: 'fldPhoneNumber',
    name: 'Phone Number Field',
} as const satisfies fields.PhoneNumber;

export const RATING = {
    type: 'rating',
    id: 'fldRating',
    name: 'Rating Field',
    options: {
        max: 5,
        icon: 'star',
    },
} as const satisfies fields.Rating;

export const RICH_TEXT = {
    type: 'richText',
    id: 'fldRichText',
    name: 'Rich Text Field',
} as const satisfies fields.RichText;

export const ROLLUP = {
    type: 'rollup',
    id: 'fldRollup',
    name: 'Rollup Field',
    options: {
        result: {
            type: 'number',
        },
        isValid: true,
    },
} as const satisfies fields.Rollup;

export const SINGLE_COLLABORATOR = {
    type: 'singleCollaborator',
    id: 'fldSingleCollaborator',
    name: 'Single Collaborator Field',
} as const satisfies fields.SingleCollaborator;

export const SINGLE_LINE_TEXT = {
    type: 'singleLineText',
    id: 'fldSingleLineText',
    name: 'Single Line Text Field',
} as const satisfies fields.SingleLineText;

export const SINGLE_SELECT = {
    type: 'singleSelect',
    id: 'fldSingleSelect',
    name: 'Single Select Field',
    options: {
        choices: [
            { id: 'selTodo', name: 'todo', color: 'yellowLight1' },
            { id: 'selDone', name: 'done', color: 'greenLight1' },
        ],
    },
} as const satisfies fields.SingleSelect;

export const URL = {
    type: 'url',
    id: 'fldUrl',
    name: 'URL Field',
} as const satisfies fields.Url;