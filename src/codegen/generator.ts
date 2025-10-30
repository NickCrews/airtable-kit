/**
 * Code generator - generate static TypeScript code from Airtable schema
 */

import fs from "node:fs/promises";
import path from "node:path";
import { type BaseSchema } from "../types.ts";
import { fetchBaseSchema } from "../client/index.ts";

export interface CodegenOptions {
    outPath?: string;
    filetype?: "ts" | "js";
}

/**
 * Generate ts/js code representing the Airtable base schema.
 * 
 * @param schema The {@link BaseSchema} to generate code for. eg obtained from {@link fetchBaseSchema}
 * @param options.outPath Optional output path to write the generated code to a file.
 *                        If not provided, the code will only be returned as a string.
 * @param options.filetype Output file type, either "ts" or "js".
 *                         If not provided, will be inferred from outPath if possible,
 *                         otherwise defaults to "ts".
 * @returns A Promise of the generated code as a string, eg to be written to a .ts or .js file.
 */
export async function generateCode(schema: BaseSchema, options?: CodegenOptions) {
    const filetype = options?.filetype || (options?.outPath?.endsWith(".js") ? "js" : "ts") || "ts";
    const asConstModifier = filetype === "ts" ? " as const" : "";
    const result = `/**
 * Auto-generated from Airtable schema
 * Do not edit manually
 */

export default ${JSON.stringify(schema, null, 2)}${asConstModifier};
`;
    if (options?.outPath) {
        const outputDir = path.dirname(options.outPath);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(options.outPath, result, "utf-8");
    }
    return result;
}