// This is a sample base schema with STATIC ids.
// This doesn't reflect a real base, and you can't use it
// with the Airtable API.
// But, you can use it for offline testing,
// especially for tests that require stable IDs, eg
//
//  it("should convert field names to field IDs", () => {
//      const formula: Formula<Field> = { field: "Name" };
//      const result = formulaToString(fields, formula);
//      expect(result).toBe("{fldName}");
//  });
// 
// If you actually need to interact with a real base via the API, use the generated schema.

export default {
    "id": "appTaskBase",
    "name": "taskTracker",
    "tables": [
        {
            "id": "tblTasks",
            "name": "tasks",
            "fields": [
                {
                    "id": "fldName",
                    "name": "Name",
                    "type": "singleLineText",
                    "description": "The name of the task",
                },
                {
                    "id": "fldStatus",
                    "name": "Status",
                    "type": "singleSelect",
                    "description": "The current status of the task",
                    "options": {
                        "choices": [
                            { "id": "selTodo", "name": "Todo", "color": "blueLight2" },
                            { "id": "selInProgress", "name": "In Progress", "color": "yellowLight2" },
                            { "id": "selDone", "name": "Done", "color": "greenLight2" }
                        ]
                    }
                },
                {
                    "id": "fldPriority",
                    "name": "Priority",
                    "type": "number",
                    "description": "The priority level of the task. Lower numbers indicate higher priority.",
                    "options": { "precision": 0 }
                },
                {
                    "id": "fldDueDate",
                    "name": "Due Date",
                    "type": "date",
                    "description": "The due date of the task",
                    "options": {
                        "dateFormat": {
                            "format": "YYYY-MM-DD",
                            "name": "iso"
                        }
                    },
                },
                {
                    "id": "fldCompleted",
                    "name": "Completed",
                    "type": "checkbox",
                    "description": "Whether the task is completed",
                    options: {
                        icon: 'check',
                        color: 'blueBright',
                    },
                },
                {
                    "id": "fldNotes",
                    "name": "Notes",
                    "type": "multilineText",
                    "description": "Additional notes about the task",
                },
                {
                    "id": "fldTags",
                    "name": "Tags",
                    "type": "multipleSelects",
                    "description": "Tags associated with the task",
                    "options": {
                        "choices": [
                            { "id": "selUrgent", "name": "Urgent", "color": "redLight2" },
                            { "id": "selImportant", "name": "Important", "color": "orangeLight2" }
                        ]
                    }
                },
                {
                    "id": "fldAttachments",
                    "name": "Attachments",
                    "type": "multipleAttachments",
                    "description": "Files attached to the task",
                    "options": {
                        "isReversed": false,
                    },
                },
                {
                    "id": "fldCreatedAt",
                    "name": "Created At",
                    "type": "createdTime",
                    "description": "The time when the task was created",
                },
                {
                    "id": "fldUpdatedAt",
                    "name": "Updated At",
                    "type": "lastModifiedTime",
                    "description": "The time when the task was last updated",
                },
                {
                    "id": "fldAssignedTo",
                    "name": "Assigned To",
                    "type": "multipleRecordLinks",
                    "description": "Users assigned to the task",
                    "options": {
                        "linkedTableId": "tblLinkedTable",
                        "inverseLinkFieldId": "fldInverseLink",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                    },
                }
            ]
        },
        {
            "id": "tblUsers",
            "name": "users",
            "fields": [
                {
                    "id": "fldEmail",
                    "name": "Email",
                    "type": "email"
                },
                {
                    "id": "fldFullName",
                    "name": "Full Name",
                    "type": "singleLineText",
                },
                {
                    "id": "fldPhone",
                    "name": "Phone",
                    "type": "phoneNumber",
                    "description": "please include area code",
                }
            ]
        }
    ]
} as const;
