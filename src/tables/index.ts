export {
    type TableSchemaCreate,
    type CreateTableParams,
    createTable,
    type UpdateTableSchema,
    type UpdateTableParams,
    updateTable,
} from "./api.ts";
export {
    type TableClient,
    type TableClientOptions,
    makeTableClient,
} from "../tables/table-client.ts";
export {
    type TableId,
    type ViewId,
    type TableSchema,
    type ViewSchema,
    type ViewType,
    VIEW_TYPES,
} from "./types.ts";