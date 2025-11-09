import { type BaseSchema, type TableSchema } from "../types.ts";
import { IntoFetcher } from "./fetcher.ts";
import { TableClient, makeTableClient } from "./table-client.ts";

type TableClients<T extends ReadonlyArray<TableSchema>> = {
    [K in T[number]as K["name"]]: TableClient<K>;
};

/**
 * A client to interact with an Airtable base.
 *
 * This contains a value, `tables`, which is an object
 * mapping table names to their respective {@link TableClient}.
 */
export interface BaseClient<T extends BaseSchema = any> {
    baseSchema: T;
    tables: TableClients<T["tables"]>;
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
    ) as TableClients<T["tables"]>;
    return {
        baseSchema,
        tables,
    };
}
