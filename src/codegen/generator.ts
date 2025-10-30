/**
 * Code generator - generate static TypeScript code from Airtable schema
 */

import { type BaseSchema } from "../schema/bases.ts";

export interface CodegenOptions {
    filetype?: "ts" | "js";
}

export function generateCode(schema: BaseSchema, options?: CodegenOptions): string {
    const filetype = options?.filetype || "ts";
    const asConstModifier = filetype === "ts" ? " as const" : "";
    return `/**
 * Auto-generated from Airtable schema
 * Do not edit manually
 */

export default ${JSON.stringify(schema, null, 2)}${asConstModifier};
`;
}