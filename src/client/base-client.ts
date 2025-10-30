import { BaseSchema } from "../schema/bases.ts";
import { TableSchema } from "../schema/tables.ts";
import { IntoFetcher } from "./fetcher.ts";
import { TableClient, tableClient } from "./table-client.ts";

type TableClients<T extends ReadonlyArray<TableSchema>> = {
    [K in T[number]as K["name"]]: TableClient<K>;
};

export interface BaseClient<T extends BaseSchema> {
    baseSchema: T;
    tables: TableClients<T["tables"]>;
}

export type BaseClientOptions<T extends BaseSchema> = {
    baseSchema: T;
    fetcher?: IntoFetcher;
};

export function baseClient<T extends BaseSchema>(
    {
        baseSchema,
        fetcher,
    }: BaseClientOptions<T>,
): BaseClient<T> {
    const tables = Object.fromEntries(
        baseSchema.tables.map((tableSchema) => {
            const client = tableClient({
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
