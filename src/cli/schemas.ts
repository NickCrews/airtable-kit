import { type Airtable } from "../client.ts";
import { type BaseSchema } from "../bases/types.ts";

/** Get the schema of every base the client's API key can access. */
export async function getAllBaseSchemas(airtable: Airtable): Promise<BaseSchema[]> {
  const bases = await airtable.bases.list();
  return Promise.all(bases.map((base) => airtable.bases.get(base)));
}
