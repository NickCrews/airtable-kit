import { Command } from "commander";
import { fetchAllSchemas } from "../bases/index.ts";
import { ConfigManager } from "./config.ts";
import { mdTable } from "./md.ts";
import { resolveBase, resolveTable, ensureOneMatch } from "./resolvers.ts";
import { IntoFetcher } from "../fetcher.ts";
import { createTable, updateTable } from "../tables/index.ts";
import { BaseId, BaseSchema, TableId, TableSchema } from "../types.ts";

export function createTableCommand(resolveFetcher: () => IntoFetcher): Command {
  const cmd = new Command("table")
    .description("Manage Airtable tables");

  cmd
    .command("list")
    .description("List tables in a base")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const baseResolved = resolveBase(baseId || null, allSchemas);
      const base = ensureOneMatch(baseResolved, "base", baseId || "(no context)");

      if (options.output === "json") {
        console.log(JSON.stringify(base.tables, null, 2));
      } else {
        console.log(formatTableList(base));
      }
    });

  cmd
    .command("get <identifier>")
    .description("Get table details")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (identifier: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableResolved = resolveTable(baseId || null, identifier, allSchemas);
      const { table } = ensureOneMatch(tableResolved, "table", identifier, baseId ? `in base ${baseId}` : undefined);

      if (options.output === "json") {
        console.log(JSON.stringify(table, null, 2));
      } else {
        console.log(formatTable(table));
      }
    });

  cmd
    .command("use <identifier>")
    .description("Set current table context")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .action(async (identifier: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      if (!baseId) {
        throw new Error("No base context set. Use `base use <id>` first or provide --base");
      }

      const tableResolved = resolveTable(baseId, identifier, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", identifier);

      config.setTable(table.id);
      console.log(`✓ Set current table to: ${table.name} (${table.id}) in ${base.name}`);
    });

  cmd
    .command("create <name>")
    .description("Create a new table")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--description <text>", "Table description")
    .option("--from-file <path>", "JSON file with table schema")
    .action(async (name: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const baseResolved = resolveBase(baseId || null, allSchemas);
      const base = ensureOneMatch(baseResolved, "base", baseId || "(no context)");

      const tableSchema = {
        name,
        description: options.description,
        fields: [],
      };

      const result = await createTable({
        baseId: base.id as BaseId,
        table: tableSchema,
        fetcher,
      });

      console.log(formatTable(result));
      console.log(`\n✅ Table created: ${result.name} (${result.id})`);
    });

  cmd
    .command("update <identifier>")
    .description("Update table metadata")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--name <name>", "New table name")
    .option("--description <text>", "New description")
    .action(async (identifier: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableResolved = resolveTable(baseId || null, identifier, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", identifier, baseId ? `in base ${baseId}` : undefined);

      const updated = await updateTable({
        baseId: base.id as BaseId,
        table: {
          ...table,
          id: table.id as TableId,
          name: options.name || table.name,
          description: options.description !== undefined ? options.description : table.description,
        },
        fetcher,
      });

      console.log(formatTable(updated));
      console.log(`\n✅ Table updated: ${updated.name}`);
    });

  return cmd;
}

export function formatTable(table: TableSchema): string {
  let metadata = `- **Name**: ${table.name}
- **ID**: ${table.id}`;
  if (table.description) {
    metadata += `\n- **Description**: ${table.description}`;
  }
  const primaryField = table.fields.find(f => f.id === table.primaryFieldId);
  if (primaryField) {
    metadata += `\n- **Primary field**: \`${primaryField.name}\` (${primaryField.id})`;
  }

  const fieldTable = mdTable(
    ["Name", "ID", "Type", "Description"],
    table.fields.map(f => [
      f.name,
      f.id,
      (f as any).type,
      f.description || "",
    ])
  );

  const views = table.views || [];
  const viewText = views.length ? mdTable(
    ["Name", "ID", "Type"],
    views.map(v => [
      v.name,
      v.id,
      v.type,
    ])
  ) : 'No views found.';

  return `# Table \`${table.name}\` (${table.id})

${metadata}

## Fields ${table.fields.length ? `(${table.fields.length})` : ""}

${fieldTable}

## Views ${views.length ? `(${views.length})` : ""}

${viewText}`;
}

export function formatTableList(base: BaseSchema): string {
  const tables = base.tables;
  if (tables.length === 0) {
    return "No tables found.";
  }

  const rows = tables.map(t => [t.name, t.id, String(t.fields.length), t.description || ""]);
  return `# Tables in base \`${base.name}\` (${base.id})

Total: **${tables.length}** tables

${mdTable(["Name", "ID", "Fields", "Description"], rows)}`;
}
