import { BaseSchema } from "../schema/bases.ts";
import { IntoFetcher } from "./fetcher.ts";
import { BaseClient, baseClient } from "./base-client.ts";

type BaseClients<T extends ReadonlyArray<BaseSchema>> = {
    [K in T[number] as K["name"]]: BaseClient<K["id"], K["tables"]>;
};

/**
 * A client to interact with all the bases within an Airtable organization.
 *
 * This contains a value, `bases`, which is an object
 * mapping base names to their respective {@link BaseClient}.
 */
export interface OrgClient<T extends ReadonlyArray<BaseSchema>> {
    bases: BaseClients<T>;
}

/**
 * Options for creating an {@link OrgClient}.
 */
export type OrgClientOptions<T extends ReadonlyArray<BaseSchema>> = {
    bases: T;
    fetcher?: IntoFetcher;
};

/**
 * Create an {@link OrgClient} for an Airtable organization.
 */
export function orgClient<T extends ReadonlyArray<BaseSchema>>(
    {
        bases: baseSchemas,
        fetcher,
    }: OrgClientOptions<T>,
): OrgClient<T> {
    const bases = Object.fromEntries(
        baseSchemas.map((baseSchema) => {
            const client = baseClient({
                baseId: baseSchema.id,
                tables: baseSchema.tables,
                fetcher,
            });
            return [baseSchema.name, client];
        }),
    ) as BaseClients<T>;
    return {
        bases,
    };
}
