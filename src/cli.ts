#!/usr/bin/env node
/**
 * CLI for airtable-kit
 */

import { Command } from "commander";
import { createCodeGenerator, createSchemaFetcher } from "./index.js";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const program = new Command();

program
  .name("airtable-kit")
  .description("Type-safe Airtable client - code generation and utilities")
  .version("0.0.1");

program
  .command("codegen")
  .description("Generate TypeScript schema from Airtable base")
  .requiredOption("-b, --base-id <baseId>", "Airtable base ID (appXXXXXX)")
  .requiredOption("-k, --api-key <apiKey>", "Airtable API key")
  .option("-o, --output <file>", "Output file path", "./generated/schema.ts")
  .option(
    "-v, --variable-name <name>",
    "Variable name for schema",
    "baseSchema",
  )
  .action(async (options) => {
    try {
      console.log("🔍 Fetching schema from Airtable...");

      const fetcher = createSchemaFetcher({ apiKey: options.apiKey });
      const schema = await fetcher.fetchBaseSchema(options.baseId);

      console.log(`✓ Found base with ${schema.tables.length} tables`);
      console.log(`  Tables: ${schema.tables.map((t) => t.name).join(", ")}`);

      console.log("\n📝 Generating schema...");

      const generator = createCodeGenerator({
        variableName: options.variableName,
      });

      const code = generator.generateSchema(schema);

      // Create output directory
      const outputDir = path.dirname(options.output);
      await fs.mkdir(outputDir, { recursive: true });

      // Write schema file
      await generator.writeToFile(code, options.output);
      console.log(`  ✓ ${options.output}`);

      // Save schema JSON for reference
      const schemaPath = path.join(outputDir, "schema.json");
      await fetcher.saveSchemaToFile(schema, schemaPath);
      console.log(`  ✓ ${schemaPath}`);

      console.log(`\n✅ Generated schema at ${options.output}`);
      console.log("\n📚 Next steps:");
      console.log(
        `  1. Import the schema: import { ${options.variableName} } from '${
          options.output.replace(".ts", "")
        }';`,
      );
      console.log(`  2. Types are automatically inferred from the schema`);
      console.log(
        `  3. Use with MCP tools: createMCPTools({ baseSchema, tableId: 'tblXXX' })`,
      );
    } catch (error) {
      console.error(
        "\n❌ Error:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program
  .command("fetch-schema")
  .description("Fetch and save Airtable base schema")
  .requiredOption("-b, --base-id <baseId>", "Airtable base ID")
  .requiredOption("-k, --api-key <apiKey>", "Airtable API key")
  .option("-o, --output <file>", "Output file", "./schema.json")
  .action(async (options) => {
    try {
      console.log("🔍 Fetching schema from Airtable...");

      const fetcher = createSchemaFetcher({ apiKey: options.apiKey });
      const schema = await fetcher.fetchBaseSchema(options.baseId);

      await fetcher.saveSchemaToFile(schema, options.output);

      console.log(`✅ Schema saved to ${options.output}`);
      console.log(`   Base: ${schema.id}`);
      console.log(`   Tables: ${schema.tables.length}`);
    } catch (error) {
      console.error(
        "\n❌ Error:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program.parse();
