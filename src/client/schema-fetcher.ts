import { type TableSchema, type BaseSchema, type BaseId } from "../types.ts";
import { type IntoFetcher, makeFetcher } from "./fetcher.ts";

/**
 * Fetch the schema of a base by its ID.
 * 
 * @param params.baseId The ID of the base to fetch the schema for, eg 'appXXXXXXXXXXXXXX'.
 * @param params.fetcher The {@link IntoFetcher} to use for making API requests.
 * @param params.baseName Optional name of the base; if not provided, the base ID will be used as the name.
 * @returns A promise that resolves to the {@link BaseSchema} of the specified base.
 */
export async function fetchBaseSchema({
  baseId, fetcher, baseName,
}: {
  baseId: BaseId, fetcher: IntoFetcher, baseName?: string | undefined,
}
): Promise<BaseSchema> {
  const path = `/meta/bases/${baseId}/tables`;
  const realFetcher = makeFetcher(fetcher);
  const response = await realFetcher.fetch({ path });

  return {
    id: baseId,
    name: baseName ?? baseId,
    tables: (response as { tables: unknown[] }).tables as TableSchema[],
  };
}

/**
 * Fetch the schemas of all bases accessible with the provided fetcher.
 * 
 * @param params.fetcher The {@link IntoFetcher} to use for making API requests.
 * @returns A promise that resolves to an array of {@link BaseSchema} objects.
 */
export async function fetchAllSchemas({ fetcher }: { fetcher: IntoFetcher }
): Promise<BaseSchema[]> {
  // https://airtable.com/developers/web/api/list-bases
  type RawResponse = {
    bases: {
      id: BaseId;
      name: string;
      permissionLevel: "none" | "read" | "comment" | "edit" | "create";
    }[];
    // Returns in batches of 1000 at a time, so I'm not implementing pagination yet
    offset?: string;
  };
  const path = `/meta/bases`;
  const realFetcher = makeFetcher(fetcher);
  const response = await realFetcher.fetch<RawResponse>({ path });

  // now fetch all the base schemas in parallel
  const baseSchemas = await Promise.all(
    response.bases.map(async (base) => {
      const schema = await fetchBaseSchema({
        baseId: base.id,
        fetcher: realFetcher,
        baseName: base.name,
      });
      return schema;
    })
  );
  return baseSchemas;
}