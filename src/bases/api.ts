import type { Requester } from "../request.ts";
import { TableSchemaCreate } from "../tables/api.ts";
import { URLSearchParams } from "../url.ts";
import { BaseId, BaseSchema } from "./types.ts";
import { TableSchema } from "../tables/types.ts";
import { WorkspaceId } from "../workspaces/types.ts";

export interface BaseSchemaCreate {
  /** The name of the base to create */
  name: string,
  /** The tables in the base to create */
  tables: Array<TableSchemaCreate>
}

export interface CreateBaseParams {
  /** The ID of the workspace where the base should be created */
  workspaceId: WorkspaceId,
  /** The schema of the base to create */
  schema: BaseSchemaCreate,
}

export type PermissionLevel = "none" | "read" | "comment" | "edit" | "create";

/** A base as returned by {@link BasesApi.list} */
export interface BaseSummary {
  id: BaseId;
  name: string;
  permissionLevel: PermissionLevel;
}

/** Methods for the Airtable bases API, available as `airtable.bases`. */
export interface BasesApi {
  /** List all bases the API key can access. Pagination is handled automatically. */
  list(): Promise<BaseSummary[]>;
  /** Get the {@link BaseSchema} of a base, including all of its tables and fields. */
  get(baseId: BaseId): Promise<BaseSchema>;
  /** Get the {@link BaseSchema} of every base the API key can access. */
  listSchemas(): Promise<BaseSchema[]>;
  /** Create a new base, returning its schema with all table and field IDs. */
  create(params: CreateBaseParams): Promise<BaseSchema>;
}

export function makeBasesApi(request: Requester): BasesApi {
  // https://airtable.com/developers/web/api/get-base-schema
  async function getTables(baseId: BaseId): Promise<TableSchema[]> {
    const response = await request<{ tables: TableSchema[] }>({ path: `/meta/bases/${baseId}/tables` });
    return response.tables;
  }

  // https://airtable.com/developers/web/api/list-bases
  async function list(): Promise<BaseSummary[]> {
    const result: BaseSummary[] = [];
    let offset: string | undefined = undefined;
    do {
      const queryParams = new URLSearchParams();
      if (offset) {
        queryParams.append("offset", offset);
      }
      const response: { bases: BaseSummary[]; offset?: string } = await request({
        path: `/meta/bases?${queryParams.toString()}`,
      });
      result.push(...response.bases);
      offset = response.offset;
    } while (offset);
    return result;
  }

  return {
    list,
    async get(baseId) {
      const [tables, bases] = await Promise.all([getTables(baseId), list()]);
      const name = bases.find((b) => b.id === baseId)?.name;
      if (!name) {
        throw new Error(`Could not find base name for base ID ${baseId}`);
      }
      return { id: baseId, name, tables };
    },
    async listSchemas() {
      const bases = await list();
      return Promise.all(
        bases.map(async (base) => ({
          id: base.id,
          name: base.name,
          tables: await getTables(base.id),
        })),
      );
    },
    // https://airtable.com/developers/web/api/create-base
    async create({ workspaceId, schema }) {
      const response = await request<{ id: BaseId; tables: TableSchema[] }>({
        path: "/meta/bases",
        method: "POST",
        data: {
          workspaceId,
          name: schema.name,
          tables: schema.tables,
        },
      });
      return {
        id: response.id,
        name: schema.name,
        tables: response.tables,
      };
    },
  };
}
