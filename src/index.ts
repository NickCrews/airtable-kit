/**
 * airtable-kit - Type-safe Airtable client with runtime validation and code generation
 * 
 * https://github.com/NickCrews/airtable-kit
 */

export {
    type RecordId,
    type FieldId,
    type TableId,
    type ViewId,
    type BaseId,
    type FieldSchema,
    type FieldType,
    type TableSchema,
    type ViewSchema,
    type BaseSchema,
    type WorkspaceId,
    type ViewType,
} from "./types.ts";

export {
    type Fetcher,
    type IntoFetcher,
    type FetchArgs,
    type FetchFunction,
    makeFetcher,
} from "./fetcher.ts";

export {
    type GetBaseSchemaParams,
    getBaseSchema,
    type CreateBaseSchema,
    type CreateBaseOptions,
    createBase,
    fetchAllSchemas
} from "./bases/api.ts";

export {
    type Formula,
    formulaToString,
} from "./formula/index.ts";

export {
    convertFieldForRead,
    convertFieldForWrite,
    type FieldRead,
    type FieldWrite,
} from "./fields/converters.ts";
export {
    type RecordRead,
    type RecordWrite,
    convertRecordForRead,
    convertRecordForWrite,
} from "./records/index.ts";

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
} from "./client/index.ts";

export {
    generateCode,
    type CodegenOptions,
} from "./codegen/index.ts";