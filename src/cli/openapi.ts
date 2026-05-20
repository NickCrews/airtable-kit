import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";

import { fetchAllSchemas } from "../bases/api.ts";
import { ConfigManager } from "./config.ts";
import { resolveBase, ensureOneMatch } from "./resolvers.ts";
import { IntoFetcher } from "../fetcher.ts";
import { baseToOpenApi } from "../openapi/index.ts";

/**
 * Build the action for the `openapi` command, shared between the top-level
 * `airtable-kit openapi` and `airtable-kit base openapi`.
 */
function makeOpenApiAction(resolveFetcher: () => IntoFetcher) {
  return async (identifier: string | undefined, options: { out?: string }) => {
    const fetcher = resolveFetcher();
    const config = ConfigManager.getDefault();
    const schemas = await fetchAllSchemas({ fetcher });

    const resolvedId = identifier || config.getBaseId();
    const resolved = resolveBase(resolvedId || null, schemas);
    const base = ensureOneMatch(resolved, "base", resolvedId || "(no context)");

    const doc = baseToOpenApi(base);
    const json = JSON.stringify(doc, null, 2);

    if (options.out) {
      const dir = path.dirname(options.out);
      if (dir && dir !== ".") {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(options.out, json, "utf-8");
      console.log(`✓ Wrote OpenAPI spec to ${options.out}`);
    } else {
      console.log(json);
    }
  };
}

/**
 * Create a fresh `openapi` {@link Command}. Returns a new instance each call so
 * it can be registered under both the program root and the `base` command.
 */
export function makeOpenApiCommand(resolveFetcher: () => IntoFetcher): Command {
  return new Command("openapi")
    .description("Generate an OpenAPI 3 spec for a base")
    .argument("[baseId]", "Base ID or name (uses context if not provided)")
    .option("--api-key <key>", "Airtable API key")
    .option("--out <file>", "Write the spec to a file instead of stdout")
    .action(makeOpenApiAction(resolveFetcher));
}
