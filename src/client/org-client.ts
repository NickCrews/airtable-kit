import { type BaseSchema } from "../types.ts";
import { IntoFetcher } from "./fetcher.ts";
import { BaseClient, makeBaseClient } from "./base-client.ts";

type BaseClients<T extends ReadonlyArray<BaseSchema>> = {
    [K in T[number]as K["name"]]: BaseClient<K>;
};

/**
 * A client to interact with multiple Airtable bases.
 *
 * This is usually created by passing {@link OrgClientOptions} to {@link makeOrgClient}.
 *
 * This contains a value, `bases`, which is an object
 * mapping base names to their respective {@link BaseClient}.
 */
export interface OrgClient<T extends ReadonlyArray<BaseSchema>> {
    bases: BaseClients<T>;
}

/**
 * Options for creating an {@link OrgClient} using {@link makeOrgClient}.
 */
export type OrgClientOptions<T extends ReadonlyArray<BaseSchema>> = {
    bases: T;
    fetcher?: IntoFetcher;
};

/**
 * Create an {@link OrgClient} for an Airtable organization.
 */
export function makeOrgClient<T extends ReadonlyArray<BaseSchema>>(
    {
        bases: baseSchemas,
        fetcher,
    }: OrgClientOptions<T>,
): OrgClient<T> {
    const bases = Object.fromEntries(
        baseSchemas.map((baseSchema) => {
            const client = makeBaseClient({ baseSchema, fetcher });
            return [baseSchema.name, client];
        }),
    ) as BaseClients<T>;
    return {
        bases,
    };
}
