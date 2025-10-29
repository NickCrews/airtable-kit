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
                    "type": "singleLineText"
                },
                {
                    "id": "fldStatus",
                    "name": "Status",
                    "type": "singleSelect",
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
                    "options": { "precision": 0 }
                },
                {
                    "id": "fldDueDate",
                    "name": "Due Date",
                    "type": "date"
                },
                {
                    "id": "fldCompleted",
                    "name": "Completed",
                    "type": "checkbox"
                },
                {
                    "id": "fldNotes",
                    "name": "Notes",
                    "type": "multilineText"
                },
                {
                    "id": "fldTags",
                    "name": "Tags",
                    "type": "multipleSelects",
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
                },
                {
                    "id": "fldCreatedAt",
                    "name": "Created At",
                    "type": "createdTime",
                },
                {
                    "id": "fldUpdatedAt",
                    "name": "Updated At",
                    "type": "lastModifiedTime",
                },
                {
                    "id": "fldAssignedTo",
                    "name": "Assigned To",
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tblUsers"
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
                    "type": "singleLineText"
                },
                {
                    "id": "fldPhone",
                    "name": "Phone",
                    "type": "phoneNumber"
                }
            ]
        }
    ]
} as const;
