import { makeFetcher } from "../client/fetcher";
import { CreateFieldSchema } from "../fields/create";
import { BaseId, BaseSchema, TableId, TableSchema, type FieldSchema, type WorkspaceId } from "../types";

// To create a field, some of them are possible to create during the base creation,
// while others require creating after the base is created using follow-up API calls.
// Then, some fields cannot be created via the API at all (e.g. formula fields),
// and the user must create them manually after base creation.
type CreateMode = "onBaseCreate" | "afterBaseCreate" | "manually";
type WriteFieldSchemaWithCreateMode = CreateFieldSchema & {
    create: CreateMode;
}

interface CreateTableSchema {
    name: string,
    description?: string
    fields: Array<WriteFieldSchemaWithCreateMode>
}

interface CreateBaseSchema {
    name: string,
    tables: Array<CreateTableSchema>
}

// Define the base structure to create
const TEST_BASE_SCHEMA: CreateBaseSchema = {
    name: "airtable-kit Test Base",
    tables: [
        // Tasks table
        {
            name: "tasks",
            description: "Task tracking table",
            fields: [
                {
                    create: "onBaseCreate",
                    name: "name",
                    type: "singleLineText",
                    description: "The name of the task",
                },
                {
                    create: "onBaseCreate",
                    name: "status",
                    type: "singleSelect",
                    description: "The current status of the task",
                    options: {
                        choices: [
                            { name: "Todo", color: "blueLight2" },
                            { name: "In Progress", color: "yellowLight2" },
                            { name: "Done", color: "greenLight2" },
                        ],
                    },
                },
                {
                    create: "onBaseCreate",
                    name: "priority",
                    type: "number",
                    description: "The priority level of the task. Lower numbers indicate higher priority.",
                    options: { precision: 0 },
                },
                {
                    create: "onBaseCreate",
                    name: "dueDate",
                    type: "date",
                    description: "The due date of the task",
                    options: {
                        dateFormat: {
                            name: "iso",
                            format: "YYYY-MM-DD"
                        }
                    }
                },
                {
                    create: "onBaseCreate",
                    name: "completed",
                    type: "checkbox",
                    description: "Whether the task is completed",
                    options: {
                        color: "greenBright",
                        icon: "check",
                    }
                },
                {
                    create: "onBaseCreate",
                    name: "notes",
                    type: "multilineText",
                    description: "Additional notes about the task",
                },
                {
                    create: "onBaseCreate",
                    name: "tags",
                    type: "multipleSelects",
                    description: "Tags associated with the task",
                    options: {
                        choices: [
                            { name: "Urgent", color: "redLight2" },
                            { name: "Important", color: "orangeLight2" },
                        ],
                    },
                },
                {
                    create: "onBaseCreate",
                    name: "attachments",
                    type: "multipleAttachments",
                    description: "Files attached to the task",
                },
            ],
        },
        // Linked items for testing the links from the allTypes table
        {
            name: "linkedItems",
            description: "Simple table for testing record links, rollups, and lookups",
            fields: [
                {
                    create: "onBaseCreate",
                    name: "name",
                    type: "singleLineText",
                    description: "Item name",
                },
                {
                    create: "onBaseCreate",
                    name: "numberValue",
                    type: "number",
                    description: "Numeric value for rollup testing",
                    options: { precision: 0 },
                },
                {
                    create: "onBaseCreate",
                    name: "singleLineTextValue",
                    type: "singleLineText",
                    description: "String value for rollup testing",
                },
            ],
        },
        // allTypes table - comprehensive field type testing
        // Fields are ordered alphabetically to match fields/index.ts
        {
            name: "allTypes",
            description: "Table with all field types for comprehensive testing",
            fields: [
                {
                    create: "afterBaseCreate",
                    name: "AutoNumber",
                    type: "autoNumber",
                },
                {
                    create: "onBaseCreate",
                    name: "barcode",
                    type: "barcode",
                },
                {
                    create: "onBaseCreate",
                    name: "checkbox",
                    type: "checkbox",
                    options: {
                        "color": "blueBright",
                        "icon": "check",
                    }
                },
                {
                    create: "afterBaseCreate",
                    name: "Count",
                    type: "count",
                    options: {
                        isValid: true,
                        recordLinkFieldId: "fldMultipleRecordLinks",
                    },
                },
                // {
                //     "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                //     "message": "Invalid options for Tasks.Created At: Creating createdTime fields is not supported at this time"
                // }
                {
                    create: "afterBaseCreate",
                    name: "CreatedBy",
                    type: "createdBy",
                },
                // {
                //     "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                //     "message": "Invalid options for Tasks.Created At: Creating createdTime fields is not supported at this time"
                // }
                {
                    create: "afterBaseCreate",
                    name: "CreatedTime",
                    type: "createdTime",
                },
                {
                    create: "onBaseCreate",
                    name: "currency",
                    type: "currency",
                    options: { precision: 2, symbol: "$" },
                },
                {
                    create: "onBaseCreate",
                    name: "date",
                    type: "date",
                    options: {
                        dateFormat: {
                            name: "iso",
                            format: "YYYY-MM-DD"
                        }
                    }
                },
                {
                    create: "onBaseCreate",
                    name: "dateTime",
                    type: "dateTime",
                    options: {
                        timeZone: "utc",
                        dateFormat: { name: "iso", format: "YYYY-MM-DD" },
                        timeFormat: { name: "24hour", format: "HH:mm" },
                    },
                },
                {
                    create: "onBaseCreate",
                    name: "duration",
                    type: "duration",
                    options: { durationFormat: "h:mm:ss" },
                },
                {
                    create: "onBaseCreate",
                    name: "email",
                    type: "email",
                },
                // {
                //     "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                //     "message": "Invalid options for AllTypes.Formula: Creating formula fields is not supported at this time"
                // }
                // {
                //     name: "Formula",
                //     type: "formula",
                //     options: {
                //         formula: "CONCATENATE({SingleLineText}, ' computed')",
                //     },
                // },
                // {
                //     "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                //     "message": "Invalid options for AllTypes.LastModifiedBy: Creating lastModifiedBy fields is not supported at this time"
                // }
                // {
                //     create: "manually",
                //     name: "LastModifiedBy",
                //     type: "lastModifiedBy",
                // },
                // {
                // "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                // "message": "Invalid options for Tasks.Updated At: Creating lastModifiedTime fields is not supported at this time"
                // }
                // {
                //     create: "manually",
                //     name: "LastModifiedTime",
                //     type: "lastModifiedTime",
                // },
                // {
                //     name: "Lookup",
                //     type: "multipleLookupValues",
                //     options: {
                //         recordLinkFieldId: "fldMultipleRecordLinks",
                //         fieldIdInLinkedTable: "fldName",
                //     },
                // },
                {
                    create: "onBaseCreate",
                    name: "multilineText",
                    type: "multilineText",
                },
                {
                    create: "onBaseCreate",
                    name: "multipleAttachments",
                    type: "multipleAttachments",
                },
                {
                    create: "onBaseCreate",
                    name: "multipleCollaborators",
                    type: "multipleCollaborators",
                },
                // {
                //     name: "MultipleRecordLinks",
                //     type: "multipleRecordLinks",
                //     description: "Links to LinkedItems table",
                //     options: {
                //         prefersSingleRecordLink: false,
                //         linkedTableId: "tblLinkedItems",
                //         inverseLinkFieldId: "fldFILLMEIN",
                //     },
                // },
                {
                    create: "onBaseCreate",
                    name: "multipleSelects",
                    type: "multipleSelects",
                    options: {
                        choices: [
                            { name: "Tag 1", color: "blueBright" },
                            { name: "Tag 2", color: "greenBright" },
                            { name: "Tag 3", color: "orangeBright" },
                        ],
                    },
                },
                {
                    create: "onBaseCreate",
                    name: "Number",
                    type: "number",
                    options: { precision: 5 },
                },
                {
                    create: "onBaseCreate",
                    name: "Percent",
                    type: "percent",
                    options: { precision: 2 },
                },
                {
                    create: "onBaseCreate",
                    name: "PhoneNumber",
                    type: "phoneNumber",
                },
                {
                    create: "onBaseCreate",
                    name: "Rating",
                    type: "rating",
                    options: { max: 10, icon: "star", color: "yellowBright" },
                },
                {
                    create: "onBaseCreate",
                    name: "RichText",
                    type: "richText",
                },
                // {
                //     name: "Rollup",
                //     type: "rollup",
                //     options: {
                //         recordLinkFieldId: "fldMultipleRecordLinks",
                //         fieldIdInLinkedTable: "fldFILLMEIN",
                //         isValid: true,
                //         result: {
                //             type: "number",
                //         },
                //     },
                // },
                {
                    create: "onBaseCreate",
                    name: "SingleCollaborator",
                    type: "singleCollaborator",
                },
                {
                    create: "onBaseCreate",
                    name: "SingleLineText",
                    type: "singleLineText",
                },
                {
                    create: "onBaseCreate",
                    name: "SingleSelect",
                    type: "singleSelect",
                    options: {
                        choices: [
                            { name: "Option A", color: "blueLight2" },
                            { name: "Option B", color: "greenLight2" },
                            { name: "Option C", color: "redLight2" },
                        ],
                    },
                },
                {
                    create: "onBaseCreate",
                    name: "URL",
                    type: "url",
                },
            ],
        },
    ],
};

/**
 * Create a new test base with all required tables via the Airtable Meta API.
 * Returns the created base metadata including base ID and table IDs.
 * 
 * This does NOT populate any data - it only creates the base and tables.
 *
 * @param workspaceId - The workspace ID where the base should be created
 * @param apiKey - Optional API key (defaults to AIRTABLE_API_KEY env var)
 * @returns The created base schema with all table and field IDs
 */
export async function createBase(
    workspaceId: WorkspaceId,
    apiKey?: string
): Promise<BaseSchema> {
    const fetcher = makeFetcher(apiKey);

    const {
        initialSchema,
        postCreateSchema
    } = partitionIntoInitialAndPostCreateFields(TEST_BASE_SCHEMA);
    // For now, verify that we have no post-create fields
    const badFields = postCreateSchema.tables.flatMap(t => t.fields);
    if (badFields.length > 0) {
        throw new Error(`Cannot create base - some fields cannot be created via the Meta API: ${JSON.stringify(badFields, null, 2)}`);
    }

    interface ApiResponseSuccess {
        id: BaseId
        tables: Array<TableSchema>
    }
    interface ApiResponseError {
        error: {
            type: string
            message?: string
        }
    }
    const response = await fetcher.fetch<ApiResponseSuccess | ApiResponseError>({
        path: "/meta/bases",
        method: "POST",
        data: initialSchema,
    });
    if ('error' in response) {
        throw new Error(`Error creating base: ${JSON.stringify(response.error, null, 2)}`)
    }
    return {
        id: response.id,
        name: TEST_BASE_SCHEMA.name,
        tables: response.tables,
    }
}


function partitionIntoInitialAndPostCreateFields(
    baseSchema: CreateBaseSchema
) {
    const initialTables = baseSchema.tables.map((table) => {
        const initialFields = table.fields.filter((field) => field.create === "onBaseCreate");
        return {
            ...table,
            fields: initialFields,
        };
    });
    const postCreateTables = baseSchema.tables.map((table) => {
        const postCreateFields = table.fields.filter((field) => field.create === "afterBaseCreate");
        return {
            ...table,
            fields: postCreateFields,
        };
    });
    const manuallyCreateTables = baseSchema.tables.map((table) => {
        const manualFields = table.fields.filter((field) => field.create === "manually");
        return {
            ...table,
            fields: manualFields,
        };
    });
    return {
        initialSchema: {
            ...baseSchema,
            tables: initialTables,
        },
        postCreateSchema: {
            ...baseSchema,
            tables: postCreateTables,
        },
        manuallyCreateSchema: {
            ...baseSchema,
            tables: manuallyCreateTables,
        },
    };
}

async function _createField({
    baseId,
    tableId,
    field,
    fetcher,
}: {
    baseId: BaseId;
    tableId: TableId;
    field: CreateFieldSchema;
    fetcher: ReturnType<typeof makeFetcher>;
}): Promise<FieldSchema> {
    const response = await fetcher.fetch<FieldSchema>({
        path: `/meta/bases/${baseId}/tables/${tableId}/fields`,
        method: "POST",
        data: {
            ...field,
        },
    });
    return response;
}