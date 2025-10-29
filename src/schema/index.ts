/**
 * Schema module - fetch and manage Airtable base schemas
 */

export * as fields from "./fields.js";
export {
    type TableSchema,
    type TableId,
} from "./tables.js";
export {
    type BaseSchema,
    type BaseId,
} from "./bases.js";
export { fetchBaseSchema } from "./fetcher.js";
