import { type TableSchema } from "./tables.ts";
import { type BaseSchema } from "./bases.ts";
import { type Fetcher } from "../client/fetcher.ts";

export async function fetchBaseSchema(
  baseId: string,
  fetcher: Fetcher,
): Promise<Omit<BaseSchema, "name">> {
  const path = `/meta/bases/${baseId}/tables`;
  const response = await fetcher.fetch({ path });

  return {
    id: baseId as `app${string}`,
    tables: (response as { tables: unknown[] }).tables as TableSchema[],
  };
}
