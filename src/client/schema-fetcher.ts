import { type TableSchema, type BaseSchema, type BaseId } from "../types.ts";
import { Fetcher, type IntoFetcher, makeFetcher } from "./fetcher.ts";

/**
 * Fetch the schema of a base by its ID.
 * 
 * @param params.baseId The ID of the base to fetch the schema for, eg 'appXXXXXXXXXXXXXX'.
 * @param params.fetcher The {@link IntoFetcher} to use for making API requests.
 * @returns A promise that resolves to the {@link BaseSchema} of the specified base.
 */
export async function fetchBaseSchema({
  baseId, fetcher,
}: {
  baseId: BaseId, fetcher: IntoFetcher,
}
): Promise<BaseSchema> {
  const path = `/meta/bases/${baseId}/tables`;
  const realFetcher = makeFetcher(fetcher);
  const response = await realFetcher.fetch<{ tables: TableSchema[] }>({ path });
  const allBases = await listBasesRaw(realFetcher);
  const baseName = allBases.find((b) => b.id === baseId)?.name;
  if (!baseName) {
    throw new Error(`Could not find base name for base ID ${baseId}`);
  }

  return {
    id: baseId,
    name: baseName,
    tables: response.tables,
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
  const realFetcher = makeFetcher(fetcher);
  const bases = await listBasesRaw(realFetcher);

  // now fetch all the base schemas in parallel
  const baseSchemas = await Promise.all(
    bases.map(async (base) => {
      const schema = await getBaseRaw({
        baseId: base.id,
        fetcher: realFetcher,
      });
      return {
        id: base.id,
        name: base.name,
        tables: schema.tables,
      };
    })
  );
  return baseSchemas;
}

async function getBaseRaw({
  baseId, fetcher,
}: {
  baseId: BaseId, fetcher: IntoFetcher,
}
) {
  const path = `/meta/bases/${baseId}/tables`;
  const realFetcher = makeFetcher(fetcher);
  const response = await realFetcher.fetch<{ tables: TableSchema[] }>({ path });
  return {
    id: baseId,
    tables: response.tables,
  };
}


async function listBasesRaw(fetcher: Fetcher): Promise<Array<{
  id: BaseId;
  name: string;
  permissionLevel: "none" | "read" | "comment" | "edit" | "create";
}>> {
  type ApiResponse = {
    bases: {
      id: BaseId;
      name: string;
      permissionLevel: "none" | "read" | "comment" | "edit" | "create";
    }[];
    offset?: string;
  };
  const result = [];
  let offset: string | undefined = undefined;
  do {
    const queryParams = new URLSearchParams();
    if (offset) {
      queryParams.append("offset", offset);
    }
    const path = `/meta/bases?${queryParams.toString()}`;
    const response = await fetcher.fetch<ApiResponse>({ path });
    result.push(...response.bases);
    offset = response.offset;
  } while (offset);
  return result;
}