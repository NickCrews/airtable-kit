import { type TableSchema } from "./tables.js";
import { type BaseSchema, type BaseId } from "./bases.js";
import { type IntoFetcher, createFetcher } from "../client/fetcher.js";

/**
 * Fetch the schema of a base by its ID.
 */
export async function fetchBaseSchema(args: {
  baseId: BaseId;
  fetcher: IntoFetcher;
  baseName: string;
}): Promise<BaseSchema>;

export async function fetchBaseSchema(args: {
  baseId: BaseId;
  fetcher: IntoFetcher;
  baseName?: undefined;
}): Promise<Omit<BaseSchema, "name">>;

export async function fetchBaseSchema({
  baseId, fetcher, baseName,
}: {
  baseId: BaseId, fetcher: IntoFetcher, baseName?: string | undefined,
}
): Promise<BaseSchema | Omit<BaseSchema, "name">> {
  const path = `/meta/bases/${baseId}/tables`;
  const realFetcher = createFetcher(fetcher);
  const response = await realFetcher.fetch({ path });

  const raw = {
    id: baseId,
    tables: (response as { tables: unknown[] }).tables as TableSchema[],
  };
  if (baseName !== undefined) {
    return { ...raw, name: baseName };
  }
  return raw;
}
