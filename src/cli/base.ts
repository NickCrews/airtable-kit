import { Command } from "commander";
import { fetchAllSchemas } from "../bases/index.ts";
import { ConfigManager } from "./config.ts";
import { mdTable } from "./md.ts";
import { resolveBase, ensureOneMatch } from "./resolvers.ts";
import { IntoFetcher } from "../fetcher.ts";
import { generateCode } from "../codegen/index.ts";
import path from "node:path";
import { toIdentifier } from "../codegen/identifiers.ts";
import { BaseSchema } from "../types.ts";

export function createBaseCommand(resolveFetcher: () => IntoFetcher): Command {
  const cmd = new Command("base")
    .description("Manage Airtable bases");

  cmd
    .command("list")
    .description("List all accessible bases")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (options: any) => {
      const fetcher = resolveFetcher();
      const schemas = await fetchAllSchemas({ fetcher });
      if (options.output === "json") {
        console.log(JSON.stringify(schemas, null, 2));
        return;
      } else {
        console.log(formatBaseList(schemas));
      }
    });

  cmd
    .command("get [baseId]")
    .description("Get base details")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (baseId: string | undefined, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const schemas = await fetchAllSchemas({ fetcher });

      const resolvedId = baseId || config.getBaseId();
      const resolved = resolveBase(resolvedId || null, schemas);
      const base = ensureOneMatch(resolved, "base", resolvedId || "(no context)");
      if (options.output === "json") {
        console.log(JSON.stringify(base, null, 2));
        return;
      } else {
        console.log(formatBase(base));
      }
    });

  cmd
    .command("use <identifier>")
    .description("Set current base context")
    .action(async (identifier: string) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const schemas = await fetchAllSchemas({ fetcher });

      const resolved = resolveBase(identifier, schemas);
      const base = ensureOneMatch(resolved, "base", identifier);

      config.setBase(base.id);
      console.log(`✓ Set current base to: ${base.name} (${base.id})`);
    });

  cmd
    .command("codegen [identifier]")
    .description("Generate TypeScript/JavaScript schema for a base")
    .option("--format <format>", "Output format: ts or js", "ts")
    .option("--outdir <path>", "Output directory", ".atk/bases")
    .action(async (identifier: string | undefined, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const schemas = await fetchAllSchemas({ fetcher });

      let baseSchemas = schemas;
      if (identifier) {
        const resolved = resolveBase(identifier, schemas);
        const base = ensureOneMatch(resolved, "base", identifier);
        baseSchemas = [base];
      }

      const outDir = options.outdir;
      for (const baseSchema of baseSchemas) {
        const safeName = toIdentifier(baseSchema.name) || baseSchema.name;
        const outPath = path.join(outDir, `${safeName}.generated.${options.format}`);
        await generateCode(baseSchema, { format: options.format, outPath });
        console.log(`✓ Generated ${outPath}`);
      }
      console.log(`\n✅ ${baseSchemas.length} schema file(s) generated`);
    });

  return cmd;
}


export function formatBase(base: BaseSchema): string {
  const tableTable = mdTable(
    ["Name", "ID", "Fields", "Description"],
    base.tables.map(t => [
      t.name,
      t.id,
      t.fields.length,
      t.description,
    ])
  );

  return `# Base \`${base.name}\` (${base.id})
  
- **Name**: ${base.name}
- **ID**: ${base.id}
- **URL**: [https://airtable.com/${base.id}](https://airtable.com/${base.id})

## Tables (${base.tables.length})

${base.tables.length ? tableTable : "No tables found."}`;
}

export function formatBaseList(bases: BaseSchema[]): string {
  if (bases.length === 0) {
    return "No bases found.";
  }

  const rows = bases.map(b => [b.name, b.id, String(b.tables.length)]);
  return `# Bases (${bases.length})
  
${mdTable(["Name", "ID", "Tables"], rows)}`;
}