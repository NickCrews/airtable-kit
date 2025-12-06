export default {
    "id": "appTestBase123",
    "name": "airtable-kit Test Base",
    "tables": [
        {
            "id": "tblTasks",
            "name": "tasks",
            "description": "Task tracking table",
            "fields": [
                {
                    "id": "fldName",
                    "name": "name",
                    "type": "singleLineText",
                    "description": "The name of the task",
                },
                {
                    "id": "fldStatus",
                    "name": "status",
                    "type": "singleSelect",
                    "description": "The current status of the task",
                    "options": {
                        "choices": [
                            { "id": "selTodo", "name": "Todo", "color": "blueLight2" },
                            { "id": "selInProgress", "name": "In Progress", "color": "yellowLight2" },
                            { "id": "selDone", "name": "Done", "color": "greenLight2" },
                        ],
                    },
                },
                {
                    "id": "fldPriority",
                    "name": "priority",
                    "type": "number",
                    "description": "The priority level of the task. Lower numbers indicate higher priority.",
                    "options": { "precision": 0 },
                },
                {
                    "id": "fldDueDate",
                    "name": "dueDate",
                    "type": "date",
                    "description": "The due date of the task",
                    "options": {
                        "dateFormat": {
                            "name": "iso",
                            "format": "YYYY-MM-DD"
                        }
                    }
                },
                {
                    "id": "fldCompleted",
                    "name": "completed",
                    "type": "checkbox",
                    "description": "Whether the task is completed",
                    "options": {
                        "color": "greenBright",
                        "icon": "check",
                    }
                },
                {
                    "id": "fldNotes",
                    "name": "notes",
                    "type": "multilineText",
                    "description": "Additional notes about the task",
                },
                {
                    "id": "fldTags",
                    "name": "tags",
                    "type": "multipleSelects",
                    "description": "Tags associated with the task",
                    "options": {
                        "choices": [
                            { "id": "selUrgent", "name": "Urgent", "color": "redLight2" },
                            { "id": "selImportant", "name": "Important", "color": "orangeLight2" },
                        ],
                    },
                },
                {
                    "id": "fldAttachments",
                    "name": "attachments",
                    "type": "multipleAttachments",
                    "description": "Files attached to the task",
                    "options": {
                        "isReversed": false,
                    },
                },
            ],
        },
        {
            "id": "tblLinkedItems",
            "name": "linkedItems",
            "description": "Simple table for testing record links, rollups, and lookups",
            "fields": [
                {
                    "id": "fldLinkedName",
                    "name": "name",
                    "type": "singleLineText",
                    "description": "Item name",
                },
                {
                    "id": "fldNumberValue",
                    "name": "numberValue",
                    "type": "number",
                    "description": "Numeric value for rollup testing",
                    "options": { "precision": 0 },
                },
                {
                    "id": "fldSingleLineTextValue",
                    "name": "singleLineTextValue",
                    "type": "singleLineText",
                    "description": "String value for rollup testing",
                },
            ],
        },
        {
            "id": "tblAllTypes",
            "name": "allTypes",
            "description": "Table with all field types for comprehensive testing",
            "fields": [
                {
                    "id": "fldBarcode",
                    "name": "barcode",
                    "type": "barcode",
                },
                {
                    "id": "fldCheckbox",
                    "name": "checkbox",
                    "type": "checkbox",
                    "options": {
                        "color": "blueBright",
                        "icon": "check",
                    }
                },
                {
                    "id": "fldCurrency",
                    "name": "currency",
                    "type": "currency",
                    "options": { "precision": 2, "symbol": "$" },
                },
                {
                    "id": "fldDate",
                    "name": "date",
                    "type": "date",
                    "options": {
                        "dateFormat": {
                            "name": "iso",
                            "format": "YYYY-MM-DD"
                        }
                    }
                },
                {
                    "id": "fldDateTime",
                    "name": "dateTime",
                    "type": "dateTime",
                    "options": {
                        "timeZone": "utc",
                        "dateFormat": { "name": "iso", "format": "YYYY-MM-DD" },
                        "timeFormat": { "name": "24hour", "format": "HH:mm" },
                    },
                },
                {
                    "id": "fldDuration",
                    "name": "duration",
                    "type": "duration",
                    "options": { "durationFormat": "h:mm:ss" },
                },
                {
                    "id": "fldEmail",
                    "name": "email",
                    "type": "email",
                },
                {
                    "id": "fldMultilineText",
                    "name": "multilineText",
                    "type": "multilineText",
                },
                {
                    "id": "fldMultipleAttachments",
                    "name": "multipleAttachments",
                    "type": "multipleAttachments",
                    "options": {
                        "isReversed": false,
                    },
                },
                {
                    "id": "fldMultipleRecordLinks",
                    "name": "multipleRecordLinks",
                    "type": "multipleRecordLinks",
                    "description": "Links to LinkedItems table",
                    "options": {
                        "prefersSingleRecordLink": false,
                        "linkedTableId": "tblLinkedItems",
                        "inverseLinkFieldId": "fldBackLinks",
                        "isReversed": false,
                    },
                },
                {
                    "id": "fldMultipleSelects",
                    "name": "multipleSelects",
                    "type": "multipleSelects",
                    "options": {
                        "choices": [
                            { "id": "selTag1", "name": "Tag 1", "color": "blueBright" },
                            { "id": "selTag2", "name": "Tag 2", "color": "greenBright" },
                            { "id": "selTag3", "name": "Tag 3", "color": "orangeBright" },
                        ],
                    },
                },
                {
                    "id": "fldNumber",
                    "name": "_number",
                    "type": "number",
                    "options": { "precision": 5 },
                },
                {
                    "id": "fldPercent",
                    "name": "percent",
                    "type": "percent",
                    "options": { "precision": 2 },
                },
                {
                    "id": "fldPhoneNumber",
                    "name": "phoneNumber",
                    "type": "phoneNumber",
                },
                {
                    "id": "fldRating",
                    "name": "rating",
                    "type": "rating",
                    "options": { "max": 10, "icon": "star", "color": "yellowBright" },
                },
                {
                    "id": "fldRichText",
                    "name": "richText",
                    "type": "richText",
                },
                {
                    "id": "fldSingleCollaborator",
                    "name": "singleCollaborator",
                    "type": "singleCollaborator",
                },
                {
                    "id": "fldSingleLineText",
                    "name": "singleLineText",
                    "type": "singleLineText",
                },
                {
                    "id": "fldSingleSelect",
                    "name": "singleSelect",
                    "type": "singleSelect",
                    "options": {
                        "choices": [
                            { "id": "selOptionA", "name": "Option A", "color": "blueLight2" },
                            { "id": "selOptionB", "name": "Option B", "color": "greenLight2" },
                            { "id": "selOptionC", "name": "Option C", "color": "redLight2" },
                        ],
                    },
                },
                {
                    "id": "fldURL",
                    "name": "url",
                    "type": "url",
                },
            ],
        },
    ],
} as const;
