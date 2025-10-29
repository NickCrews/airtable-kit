import { type TableSchema } from "./tables.js";
import { type BaseSchema } from "./bases.js";
import { type IntoFetcher, createFetcher } from "../client/fetcher.js";

export async function fetchBaseSchema(
  baseId: string,
  fetcher: IntoFetcher,
): Promise<Omit<BaseSchema, "name">> {
  const path = `/meta/bases/${baseId}/tables`;
  const realFetcher = createFetcher(fetcher);
  const response = await realFetcher.fetch({ path });

  return {
    id: baseId as `app${string}`,
    tables: (response as { tables: unknown[] }).tables as TableSchema[],
  };
}
