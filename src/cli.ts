#!/usr/bin/env node
/**
 * CLI for airtable-kit
 */

import { parseArgs } from 'node:util';
import { BaseId, fetchBaseSchema } from "./index.ts";
import { generateCode } from "./codegen/index.ts";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { IntoFetcher } from './client/fetcher.ts';

import * as packageJson from '../package.json';

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
  const resolvedBaseName = getBaseName(outPath, baseName);
  const baseSchema = await fetchBaseSchema({ baseId, fetcher, baseName: resolvedBaseName });
  const firstTable = baseSchema.tables[0];

  console.log(`✓ Found base with ${baseSchema.tables.length} tables`);
  console.log(`  Using Base Name: ${baseSchema.name}`);
  console.log(`  Tables:\n${baseSchema.tables.map((t) => t.name).join("\n    - ")}`);

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
  baseSchema: myBaseSchema,
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

Commands:
  codegen          Generate TypeScript or JavaScript schema file for an Airtable base.

Options:
  --base-id       The ID of the Airtable base to generate the schema from. (required)
  --api-key       Your Airtable API key or a custom fetcher to use for fetching the schema. (required)
  --output        The output path for the generated schema file (e.g., schemas/myBase.ts). (required)
                  Can be a .ts or .js file, and the output format will be inferred accordingly.
  --base-name     Optional custom name for the base in the generated schema.
                  If not provided, will be inferred from the output filename.
  
  --help          Show this help message.
  --version       Show the version number.
`.trim();
}

type Consolish = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

function getBaseName(outPath: string, baseName?: string): string {
  if (baseName) {
    return baseName;
  }
  const filename = path.basename(outPath);
  return filename.split(".")[0];
}

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
    console.log(packageJson.version);
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
      baseName: values["base-name"],
    }, console);
    return;
  }
  console.log(getHelp());
  throw new Error(`Unknown command`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cli(process.argv.slice(2)).catch((error) => {
    console.error("❌ Error:", (error as Error).message);
    process.exit(1);
  });
}
