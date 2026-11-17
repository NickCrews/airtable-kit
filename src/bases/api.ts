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
  /** Aborts the request(s) made by the call. */
  signal?: AbortSignal,
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
  list(params?: { signal?: AbortSignal }): Promise<BaseSummary[]>;
  /**
   * Get the {@link BaseSchema} of a base, including all of its tables and fields.
   *
   * Airtable's schema endpoint doesn't return the base's name, so given a base ID this also lists
   * bases until it finds that one. Given a {@link BaseSummary} from {@link BasesApi.list}, it uses that name instead:
   *
   * ```typescript
   * const schemas = await Promise.all((await airtable.bases.list()).map((base) => airtable.bases.get(base)));
   * ```
   */
  get(base: BaseId | BaseSummary, params?: { signal?: AbortSignal }): Promise<BaseSchema>;
  /** Create a new base, returning its schema with all table and field IDs. */
  create(params: CreateBaseParams): Promise<BaseSchema>;
}

export function makeBasesApi(request: Requester): BasesApi {
  // https://airtable.com/developers/web/api/get-base-schema
  async function getTables(baseId: BaseId, signal?: AbortSignal): Promise<TableSchema[]> {
    const response = await request<{ tables: TableSchema[] }>({ path: `/meta/bases/${baseId}/tables`, signal });
    return response.tables;
  }

  // https://airtable.com/developers/web/api/list-bases
  async function* listPages(signal?: AbortSignal): AsyncGenerator<BaseSummary[]> {
    let offset: string | undefined = undefined;
    do {
      const queryParams = new URLSearchParams();
      if (offset) {
        queryParams.append("offset", offset);
      }
      const response: { bases: BaseSummary[]; offset?: string } = await request({
        path: `/meta/bases?${queryParams.toString()}`,
        signal,
      });
      yield response.bases;
      offset = response.offset;
    } while (offset);
  }

  async function list(params?: { signal?: AbortSignal }): Promise<BaseSummary[]> {
    const result: BaseSummary[] = [];
    for await (const page of listPages(params?.signal)) {
      result.push(...page);
    }
    return result;
  }

  /** Find a base's name by listing bases, stopping at the page that contains it. */
  async function findName(baseId: BaseId, signal?: AbortSignal): Promise<string> {
    for await (const page of listPages(signal)) {
      const match = page.find((b) => b.id === baseId);
      if (match) {
        return match.name;
      }
    }
    throw new Error(`Could not find base name for base ID ${baseId}`);
  }

  return {
    list,
    async get(base, params) {
      const signal = params?.signal;
      if (typeof base === "object") {
        return { id: base.id, name: base.name, tables: await getTables(base.id, signal) };
      }
      const [tables, name] = await Promise.all([getTables(base, signal), findName(base, signal)]);
      return { id: base, name, tables };
    },
    // https://airtable.com/developers/web/api/create-base
    async create({ workspaceId, schema, signal }) {
      const response = await request<{ id: BaseId; tables: TableSchema[] }>({
        path: "/meta/bases",
        method: "POST",
        data: {
          workspaceId,
          name: schema.name,
          tables: schema.tables,
        },
        signal,
      });
      return {
        id: response.id,
        name: schema.name,
        tables: response.tables,
      };
    },
  };
}
