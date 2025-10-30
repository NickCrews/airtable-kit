/**
 * Schema module - fetch and manage Airtable base schemas
 */

export * as fields from "./fields.ts";
export {
    type TableSchema,
    type TableId,
} from "./tables.ts";
export {
    type BaseSchema,
    type BaseId,
} from "./bases.ts";
export { fetchBaseSchema } from "./fetcher.ts";
