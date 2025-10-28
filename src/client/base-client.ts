import { BaseId } from "../schema/bases.ts";
import { TableSchema } from "../schema/tables.ts";
import { IntoFetcher } from "./fetcher.ts";
import { TableClient, tableClient } from "./table-client.ts";

type TableClients<T extends ReadonlyArray<TableSchema>> = {
    [K in T[number] as K["name"]]: TableClient<K["fields"]>;
};

export interface BaseClient<
    I extends BaseId,
    T extends ReadonlyArray<TableSchema>,
> {
    baseId: I;
    tables: TableClients<T>;
}

export type BaseClientOptions<
    I extends BaseId,
    T extends ReadonlyArray<TableSchema>,
> = {
    baseId: I;
    tables: T;
    fetcher?: IntoFetcher;
};

export function baseClient<
    I extends BaseId,
    T extends ReadonlyArray<TableSchema>,
>(
    {
        baseId,
        tables: tableSchemas,
        fetcher,
    }: BaseClientOptions<I, T>,
): BaseClient<I, T> {
    const tables = Object.fromEntries(
        tableSchemas.map((tableSchema) => {
            const client = tableClient({
                baseId,
                tableId: tableSchema.id,
                fieldSpecs: tableSchema.fields,
                fetcher,
            });
            return [tableSchema.name, client];
        }),
    ) as TableClients<T>;
    return {
        baseId,
        tables,
    };
}
