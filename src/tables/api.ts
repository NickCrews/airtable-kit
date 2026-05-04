import { IntoFetcher, makeFetcher } from "../fetcher";
import { FieldSchemaCreate } from "../fields";
import { BaseId, TableId, TableSchema } from "../types";


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
    fetcher?: IntoFetcher;
}

export async function createTable({
    baseId,
    table,
    fetcher: intoFetcher,
}: CreateTableParams): Promise<TableSchema> {
    type ErrorResponse = {
        error: {
            type: string
            message?: string
        }
    }
    const fetcher = makeFetcher(intoFetcher);
    const response = await fetcher.fetch<TableSchema | ErrorResponse>({
        // https://airtable.com/developers/web/api/create-table
        path: `/meta/bases/${baseId}/tables`,
        method: "POST",
        data: table,
    });
    if ('error' in response) {
        throw new Error(`Error creating table: ${JSON.stringify(response.error, null, 2)}`)
    }
    return response;
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
    fetcher?: IntoFetcher;
}

export async function updateTable({
    baseId,
    table,
    fetcher: intoFetcher,
}: UpdateTableParams): Promise<TableSchema> {
    const fetcher = makeFetcher(intoFetcher);
    const response = await fetcher.fetch<TableSchema>({
        // https://airtable.com/developers/web/api/update-table
        path: `/meta/bases/${baseId}/tables/${table.id}`,
        method: "PATCH",
        data: {
            name: table.name || undefined,
            description: table.description || undefined,
            dateDependencySettings: table.dateDependencySettings || undefined,
        },
    });
    return response;
}