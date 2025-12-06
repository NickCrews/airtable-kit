import { IntoFetcher } from "../fetcher";
import { generateCode } from "../codegen";
import { type BaseId, type BaseSchema, type WorkspaceId } from "../types";
import { createField, fieldCreationAbility, updateField } from "../fields/api";
import { type FieldSchemaCreate, type FieldSchemaRead } from "../fields/types";
import { createTable, updateTable } from "../tables";
import { createBase, BaseSchemaCreate, getBaseSchema } from "../bases";
import dotenv from "dotenv";

// make this relative to the current file
const TEST_BASE_SCHEMA_FILEPATH = new URL("./test-base-schema.generated.ts", import.meta.url).pathname;

// Define the base structure to create
const TEST_BASE_SCHEMA: BaseSchemaCreate = {
    name: "airtable-kit Test Base",
    tables: [
        {
            name: "tasks",
            description: "Task tracking table",
            fields: [
                {
                    name: "name",
                    type: "singleLineText",
                    description: "The name of the task",
                },
                {
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
                    name: "priority",
                    type: "number",
                    description: "The priority level of the task. Lower numbers indicate higher priority.",
                    options: { precision: 0 },
                },
                {
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
                    name: "completed",
                    type: "checkbox",
                    description: "Whether the task is completed",
                    options: {
                        color: "greenBright",
                        icon: "check",
                    }
                },
                {
                    name: "notes",
                    type: "multilineText",
                    description: "Additional notes about the task",
                },
                {
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
                    name: "name",
                    type: "singleLineText",
                    description: "Item name",
                },
                {
                    name: "numberValue",
                    type: "number",
                    description: "Numeric value for rollup testing",
                    options: { precision: 0 },
                },
                {
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
                // {
                //     name: "AutoNumber",
                //     type: "autoNumber",
                // },
                {
                    name: "barcode",
                    type: "barcode",
                },
                {
                    name: "checkbox",
                    type: "checkbox",
                    options: {
                        "color": "blueBright",
                        "icon": "check",
                    }
                },
                // {
                //     name: "Count",
                //     type: "count",
                //     options: {
                //         isValid: true,
                //         recordLinkFieldId: "fldMultipleRecordLinks",
                //     },
                // },
                // {
                //     "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                //     "message": "Invalid options for Tasks.Created At: Creating createdTime fields is not supported at this time"
                // }
                // {
                //     name: "CreatedBy",
                //     type: "createdBy",
                // },
                // {
                //     "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                //     "message": "Invalid options for Tasks.Created At: Creating createdTime fields is not supported at this time"
                // }
                // {
                //     name: "CreatedTime",
                //     type: "createdTime",
                // },
                {
                    name: "currency",
                    type: "currency",
                    options: { precision: 2, symbol: "$" },
                },
                {
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
                    name: "dateTime",
                    type: "dateTime",
                    options: {
                        timeZone: "utc",
                        dateFormat: { name: "iso", format: "YYYY-MM-DD" },
                        timeFormat: { name: "24hour", format: "HH:mm" },
                    },
                },
                {
                    name: "duration",
                    type: "duration",
                    options: { durationFormat: "h:mm:ss" },
                },
                {
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
                //     
                //     name: "LastModifiedBy",
                //     type: "lastModifiedBy",
                // },
                // {
                // "type": "UNSUPPORTED_FIELD_TYPE_FOR_CREATE",
                // "message": "Invalid options for Tasks.Updated At: Creating lastModifiedTime fields is not supported at this time"
                // }
                // {
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
                    name: "multilineText",
                    type: "multilineText",
                },
                {
                    name: "multipleAttachments",
                    type: "multipleAttachments",
                },
                // {
                //     name: "multipleCollaborators",
                //     type: "multipleCollaborators",
                // },
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
                    name: "Number",
                    type: "number",
                    options: { precision: 5 },
                },
                {
                    name: "Percent",
                    type: "percent",
                    options: { precision: 2 },
                },
                {
                    name: "PhoneNumber",
                    type: "phoneNumber",
                },
                {
                    name: "Rating",
                    type: "rating",
                    options: { max: 10, icon: "star", color: "yellowBright" },
                },
                {
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
                    name: "SingleCollaborator",
                    type: "singleCollaborator",
                },
                {
                    name: "SingleLineText",
                    type: "singleLineText",
                },
                {
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
                    name: "URL",
                    type: "url",
                },
            ],
        },
    ],
};

// For now, ensure that we only are using fields that can be created anytime
// by the API. As our tests get more coverage, we will need to add
// a system to calculate dependency order and create fields in multiple passes.
const badFields: Array<{ table: string; field: string; type: string, ability: string }> = [];
for (const table of TEST_BASE_SCHEMA.tables) {
    for (const field of table.fields) {
        const ability = fieldCreationAbility(field.type);
        if (ability !== "anytime") {
            badFields.push({ table: table.name, field: field.name, type: field.type, ability });
        }
    }
}
if (badFields.length > 0) {
    throw new Error(
        `TEST_BASE_SCHEMA contains fields that cannot be created anytime via the API: ` +
        badFields.map(f => `Table "${f.table}", Field "${f.field}" (type: ${f.type}, ability: ${f.ability})`).join("; ")
    );
}

/**
 * Ensure that the test base ready for testing.
 * 
 * If the base doesn't exist, it is created.
 * If any tables or fields are missing, they are created.
 * If any field types are incorrect, we rename the entire table
 * (since neither changing the field type nor deleting fields is supported)
 * to a broken name for manual deletion,
 * and just create an entirely new table with the correct schema.
 * 
 * This finally codegens the actual base schema to disk for future runs.
 *
 * @param workspaceId - The workspace ID where the base should be created
 * @param apiKey - The API key to use for Airtable API requests
 * @returns The created base schema with all table and field IDs
 */
export async function ensureTestBaseReady(
    desiredSchema: BaseSchemaCreate,
    workspaceId: WorkspaceId,
    generatedSchemaPath: string,
    apiKey: string,
    baseId?: BaseId,
): Promise<BaseSchema> {
    const existingSchema = await ensureTestBaseCreated(workspaceId, apiKey, desiredSchema, baseId);
    const updatedSchema = await ensureTestBaseSchemaUpToDate(
        existingSchema,
        desiredSchema,
        apiKey
    );
    // There might be old tables with broken schemas left over - don't write
    // those to disk to keep the generated schema clean.
    const tablesNamesToKeep = desiredSchema.tables.map(t => t.name);
    updatedSchema.tables = updatedSchema.tables.filter(t => tablesNamesToKeep.includes(t.name));
    console.log(`Writing updated test base schema to ${generatedSchemaPath}...`);
    await generateCode(updatedSchema, { outPath: generatedSchemaPath });
    return updatedSchema;
}



/**
 * Look for the generated schema file. If it doesn't exist, create the test base.
 * 
 * This returns the ACTUAL schema of the base in airtable. The generated schema on disk
 * may be out of date if the base has been modified since generation.
 */
async function ensureTestBaseCreated(
    workspaceId: WorkspaceId,
    fetcher: IntoFetcher,
    desiredSchema: BaseSchemaCreate,
    baseId?: BaseId,
): Promise<BaseSchema> {
    if (baseId) {
        // If a base ID is provided, just use that
        return getBaseSchema({ baseId, fetcher });
    }
    try {
        // The module looks like:
        // export default {
        //   "id": "apprK003uuaGNkYHt",
        //   "name": "airtableKitTestBase",
        //   "tables": [...]
        // } as const;
        const module = await import(TEST_BASE_SCHEMA_FILEPATH);
        const baseId: BaseId | undefined = module.default.id;
        if (!baseId) {
            throw new Error(`Test base schema file ${TEST_BASE_SCHEMA_FILEPATH} is malformed`);
        }
        // now fetch the actual base schema from Airtable to ensure it's up to date
        return getBaseSchema({ baseId, fetcher });
    } catch (e) {
        // File doesn't exist - create the base
        console.log("Test base schema file not found, creating test base in Airtable...");
        return createBase({
            workspaceId,
            baseSchema: desiredSchema,
            fetcher,
        });
    }
}

async function ensureTestBaseSchemaUpToDate(
    currentSchema: BaseSchema,
    desiredSchema: BaseSchemaCreate,
    fetcher: IntoFetcher
): Promise<BaseSchema> {
    // Create any missing tables
    for (const desiredTable of desiredSchema.tables) {
        const existingTable = currentSchema.tables.find(t => t.name === desiredTable.name);
        if (!existingTable) {
            // Create the table
            console.log(`Creating missing table "${desiredTable.name}" in test base...`);
            const created = await createTable({
                baseId: currentSchema.id,
                table: desiredTable,
                fetcher,
            });
        } else {
            // If any field types are incorrect, rename the table to a broken name
            // for manual deletion, and create a new table with the correct schema.
            const mismatchesRequiringRecreation: Array<{ desiredField: FieldSchemaCreate; existingField: FieldSchemaRead, reason: "mismatch_type" | "mismatch_options" }> = [];
            const mismatchesRequiringUpdate: Array<{ desiredField: FieldSchemaCreate; existingField: FieldSchemaRead }> = [];
            const fieldsToCreate: FieldSchemaCreate[] = [];
            for (const desiredField of desiredTable.fields) {
                const existingField = existingTable.fields.find(f => f.name === desiredField.name);
                if (!existingField) {
                    // Field is missing - create it
                    fieldsToCreate.push(desiredField);
                } else {
                    // Check that the type and options match
                    if (existingField.type !== desiredField.type) {
                        mismatchesRequiringRecreation.push({ desiredField, existingField, reason: "mismatch_type" });
                        continue;
                    }
                    if (optionsMismatch(desiredField, existingField)) {
                        mismatchesRequiringRecreation.push({ desiredField, existingField, reason: "mismatch_options" });
                        continue;
                    }
                    // Check for name or description mismatches
                    if (existingField.name !== desiredField.name ||
                        existingField.description !== desiredField.description) {
                        mismatchesRequiringUpdate.push({ desiredField, existingField });
                    }
                }
            }
            if (mismatchesRequiringRecreation.length > 0) {
                console.log(`Recreating table "${desiredTable.name}" due to field mismatches: ${JSON.stringify(mismatchesRequiringRecreation, null, 2)}`);
                const brokenName = `BROKEN_${desiredTable.name}_${Date.now()}`;
                await updateTable({
                    baseId: currentSchema.id,
                    table: {
                        id: existingTable.id,
                        name: brokenName,
                    },
                    fetcher,
                });
                await createTable({
                    baseId: currentSchema.id,
                    table: desiredTable,
                    fetcher,
                });
            } else {
                // Create any missing fields
                for (const fieldToCreate of fieldsToCreate) {
                    console.log(`Creating missing field "${fieldToCreate.name}" in table "${desiredTable.name}"...`);
                    const newField = await createField({
                        baseId: currentSchema.id,
                        tableId: existingTable.id,
                        field: fieldToCreate,
                        fetcher,
                    });
                }
                // Update any fields with name/description mismatches
                for (const { desiredField, existingField } of mismatchesRequiringUpdate) {
                    console.log(`Updating field "${desiredField.name}" in table "${desiredTable.name}" to fix name/description...`);
                    await updateField({
                        baseId: currentSchema.id,
                        tableId: existingTable.id,
                        field: {
                            id: existingField.id,
                            name: desiredField.name,
                            description: desiredField.description,
                        },
                        fetcher,
                    });
                }
            }
        }
    }
    return getBaseSchema({ baseId: currentSchema.id, fetcher });
}

function optionsMismatch(desired: FieldSchemaCreate, existing: FieldSchemaRead): boolean {
    if (!("options" in desired) && !("options" in existing)) {
        return false;
    }
    // Some fields such as multipleAttachments don't allow you to pass `options: {isReversed: boolean}`
    // on creation, but the existing field will have that property.
    // This isn't a mismatch.
    if ("options" in existing && !("options" in desired)) {
        return false;
    }
    if ("options" in desired && !("options" in existing)) {
        throw new Error("Unexpected missing options in existing field");
    }
    let desiredOptions = (desired as any).options;
    let existingOptions = (existing as any).options;
    // for selects, remove the id from the choices
    if (desired.type === "singleSelect" || desired.type === "multipleSelects") {
        const removeIds = (opts: any) => {
            return {
                ...opts,
                choices: opts.choices.map((c: any) => {
                    const { id, ...rest } = c;
                    return rest;
                }),
            };
        }
        desiredOptions = removeIds(desiredOptions);
        existingOptions = removeIds(existingOptions);
    }
    // reorder keys for comparison
    const sortKeys = (obj: any): any => {
        if (obj === null || typeof obj !== "object") {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(sortKeys);
        }
        const sortedObj: any = {};
        Object.keys(obj).sort().forEach(key => {
            sortedObj[key] = sortKeys(obj[key]);
        });
        return sortedObj;
    }
    desiredOptions = sortKeys(desiredOptions);
    existingOptions = sortKeys(existingOptions);
    return JSON.stringify(desiredOptions) !== JSON.stringify(existingOptions);
}

async function main() {
    dotenv.config();
    const apiKey = process.env.AIRTABLE_KIT_TEST_API_KEY;
    if (!apiKey) {
        throw new Error("Missing AIRTABLE_KIT_TEST_API_KEY environment variable");
    }
    const workspaceId = process.env.AIRTABLE_KIT_TEST_WORKSPACE_ID;
    if (!workspaceId) {
        throw new Error("Missing AIRTABLE_KIT_TEST_WORKSPACE_ID environment variable");
    }
    const baseId = process.env.AIRTABLE_KIT_TEST_BASE_ID;
    await ensureTestBaseReady(
        TEST_BASE_SCHEMA,
        workspaceId as WorkspaceId,
        TEST_BASE_SCHEMA_FILEPATH,
        apiKey,
        baseId as BaseId | undefined
    );
}

if (import.meta.main) {
    main().catch(err => {
        console.error("Error ensuring test base is ready:", err);
        process.exit(1);
    });
}