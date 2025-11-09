import { type FieldSchema } from "./fields/types.ts";

export { FieldSchema };
export { type FieldType } from "./fields/types.ts";

export type RecordId = `rec${string}`;
export type FieldId = `fld${string}`;
export type TableId = `tbl${string}`;
export type ViewId = `viw${string}`;
export type BaseId = `app${string}`;
export type WorkspaceId = `wsp${string}`;
export type SelectId = `sel${string}`;
export type AttachmentId = `att${string}`;

/**
 * Schema for an Airtable table.
 * 
 * @typeParam I - Table ID type
 * @typeParam N - Table name type
 * @typeParam F - Array of field schemas in the table
 */
export interface TableSchema<
    I extends TableId = TableId,
    N extends string = string,
    F extends ReadonlyArray<FieldSchema> = ReadonlyArray<FieldSchema>,
> {
    /** Table ID, eg 'tblXXXXXXXXXXXXXX' */
    id: I;
    /** Friendly name to work with the table in your code */
    name: N;
    /** Array of {@link FieldSchema} in the table */
    fields: F;
    primaryFieldId?: FieldId;
    description?: string;
    views?: ReadonlyArray<ViewSchema>;
}

export type ViewType =
    | "grid"
    | "form"
    | "calendar"
    | "gallery"
    | "kanban"
    | "timeline"
    | "block";

export interface ViewSchema {
    id: ViewId;
    name: string;
    type: ViewType;
}

export interface BaseSchema<I extends BaseId = BaseId> {
    id: I;
    name: string;
    tables: ReadonlyArray<TableSchema>;
}