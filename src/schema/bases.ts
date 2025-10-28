import { TableSchema } from "./tables.ts";

export type BaseId = `app${string}`;

export interface BaseSchema<I extends BaseId = BaseId> {
    id: I;
    name: string;
    tables: ReadonlyArray<TableSchema>;
}
