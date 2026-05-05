import { TableSchema } from "../tables/types";

export type BaseId = `app${string}`;

export interface BaseSchema<I extends BaseId = BaseId, T extends ReadonlyArray<TableSchema> = ReadonlyArray<TableSchema>> {
    id: I;
    name: string;
    tables: T;
}