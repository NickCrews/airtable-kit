#!/usr/bin/env node
/**
 * CLI for airtable-kit
 */

import { Command } from "commander";
import { fetchBaseSchema } from "./schema/index.js";
import { createCodeGenerator } from "./codegen/index.js";
import { promises as fs } from "node:fs";
import * as path from "node:path";

function cli(argv: string[]) {
  const program = new Command();

  program
    .name("airtable-kit")
    .description("Type-safe Airtable client - code generation and utilities")
    .version("0.0.1");

  program
    .command("codegen")
    .description("Generate TypeScript schema from Airtable base")
    .requiredOption("--base-id <baseId>", "Airtable base ID (appXXXXXX)")
    .requiredOption("--api-key <apiKey>", "Airtable API key")
    .option("--output <file>", "Output file path. Default to ./schemas/<baseId>.ts")
    .option(
      "--base-name <name>",
      "name of the base in the generated JSON. Defaults to base ID",
    )
    .action(async (options) => {
      try {
        console.log("🔍 Fetching schema from Airtable...");
        const baseName = options.baseName ?? options.baseId;

        const rawSchema = await fetchBaseSchema(options.baseId, options.apiKey);
        const schemaWithName = { ...rawSchema, name: baseName };
        const firstTable = schemaWithName.tables[0];

        console.log(`✓ Found base with ${schemaWithName.tables.length} tables`);
        console.log(`  Tables: ${schemaWithName.tables.map((t) => t.name).join(", ")}`);

        console.log("\n📝 Generating schema...");

        const generator = createCodeGenerator();
        const code = generator.generateSchema(schemaWithName);

        // Create output directory
        const outputDir = path.dirname(options.output);
        await fs.mkdir(outputDir, { recursive: true });

        // Write schema file
        await generator.writeToFile(code, options.output);
        console.log(`  ✓ ${options.output}`);

        console.log(`\n✅ Generated schema at ${options.output}`);
        console.log("\n📚 Example usage:");
        console.log(
          `
  import * as myBaseSchema from '${options.output.replace(".ts", "")}';
  import baseClient from 'airtable-kit/client';

  const client = baseClient({
    baseId: myBaseSchema.id,
    tables: myBaseSchema.tables,
    fetcher: 'YOUR_API_KEY',
  });
  const records = await client.tables.${firstTable.name}.listRecords()
  console.log(records);
  `.trim(),
        );
      } catch (error) {
        console.error(
          "\n❌ Error:",
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  program.parse(argv);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cli(process.argv);
}
