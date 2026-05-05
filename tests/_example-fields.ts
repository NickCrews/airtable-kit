import { FieldSchemaRead } from 'airtable-kit/fields';

export const AI_TEXT = {
    type: 'aiText',
    id: 'fldAIText',
    name: 'AI Text Field',
    options: {
        prompt: [],
        referencedFieldIds: [],
    }
} as const satisfies FieldSchemaRead<'aiText'>;

export const AUTO_NUMBER = {
    type: 'autoNumber',
    id: 'fldAutoNumber',
    name: 'Auto Number Field',
} as const satisfies FieldSchemaRead<'autoNumber'>;

export const BARCODE = {
    type: 'barcode',
    id: 'fldBarcode',
    name: 'Barcode Field',
} as const satisfies FieldSchemaRead<'barcode'>;

export const BUTTON = {
    type: 'button',
    id: 'fldButton',
    name: 'Button Field',
} as const satisfies FieldSchemaRead<'button'>;

export const CHECKBOX = {
    type: 'checkbox',
    id: 'fldCheckbox',
    name: 'Checkbox Field',
    options: {
        icon: 'check',
        color: 'blueBright',
    },
} as const satisfies FieldSchemaRead<'checkbox'>;

export const COUNT = {
    type: 'count',
    id: 'fldCount',
    name: 'Count Field',
    options: {
        isValid: true,
        recordLinkFieldId: 'fldLinkedRecords',
    },
} as const satisfies FieldSchemaRead<'count'>;

export const CREATED_BY = {
    type: 'createdBy',
    id: 'fldCreatedBy',
    name: 'Created By Field',
} as const satisfies FieldSchemaRead<'createdBy'>;

export const CREATED_TIME = {
    type: 'createdTime',
    id: 'fldCreatedTime',
    name: 'Created Time Field',
} as const satisfies FieldSchemaRead<'createdTime'>;

export const CURRENCY = {
    type: 'currency',
    id: 'fldCurrency',
    name: 'Currency Field',
    options: {
        symbol: '$',
        precision: 2,
    },
} as const satisfies FieldSchemaRead<'currency'>;

export const DATE = {
    type: 'date',
    id: 'fldDate',
    name: 'Date Field',
    options: {
        dateFormat: {
            format: 'YYYY-MM-DD',
            name: 'iso',
        },
    },
} as const satisfies FieldSchemaRead<'date'>;

export const DATE_TIME = {
    type: 'dateTime',
    id: 'fldDateTime',
    name: 'DateTime Field',
    options: {
        dateFormat: {
            format: 'YYYY-MM-DD',
            name: 'iso',
        },
        timeFormat: {
            format: 'HH:mm',
            name: '24hour',
        },
        timeZone: 'client',
    },
} as const satisfies FieldSchemaRead<'dateTime'>;

export const DURATION = {
    type: 'duration',
    id: 'fldDuration',
    name: 'Duration Field',
    options: {
        durationFormat: 'h:mm:ss',
    },
} as const satisfies FieldSchemaRead<'duration'>;

export const EMAIL = {
    type: 'email',
    id: 'fldEmail',
    name: 'Email Field',
} as const satisfies FieldSchemaRead<'email'>;

export const EXTERNAL_SYNC_SOURCE = {
    type: 'externalSyncSource',
    id: 'fldExternalSyncSource',
    name: 'External Sync Source Field',
} as const satisfies FieldSchemaRead<'externalSyncSource'>;

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
} as const satisfies FieldSchemaRead<'formula'>;

export const LAST_MODIFIED_BY = {
    type: 'lastModifiedBy',
    id: 'fldLastModifiedBy',
    name: 'Last Modified By Field',
} as const satisfies FieldSchemaRead<'lastModifiedBy'>;

export const LAST_MODIFIED_TIME = {
    type: 'lastModifiedTime',
    id: 'fldLastModifiedTime',
    name: 'Last Modified Time Field',
} as const satisfies FieldSchemaRead<'lastModifiedTime'>;

export const MULTILINE_TEXT = {
    type: 'multilineText',
    id: 'fldMultilineText',
    name: 'Multiline Text Field',
} as const satisfies FieldSchemaRead<'multilineText'>;

export const MULTIPLE_ATTACHMENTS = {
    type: 'multipleAttachments',
    id: 'fldMultipleAttachments',
    name: 'Multiple Attachments Field',
    options: {
        isReversed: false,
    },
} as const satisfies FieldSchemaRead<'multipleAttachments'>;

export const MULTIPLE_COLLABORATORS = {
    type: 'multipleCollaborators',
    id: 'fldMultipleCollaborators',
    name: 'Multiple Collaborators Field',
} as const satisfies FieldSchemaRead<'multipleCollaborators'>;

export const MULTIPLE_LOOKUP_VALUES = {
    type: 'multipleLookupValues',
    id: 'fldMultipleLookupValues',
    name: 'Multiple Lookup Values Field',
    options: {
        isValid: true,
        recordLinkFieldId: 'fldLinkedRecords',
        fieldIdInLinkedTable: 'fldSomeField',
        result: {
            type: 'singleLineText',
        },
    },
} as const satisfies FieldSchemaRead<'multipleLookupValues'>;

export const MULTIPLE_RECORD_LINKS = {
    type: 'multipleRecordLinks',
    id: 'fldMultipleRecordLinks',
    name: 'Multiple Record Links Field',
    options: {
        linkedTableId: 'tblLinkedTable',
        inverseLinkFieldId: 'fldInverseLink',
        isReversed: false,
        prefersSingleRecordLink: false,
    },
} as const satisfies FieldSchemaRead<'multipleRecordLinks'>;

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
} as const satisfies FieldSchemaRead<'multipleSelects'>;

export const NUMBER = {
    type: 'number',
    id: 'fldNumber',
    name: 'Number Field',
    options: {
        precision: 2,
    },
} as const satisfies FieldSchemaRead<'number'>;

export const PERCENT = {
    type: 'percent',
    id: 'fldPercent',
    name: 'Percent Field',
    options: {
        precision: 1,
    },
} as const satisfies FieldSchemaRead<'percent'>;

export const PHONE_NUMBER = {
    type: 'phoneNumber',
    id: 'fldPhoneNumber',
    name: 'Phone Number Field',
} as const satisfies FieldSchemaRead<'phoneNumber'>;

export const RATING = {
    type: 'rating',
    id: 'fldRating',
    name: 'Rating Field',
    options: {
        max: 5,
        icon: 'star',
    },
} as const satisfies FieldSchemaRead<'rating'>;

export const RICH_TEXT = {
    type: 'richText',
    id: 'fldRichText',
    name: 'Rich Text Field',
} as const satisfies FieldSchemaRead<'richText'>;

export const ROLLUP = {
    type: 'rollup',
    id: 'fldRollup',
    name: 'Rollup Field',
    options: {
        result: {
            type: 'number',
        },
        isValid: true,
        recordLinkFieldId: 'fldLinkedRecords',
        fieldIdInLinkedTable: 'fldSomeField',
        referencedFieldIds: ['fldSomeField'],
    },
} as const satisfies FieldSchemaRead<'rollup'>;

export const SINGLE_COLLABORATOR = {
    type: 'singleCollaborator',
    id: 'fldSingleCollaborator',
    name: 'Single Collaborator Field',
} as const satisfies FieldSchemaRead<'singleCollaborator'>;

export const SINGLE_LINE_TEXT = {
    type: 'singleLineText',
    id: 'fldSingleLineText',
    name: 'Single Line Text Field',
} as const satisfies FieldSchemaRead<'singleLineText'>;

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
} as const satisfies FieldSchemaRead<'singleSelect'>;

export const URL = {
    type: 'url',
    id: 'fldUrl',
    name: 'URL Field',
} as const satisfies FieldSchemaRead<'url'>;