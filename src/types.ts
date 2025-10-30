import { type FieldSchema } from "./fields/types.ts";

export { FieldSchema };
export { type FieldType } from "./fields/types.ts";

export type FieldId = `fld${string}`;
export type TableId = `tbl${string}`;
export type ViewId = `viw${string}`;
export type BaseId = `app${string}`;

export interface TableSchema<
    I extends TableId = TableId,
    N extends string = string,
    F extends ReadonlyArray<FieldSchema> = ReadonlyArray<FieldSchema>,
> {
    id: I;
    name: N;
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