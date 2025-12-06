import { type BaseSchema, type TableSchema } from "../types.ts";
import { IntoFetcher } from "../fetcher.ts";
import { TableClient, makeTableClient } from "./table-client.ts";
import { TableSchemaCreate, createTable, updateTable, UpdateTableSchema } from "../tables/index.ts";

type TableClientsByName<T extends ReadonlyArray<TableSchema>> = {
    [K in T[number]as K["name"]]: TableClient<K>;
};

type TabledIdInBase<T extends BaseSchema> = T['tables'][number]['id'];

/**
 * A client to interact with an Airtable base.
 *
 * This contains a value, `tables`, which is an object
 * mapping table names to their respective {@link TableClient}.
 */
export interface BaseClient<T extends BaseSchema = BaseSchema> {
    baseSchema: T;
    tables: TableClientsByName<T["tables"]>;

    /** Create a table in the base
     * 
     * @param tableSchema The schema of the table to create
     * @returns The created table's schema
     */
    createTable(tableSchema: TableSchemaCreate): Promise<TableSchema>;

    /** Update a table's name, description, or date dependency settings
     * 
     * @param tableSchema The updated schema of the table
     * @returns The updated table's schema
     */
    updateTable(tableSchema: UpdateTableSchema<TabledIdInBase<T>>): Promise<TableSchema>;
}

/**
 * Options for creating a {@link BaseClient} using {@link makeBaseClient}.
 */
export type BaseClientOptions<T extends BaseSchema> = {
    baseSchema: T;
    fetcher?: IntoFetcher;
};

/**
 * Create a {@link BaseClient} for an Airtable base.
 *
 * Example usage:
 * ```typescript
 * import { makeBaseClient } from 'airtable-kit';
 * import myBaseSchema from './schemas/myBase';
 * 
 * const client = makeBaseClient({
 *   baseSchema: myBaseSchema,
 *   fetcher: YOUR_API_KEY,
 * });
 * ```
 */
export function makeBaseClient<T extends BaseSchema>(
    {
        baseSchema,
        fetcher,
    }: BaseClientOptions<T>,
): BaseClient<T> {
    const tables = Object.fromEntries(
        baseSchema.tables.map((tableSchema) => {
            const client = makeTableClient({
                baseId: baseSchema.id,
                tableSchema,
                fetcher,
            });
            return [tableSchema.name, client];
        }),
    ) as TableClientsByName<T["tables"]>;
    return {
        baseSchema,
        tables,
        createTable(tableSchema: TableSchemaCreate) {
            return createTable({
                baseId: baseSchema.id,
                table: tableSchema,
                fetcher,
            });
        },
        updateTable(tableSchema: UpdateTableSchema<TabledIdInBase<T>>) {
            return updateTable({
                baseId: baseSchema.id,
                table: tableSchema,
                fetcher,
            });
        },
    };
}
