/**
 * airtable-kit - Type-safe Airtable client with runtime validation and code generation
 * 
 * https://github.com/NickCrews/airtable-kit
 */

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

export {
    makeTableClient,
    makeBaseClient,
    makeOrgClient,
    type TableClient,
    type TableClientOptions,
    type BaseClient,
    type BaseClientOptions,
    type OrgClient,
    type OrgClientOptions,
    type Fetcher,
    type IntoFetcher,
    makeFetcher,
    fetchBaseSchema,
} from "./client/index.ts";

export {
    generateCode,
    type CodegenOptions,
} from "./codegen/index.ts";

import * as validators from "./validators/index.ts";
export { validators };

import * as mcp from "./mcp/index.ts";
export { mcp };