/**
 * airtable-kit - Type-safe Airtable client with runtime validation and code generation
 * 
 * https://github.com/NickCrews/airtable-kit
 */

export { fetchBaseSchema } from "./client/schema-fetcher.ts";
export {
    type FieldId,
    type TableId,
    type ViewId,
    type BaseId,
    type FieldSchema,
    type FieldType,
    type TableSchema,
    type ViewSchema,
    type BaseSchema,
    type ViewType,
} from "./types.ts";

import * as validators from "./validators/index.ts";
export { validators };

import * as client from "./client/index.ts";
export { client };

import * as mcp from "./mcp/index.ts";
export { mcp };

import * as codegen from "./codegen/index.ts";
export { codegen };