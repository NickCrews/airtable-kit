import { Command } from "commander";
import { fetchAllSchemas } from "../bases/index.ts";
import { ConfigManager } from "./config.ts";
import { format } from "./formatters.ts";
import { resolveTable, ensureOneMatch } from "./resolvers.ts";
import { IntoFetcher } from "../fetcher.ts";
import { BaseId } from "../types.ts";
import { readInput, validateRecordData, validateBatchData } from "./input.ts";
import { makeTableClient } from "../clients/table-client.ts";

export function createRecordCommand(resolveFetcher: () => IntoFetcher): Command {
  const cmd = new Command("record")
    .description("Manage Airtable records");

  cmd
    .command("list")
    .description("List records in a table")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--view <name>", "View name or ID to filter by")
    .option("--filter <formula>", "Filter formula")
    .option("--sort <field:direction>", "Sort by field (e.g., 'Name:asc')")
    .option("--max <n>", "Maximum number of records")
    .option("--fields <list>", "Comma-separated field names to include")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const tableResolved = resolveTable(baseId || null, tableId || null, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", baseId ? `in base ${baseId}` : undefined);

      const client = makeTableClient({
        baseId: base.id as BaseId,
        tableSchema: table,
        fetcher,
      });

      const listOptions: any = {};
      if (options.view) listOptions.view = options.view;
      if (options.filter) listOptions.filterByFormula = options.filter;
      if (options.max) listOptions.maxRecords = parseInt(options.max, 10);
      if (options.fields) {
        listOptions.fields = options.fields.split(",").map((f: string) => f.trim());
      }
      if (options.sort) {
        const [field, direction] = options.sort.split(":");
        listOptions.sort = [{ field, direction: direction || "asc" }];
      }

      const records = await client.listRecords(listOptions);

      if (options.output === "json") {
        console.log(JSON.stringify(records, null, 2));
      } else {
        console.log(format({ records, fields: table.fields }, "markdown", "record-list"));
      }
    });

  cmd
    .command("get <recordId>")
    .description("Get a record by ID")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (recordId: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const tableResolved = resolveTable(baseId || null, tableId || null, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", baseId ? `in base ${baseId}` : undefined);

      const client = makeTableClient({
        baseId: base.id as BaseId,
        tableSchema: table,
        fetcher,
      });

      const record = await client.getRecord(recordId as any);
      console.log(format(record, options.output === "json" ? "json" : "markdown", "record"));
    });

  cmd
    .command("create")
    .description("Create a new record")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--data <json>", "Record data as JSON")
    .option("--file <path>", "JSON file with record data")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const tableResolved = resolveTable(baseId || null, tableId || null, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", baseId ? `in base ${baseId}` : undefined);

      let data = await readInput({
        data: options.data,
        file: options.file,
        stdin: !options.data && !options.file,
      });

      const records = validateBatchData(data);

      const client = makeTableClient({
        baseId: base.id as BaseId,
        tableSchema: table,
        fetcher,
      });

      const results = await client.createRecords(records);
      if (options.output === "json") {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(format({ records: results, fields: table.fields }, "markdown", "record-list"));
      }
      console.log(`\n✅ Created ${results.length} record(s)`);
    });

  cmd
    .command("update <recordId>")
    .description("Update a record")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--data <json>", "Record data as JSON")
    .option("--file <path>", "JSON file with record data")
    .option("--destructive", "Clear fields not included in update")
    .option("--typecast", "Enable typecasting for string values")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (recordId: string, options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const tableResolved = resolveTable(baseId || null, tableId || null, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", baseId ? `in base ${baseId}` : undefined);

      let data = await readInput({
        data: options.data,
        file: options.file,
        stdin: !options.data && !options.file,
      });

      validateRecordData(data);

      const client = makeTableClient({
        baseId: base.id as BaseId,
        tableSchema: table,
        fetcher,
      });

      const result = await client.updateRecords(
        [{ id: recordId as any, fields: data.fields }],
        { destructive: options.destructive, typecast: options.typecast }
      );

      const updated = result.records[0];
      if (options.output === "json") {
        console.log(JSON.stringify(updated, null, 2));
      } else {
        console.log(format(updated, options.output === "json" ? "json" : "markdown", "record"));
      }
      console.log(`\n✅ Updated record: ${recordId}`);
    });

  cmd
    .command("delete <recordIds...>")
    .description("Delete one or more records")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .action(async (recordIds: string[], options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const tableResolved = resolveTable(baseId || null, tableId || null, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", baseId ? `in base ${baseId}` : undefined);

      const client = makeTableClient({
        baseId: base.id as BaseId,
        tableSchema: table,
        fetcher,
      });

      await client.deleteRecords(recordIds as any);
      console.log(`✅ Deleted ${recordIds.length} record(s)`);
    });

  cmd
    .command("upsert")
    .description("Create or update records using external ID matching")
    .option("--base <id>", "Base ID or name (uses context if not provided)")
    .option("--table <id>", "Table ID or name (uses context if not provided)")
    .option("--merge-on <fields>", "Comma-separated field names for matching (1-3 fields)")
    .option("--data <json>", "Record data as JSON")
    .option("--file <path>", "JSON file with record data")
    .option("--output <format>", "Output format (json or markdown)", "markdown")
    .action(async (options: any) => {
      const fetcher = resolveFetcher();
      const config = ConfigManager.getDefault();
      const allSchemas = await fetchAllSchemas({ fetcher });

      const baseId = options.base || config.getBaseId();
      const tableId = options.table || config.getTableId();

      const tableResolved = resolveTable(baseId || null, tableId || null, allSchemas);
      const { base, table } = ensureOneMatch(tableResolved, "table", tableId || "(no context)", baseId ? `in base ${baseId}` : undefined);

      if (!options.mergeOn) {
        throw new Error("--merge-on is required for upsert");
      }

      let data = await readInput({
        data: options.data,
        file: options.file,
        stdin: !options.data && !options.file,
      });

      const records = validateBatchData(data);

      const client = makeTableClient({
        baseId: base.id as BaseId,
        tableSchema: table,
        fetcher,
      });

      const fieldsToMergeOn = options.mergeOn.split(",").map((f: string) => f.trim());
      const results = await client.updateRecords(records, {
        performUpsert: { fieldsToMergeOn: fieldsToMergeOn as any },
      });

      if (options.output === "json") {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(format({ records: results.records, fields: table.fields }, "markdown", "record-list"));
      }
      console.log(`\n✅ Upserted ${results.records.length} record(s)`);
    });

  return cmd;
}
