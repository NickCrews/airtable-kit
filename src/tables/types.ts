import { type FieldSchemaRead, type FieldId } from "../fields/types.ts";

export type TableId = `tbl${string}`;
export type ViewId = `viw${string}`;

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
    F extends ReadonlyArray<FieldSchemaRead> = ReadonlyArray<FieldSchemaRead>,
> {
    /** Table ID, eg 'tblXXXXXXXXXXXXXX' */
    id: I;
    /** Friendly name to work with the table in your code */
    name: N;
    /** Array of {@link FieldSchemaRead} in the table */
    fields: F;
    primaryFieldId?: FieldId;
    description?: string;
    views?: ReadonlyArray<ViewSchema>;
}

export const VIEW_TYPES = [
    "grid",
    "form",
    "calendar",
    "gallery",
    "kanban",
    "timeline",
    "block",
] as const;
export type ViewType = typeof VIEW_TYPES[number];

export interface ViewSchema {
    id: ViewId;
    name: string;
    type: ViewType;
}