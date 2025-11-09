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
    type Formula,
    formulaToString,
} from "./formula/index.ts";

export {
    convertFieldForRead,
    convertFieldForWrite,
    convertRecordForRead,
    convertRecordForWrite,
    type FieldRead,
    type FieldWrite,
    type RecordRead,
    type RecordWrite,
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