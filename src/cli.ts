import { parseArgs, parseEnv } from 'node:util';
import path from "node:path";
import process from 'node:process';
import fs from 'node:fs';

import { BaseId } from "./types.ts";
import { fetchAllSchemas, getBaseSchema } from "./bases/index.ts";
import { generateCode } from "./codegen/index.ts";
import { IntoFetcher } from './fetcher.ts';
import { toIdentifier } from './codegen/identifiers.ts';

import * as packageJson from '../package.json';

async function doCodegenBase({
  baseId,
  fetcher,
  outFile,
  format,
}: {
  baseId: BaseId;
  outFile?: string;
  format?: "ts" | "js";
  fetcher: IntoFetcher;
}, console: Consolish = globalThis.console): Promise<void> {
  console.log("🔍 Fetching schema from Airtable...");
  const baseSchema = await getBaseSchema({ baseId, fetcher });
  const firstTable = baseSchema.tables[0];

  console.log(`✓ Found base with ${baseSchema.tables.length} tables`);
  console.log(`  Using Base Name: ${baseSchema.name}`);
  console.log(`  Tables:\n${baseSchema.tables.map((t) => '    - ' + t.name).join("\n")}`);

  const inferredFormat = outFile?.endsWith(".ts") ? "ts" : outFile?.endsWith(".js") ? "js" : undefined;
  const finalFormat = format ?? inferredFormat ?? "ts";

  if (!outFile) {
    const safeBaseName = toIdentifier(baseSchema.name) || baseSchema.name;
    outFile = `./${safeBaseName}-schema.${finalFormat}`;
  }

  await generateCode(baseSchema, { format: finalFormat, outPath: outFile });

  console.log(`\n✅ Generated schema at ${outFile}`);
  console.log("\n📚 Example usage:");
  const importPath = outFile.startsWith("/") ? outFile : outFile.startsWith(".") ? outFile : `./${outFile}`;
  console.log(
    `import myBaseSchema from '${importPath}';
import { makeBaseClient } from 'airtable-kit';

const client = makeBaseClient({
  baseSchema: myBaseSchema,
  fetcher: 'YOUR_API_KEY',
});
const records = await client.tables.${firstTable.name}.list()
console.log(records);`
  );
}

async function doCodegenAll({
  fetcher,
  outDir,
  format,
}: {
  fetcher: IntoFetcher;
  outDir: string;
  format?: "ts" | "js";
}, console: Consolish = globalThis.console): Promise<void> {
  console.log("🔍 Fetching all base schemas from Airtable...");
  const baseSchemas = await fetchAllSchemas({ fetcher });
  console.log(`✓ Found ${baseSchemas.length} bases`);
  const finalFormat = format ?? "ts";
  for (const baseSchema of baseSchemas) {
    const safeName = toIdentifier(baseSchema.name) || baseSchema.name;
    const outPath = path.join(outDir, `${safeName}.${finalFormat}`);
    await generateCode(baseSchema, { format: finalFormat, outPath });
    console.log(`  • Generated ${outPath}`);
  }
  console.log(`\n✅ Generated ${baseSchemas.length} schema file(s) in ${outDir}`);
}

function getHelp() {
  return `Airtable Kit CLI

Usage:
  npx airtable-kit codegen base <BASE_ID> [--api-key <API_KEY>] [--format <ts|js>] [--outfile <OUTPUT_FILE>] [--base-name <BASE_NAME>] 
  npx airtable-kit codegen all            [--api-key <API_KEY>] [--format <ts|js>] [--outdir <OUTPUT_DIR>] 
  npx airtable-kit --help
  npx airtable-kit --version

Commands:
  codegen base    Generate a ts/js schema file for a specific Airtable base.
  codegen all     Generate ts/js schema files for all Airtable bases.

Global Options:
  --api-key       Your Airtable API key or a custom fetcher to use for fetching the schema.
                  If not provided, will try to load from environment variable AIRTABLE_API_KEY,
                  or from a .env file in the current directory.
  --format        The output format: "ts" for TypeScript or "js" for JavaScript.
                  Default is to infer from the output filename extension if provided, otherwise "ts".
  --help          Show this help message.
  --version       Show the version number.

Options for "codegen base" command:
  <BASE_ID>       The ID of the Airtable base to generate the schema from.
  --outfile       The output file path for the generated schema file. (default: ./<BASE_NAME>-schema.ts or .js)

Options for "codegen all" command:
  --outdir       The output directory for the generated schema files (default: ./schemas/).
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
    "api-key": { type: 'string' },
    "format": { type: 'string' },
    "base-name": { type: 'string' },
    outfile: { type: 'string' },
    outdir: { type: 'string' },
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
    const apiKey = getApiKey(values["api-key"]);
    const sub = positionals[1];
    if (sub === 'base') {
      const baseId = positionals[2] as BaseId | undefined;
      const missings = [] as string[];
      if (!baseId) missings.push('<BASE_ID>');
      if (missings.length > 0) {
        const err = `Missing required options: ${missings.join(', ')}`;
        console.error(`❌ ${err}`);
        console.log(getHelp());
        throw new Error(err);
      }
      const providedOut = values.outfile;
      const providedFormat = getFormat(values.format);
      const finalFormat = providedFormat ?? (providedOut?.endsWith('.js') ? 'js' : providedOut?.endsWith('.ts') ? 'ts' : undefined) ?? 'ts';
      await doCodegenBase({
        baseId: baseId as BaseId,
        fetcher: fetcher ?? apiKey,
        outFile: providedOut,
        format: finalFormat,
      }, console);
      return;
    }
    if (sub === 'all') {
      await doCodegenAll({
        fetcher: fetcher ?? apiKey,
        outDir: values.outdir ?? './schemas/',
        format: getFormat(values.format),
      }, console);
      return;
    }
    console.error('❌ Unknown codegen subcommand');
    console.log(getHelp());
    throw new Error('Unknown codegen subcommand');
  }
  console.log(getHelp());
  throw new Error(`Unknown command`);
}

/** Get an api key from
 * - the provided raw string
 * - try to get from process.env if not provided
 * - then try to load from .env file if still not provided
 * - finally throw an error if no API key is found
 */
function getApiKey(apiKeyRaw: string | undefined): string {
  if (apiKeyRaw) {
    return apiKeyRaw;
  }
  try {
    const fromProcessEnv = process.env.AIRTABLE_API_KEY;
    if (fromProcessEnv) {
      return fromProcessEnv;
    }
  } catch {
    // ignore
  }
  try {
    const envFileContent = fs.readFileSync('.env', 'utf-8');
    const parsed = parseEnv(envFileContent);
    const fromEnvFile = parsed.AIRTABLE_API_KEY;
    if (fromEnvFile) {
      return fromEnvFile;
    }
  } catch {
    // ignore
  }
  throw new Error('No Airtable API key provided. Please provide via --api-key or AIRTABLE_API_KEY env var (also supported in .env file).');
}

function getFormat(formatRaw: string | undefined): "ts" | "js" | undefined {
  if (formatRaw === "ts") {
    return "ts";
  }
  if (formatRaw === "js") {
    return "js";
  }
  if (formatRaw === undefined) {
    return undefined;
  }
  throw new Error(`Invalid format: ${formatRaw}. Must be "ts" or "js".`);
}
