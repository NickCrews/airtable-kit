import { BaseId } from "../bases/types";
import type { Requester } from "../request.ts";
import { FieldSchemaCreate } from "../fields";
import { TableId, TableSchema } from "./types";


export interface TableSchemaCreate {
    /** The name of the table to create */
    name: string,
    /** An optional description for the table */
    description?: string
    /** The fields in the table to create */
    fields: Array<FieldSchemaCreate>
}

export interface CreateTableParams {
    baseId: BaseId;
    table: TableSchemaCreate;
}

export interface UpdateTableSchema<T extends TableId = TableId> {
    id: T;
    name?: string;
    description?: string;
    dateDependencySettings?: any;
}

export interface UpdateTableParams {
    baseId: BaseId;
    table: UpdateTableSchema;
}

/** Methods for the Airtable tables API, available as `airtable.tables`. */
export interface TablesApi {
    /** Create a table in a base. */
    create(params: CreateTableParams): Promise<TableSchema>;
    /** Update a table's name, description, or date dependency settings. */
    update(params: UpdateTableParams): Promise<TableSchema>;
}

export function makeTablesApi(request: Requester): TablesApi {
    return {
        // https://airtable.com/developers/web/api/create-table
        create({ baseId, table }) {
            return request<TableSchema>({
                path: `/meta/bases/${baseId}/tables`,
                method: "POST",
                data: table,
            });
        },
        // https://airtable.com/developers/web/api/update-table
        update({ baseId, table }) {
            return request<TableSchema>({
                path: `/meta/bases/${baseId}/tables/${table.id}`,
                method: "PATCH",
                data: {
                    name: table.name || undefined,
                    description: table.description || undefined,
                    dateDependencySettings: table.dateDependencySettings || undefined,
                },
            });
        },
    };
}
