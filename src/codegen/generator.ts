/**
 * Code generator - generate static TypeScript code from Airtable schema
 */

import fs from "node:fs/promises";
import path from "node:path";
import { type BaseSchema } from "../types.ts";
import { getBaseSchema } from "../bases";
import { toIdentifier } from "./identifiers.ts";

export interface CodegenOptions {
    outPath?: string;
    format?: "ts" | "js";
    escapeIdentifiers?: undefined | false | ((rawName: string) => string);
}

/**
 * Generate ts/js code representing the Airtable base schema.
 * 
 * @param schema The {@link BaseSchema} to generate code for. eg obtained from {@link getBaseSchema}
 * @param options.outPath Optional output path to write the generated code to a file.
 *                        If not provided, the code will only be returned as a string.
 * @param options.format Output file type, either "ts" or "js".
 *                       If not provided, will be inferred from outPath if possible,
 *                       otherwise defaults to "ts".
 * @param options.escapeIdentifiers Optional function to escape raw names to valid identifiers.
 *                                  This will be used on base name, table names, and field names.
 *                                  If not provided, a default function will be used.
 *                                  If set to false, no escaping will be done.
 * @returns A Promise of the generated code as a string, eg to be written to a .ts or .js file.
 */
export async function generateCode(schema: BaseSchema, options?: CodegenOptions) {
    const format = options?.format || (options?.outPath?.endsWith(".js") ? "js" : "ts") || "ts";
    const asConstModifier = format === "ts" ? " as const" : "";
    const namesSafeSchema = namesToIdentifiers(schema, options?.escapeIdentifiers);
    const result = `/**
 * Auto-generated from Airtable schema
 * Do not edit manually
 */

export default ${JSON.stringify(namesSafeSchema, null, 2)}${asConstModifier};
`;
    if (options?.outPath) {
        const outputDir = path.dirname(options.outPath);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(options.outPath, result, "utf-8");
    }
    return result;
}

/**
 * escape all of the
 * - base name
 * - table names
 * - field names
 */
function namesToIdentifiers(schema: BaseSchema, escapeIdentifiers: CodegenOptions["escapeIdentifiers"]): BaseSchema {
    let escape;
    if (escapeIdentifiers === false) {
        escape = (n: string) => n;
        // if otherwise falsy, use default
    } else if (!escapeIdentifiers) {
        escape = toIdentifier;
    } else {
        escape = escapeIdentifiers;
    }
    return {
        ...schema,
        name: escape(schema.name),
        tables: schema.tables.map((table) => ({
            ...table,
            name: escape(table.name),
            fields: table.fields.map((field) => ({
                ...field,
                name: escape(field.name),
            })),
        })),
    };
}
