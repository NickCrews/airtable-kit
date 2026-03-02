import { Command } from "commander";
import { fetchAllSchemas } from "../bases/index.ts";
import { ConfigManager } from "./config.ts";
import { format } from "./formatters.ts";
import { resolveBase, resolveTable, resolveField, ensureOneMatch } from "./resolvers.ts";
import { IntoFetcher } from "../fetcher.ts";
import { createField, updateField } from "../fields/api.ts";
import { BaseId, TableId } from "../types.ts";
import { readInput } from "./input.ts";

export function createFieldCommand(resolveFetcher: () => IntoFetcher): Command {
  const cmd = new Command("field")
    .description("Manage Airtable fields");

  cmd
    .command("list")
    .description("List fields in a table")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const tableResolved = resolveTable(baseId || null, tableId || null, allSchemas);
      const { table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", baseId ? `in base ${baseId}` : undefined);

      console.log(format(table.fields, options.output === "json" ? "json" : "markdown", "field-list"));
    });

  cmd
    .command("get <identifier>")
    .description("Get field details")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (identifier: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const fieldResolved = resolveField(baseId || null, tableId || null, identifier, allSchemas);
      const { field } = ensureOneMatch(fieldResolved, "field", identifier, tableId ? `in table ${tableId}` : undefined);

      console.log(format(field, options.output === "json" ? "json" : "markdown", "field"));
    });

  cmd
    .command("create <name>")
    .description("Create a new field")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--type <type>", "Field type (required)")
    .option("--description <text>", "Field description")
    .option("--data <json>", "Field options as JSON")
    .option("--file <path>", "JSON file with field config")
    .action(async (name: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      if (!options.type) {
        throw new Error("--type is required");
      }

      const baseResolved = resolveBase(baseId || null, allSchemas);
      const base = ensureOneMatch(baseResolved, "base", baseId || "(no context)");

      const tableResolved = resolveTable(base.id, tableId || null, allSchemas);
      const { table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", `in base ${base.id}`);

      let fieldOptions = {};
      if (options.data || options.file) {
        fieldOptions = await readInput({
          data: options.data,
          file: options.file,
        });
      }

      const field = {
        name,
        type: options.type,
        description: options.description,
        ...fieldOptions,
      };

      const result = await createField({
        baseId: base.id as BaseId,
        tableId: table.id as TableId,
        field: field as any,
        fetcher,
      });

      console.log(format(result, "markdown", "field"));
      console.log(`\n✅ Field created: ${result.name} (${result.id})`);
    });

  cmd
    .command("update <identifier>")
    .description("Update field metadata")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--name <name>", "New field name")
    .option("--description <text>", "New description")
    .action(async (identifier: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const baseResolved = resolveBase(baseId || null, allSchemas);
      const base = ensureOneMatch(baseResolved, "base", baseId || "(no context)");

      const fieldResolved = resolveField(base.id, tableId || null, identifier, allSchemas);
      const { table, field } = ensureOneMatch(fieldResolved, "field", identifier, tableId ? `in table ${tableId}` : undefined);

      const updated = await updateField({
        baseId: base.id as BaseId,
        tableId: table.id as TableId,
        field: {
          ...field,
          id: field.id,
          name: options.name || field.name,
          description: options.description !== undefined ? options.description : field.description,
        },
        fetcher,
      });

      console.log(format(updated, "markdown", "field"));
      console.log(`\n✅ Field updated: ${updated.name}`);
    });

  return cmd;
}
