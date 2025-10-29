#!/usr/bin/env node
/**
 * CLI for airtable-kit
 */

import { parseArgs } from 'node:util';
import { fetchBaseSchema } from "./schema/index.js";
import { generateCode } from "./codegen/index.js";
import { promises as fs } from "node:fs";
import * as path from "node:path";

async function doCodegen({
  baseId,
  apiKey,
  outPath,
  baseName: rawBaseName,
}: {
  baseId: string;
  apiKey: string;
  outPath: string;
  baseName?: string;
}) {
  console.log("🔍 Fetching schema from Airtable...");
  const baseName = rawBaseName ?? baseId;

  const rawSchema = await fetchBaseSchema(baseId, apiKey);
  const schemaWithName = { ...rawSchema, name: baseName };
  const firstTable = schemaWithName.tables[0];

  console.log(`✓ Found base with ${schemaWithName.tables.length} tables`);
  console.log(`  Tables: ${schemaWithName.tables.map((t) => t.name).join(", ")}`);

  const filetype = outPath.endsWith(".ts") ? "ts" : "js";
  const code = generateCode(schemaWithName, { filetype });

  const outputDir = path.dirname(outPath);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outPath, code, "utf-8");

  console.log(`\n✅ Generated schema at ${outPath}`);
  console.log("\n📚 Example usage:");
  const importPath = outPath.startsWith("/") ? outPath : outPath.startsWith(".") ? outPath : `./${outPath}`;
  console.log(
    `import myBaseSchema from '${importPath}';
import { baseClient } from 'airtable-kit/client';

const client = baseClient({
  baseId: myBaseSchema.id,
  tables: myBaseSchema.tables,
  fetcher: 'YOUR_API_KEY',
});
const records = await client.tables.${firstTable.name}.list()
console.log(records);`
  );
}

function getHelp() {
  return `Airtable Kit CLI

Usage:
  npx airtable-kit codegen --base-id <BASE_ID> --api-key <API_KEY> --output <OUTPUT_PATH> [--base-name <BASE_NAME>]
  npx airtable-kit --help
  npx airtable-kit --version
`.trim();
}

export async function cli(argv: string[]) {
  const options = {
    version: { type: 'boolean' },
    help: { type: 'boolean' },
    "base-id": { type: 'string' },
    "api-key": { type: 'string' },
    "base-name": { type: 'string' },
    output: { type: 'string' },
  } as const;
  const {
    values,
    positionals,
  } = parseArgs({ argv, options, allowPositionals: true });

  if (values.help || positionals[0] === 'help') {
    console.log(getHelp());
    return;
  }
  if (values.version || positionals[0] === 'version') {
    console.log('Airtable Kit CLI version 1.0.0');
    return;
  }
  if (positionals[0] === 'codegen') {
    const missings = [];
    if (!values["base-id"]) {
      missings.push('--base-id');
    }
    if (!values["api-key"]) {
      missings.push('--api-key');
    }
    if (!values.output) {
      missings.push('--output');
    }
    if (missings.length > 0) {
      const err = `Missing required options: ${missings.join(', ')}`;
      console.error(`❌ ${err}`);
      console.log(getHelp());
      throw new Error(err);
    }
    await doCodegen({
      baseId: values["base-id"]!,
      apiKey: values["api-key"]!,
      outPath: values.output!,
      baseName: values["base-name"],
    });
    return;
  }
  console.log(getHelp());
  throw new Error(`Unknown command`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await cli(process.argv.slice(2));
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
    process.exit(1);
  }
}
