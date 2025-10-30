import { type TableSchema } from "./tables.js";
import { type BaseSchema, type BaseId } from "./bases.js";
import { type IntoFetcher, createFetcher } from "../client/fetcher.js";

/**
 * Fetch the schema of a base by its ID.
 * 
 * @param params.baseId The ID of the base to fetch the schema for.
 * @param params.fetcher The fetcher to use for making API requests.
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
  const realFetcher = createFetcher(fetcher);
  const response = await realFetcher.fetch({ path });

  return {
    id: baseId,
    name: baseName ?? baseId,
    tables: (response as { tables: unknown[] }).tables as TableSchema[],
  };
}
