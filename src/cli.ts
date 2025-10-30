#!/usr/bin/env node
/**
 * CLI for airtable-kit
 */

import { parseArgs } from 'node:util';
import { BaseId, fetchBaseSchema } from "./schema/index.js";
import { generateCode } from "./codegen/index.js";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { IntoFetcher } from './client/fetcher.js';

async function doCodegen({
  baseId,
  fetcher,
  outPath,
  baseName,
}: {
  baseId: BaseId;
  outPath: string;
  baseName?: string;
  fetcher: IntoFetcher;
}, console: Consolish = globalThis.console): Promise<void> {
  console.log("🔍 Fetching schema from Airtable...");
  const baseSchema = await fetchBaseSchema({ baseId, fetcher, baseName });
  const firstTable = baseSchema.tables[0];

  console.log(`✓ Found base with ${baseSchema.tables.length} tables`);
  console.log(`  Tables: ${baseSchema.tables.map((t) => t.name).join(", ")}`);

  const filetype = outPath.endsWith(".ts") ? "ts" : "js";
  const code = generateCode(baseSchema, { filetype });

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

type Consolish = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export async function cli(args: string[], fetcher?: IntoFetcher, console: Consolish = globalThis.console): Promise<void> {
  const options = {
    version: { type: 'boolean' },
    help: { type: 'boolean' },
    "base-id": { type: 'string' },
    "api-key": { type: 'string' },
    "base-name": { type: 'string' },
    output: { type: 'string' },
  } as const;
  const { values, positionals } = parseArgs({ args, options, allowPositionals: true });

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
      baseId: values["base-id"] as BaseId,
      fetcher: fetcher ?? values["api-key"] as string,
      outPath: values.output as string,
      baseName: values["base-name"] as string | undefined,
    }, console);
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
