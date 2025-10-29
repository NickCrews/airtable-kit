import { FieldId } from "./fields.js";
import { FieldSchema } from "./fields.js";

export type TableId = `tbl${string}`;
export type ViewId = `viw${string}`;

export interface TableSchema<
    I extends TableId = TableId,
    N extends string = string,
    F extends ReadonlyArray<FieldSchema> = ReadonlyArray<FieldSchema>,
> {
    id: I;
    name: N;
    primaryFieldId: FieldId;
    description?: string;
    fields: F;
    views: ReadonlyArray<ViewSchema>;
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
