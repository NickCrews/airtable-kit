import { parseEnv } from 'node:util';
import path from "node:path";
import process from 'node:process';
import fs from 'node:fs';
import { Command } from 'commander';

import { BaseId } from "./types.ts";
import { fetchAllSchemas, getBaseSchema } from "./bases/index.ts";
import { generateCode } from "./codegen/index.ts";
import { IntoFetcher, DEFAULT_API_KEY_ENV_VAR } from './fetcher.ts';
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
    outFile = `./${safeBaseName}.generated.${finalFormat}`;
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
    const outPath = path.join(outDir, `${safeName}.generated.${finalFormat}`);
    await generateCode(baseSchema, { format: finalFormat, outPath });
    console.log(`  • Generated ${outPath}`);
  }
  console.log(`\n✅ Generated ${baseSchemas.length} schema file(s) in ${outDir}`);
}

type Consolish = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export async function cli(args: string[], fetcher?: IntoFetcher, console: Consolish = globalThis.console): Promise<void> {
  const program = new Command()
    .name('airtable-kit')
    .version(packageJson.version)
    .description('A better ts/js airtable toolkit')
    .configureOutput({
      writeOut: (str) => console.log(str),
      writeErr: (str) => console.error(str),
    })
    .exitOverride();

  const codegen = program
    .command('codegen')
    .description('Generate TypeScript or JavaScript schema files from Airtable bases');

  codegen
    .command('base <baseId>')
    .description('Generate a ts/js schema file for a specific Airtable base')
    .option('--api-key <key>', 'Your Airtable API key')
    .option('--format <format>', 'Output format: "ts" or "js"')
    .option('--outfile <path>', 'Output file path for the generated schema')
    .option('--base-name <name>', 'Custom base name')
    .action(async (baseId: string, options: {
      apiKey?: string;
      format?: string;
      outfile?: string;
      baseName?: string;
    }) => {
      const apiKey = getApiKey(options.apiKey);
      const providedFormat = getFormat(options.format);
      const finalFormat = providedFormat ?? (options.outfile?.endsWith('.js') ? 'js' : options.outfile?.endsWith('.ts') ? 'ts' : undefined) ?? 'ts';

      await doCodegenBase({
        baseId: baseId as BaseId,
        fetcher: fetcher ?? apiKey,
        outFile: options.outfile,
        format: finalFormat,
      }, console);
    });

  codegen
    .command('all')
    .description('Generate ts/js schema files for all Airtable bases')
    .option('--api-key <key>', 'Your Airtable API key')
    .option('--format <format>', 'Output format: "ts" or "js"')
    .option('--outdir <path>', 'Output directory for schema files', './schemas/')
    .action(async (options: {
      apiKey?: string;
      format?: string;
      outdir?: string;
    }) => {
      const apiKey = getApiKey(options.apiKey);

      await doCodegenAll({
        fetcher: fetcher ?? apiKey,
        outDir: options.outdir ?? './schemas/',
        format: getFormat(options.format),
      }, console);
    });

  try {
    await program.parseAsync(args, { from: 'user' });
  } catch (error: any) {
    if (error.code === 'commander.help' || error.code === 'commander.helpDisplayed') {
      return;
    }
    if (error.code === 'commander.version') {
      return;
    }
    if (error.code === 'commander.missingMandatoryOptionValue' ||
      error.code === 'commander.missingArgument' ||
      error.code === 'commander.unknownCommand' ||
      error.code === 'commander.unknownOption') {
      throw error;
    }
    throw error;
  }
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
    const fromProcessEnv = process.env[DEFAULT_API_KEY_ENV_VAR];
    if (fromProcessEnv) {
      return fromProcessEnv;
    }
  } catch {
    // ignore
  }
  try {
    const envFileContent = fs.readFileSync('.env', 'utf-8');
    const parsed = parseEnv(envFileContent);
    const fromEnvFile = parsed[DEFAULT_API_KEY_ENV_VAR];
    if (fromEnvFile) {
      return fromEnvFile;
    }
  } catch {
    // ignore
  }
  throw new Error(`No Airtable API key provided. Please provide via --api-key or ${DEFAULT_API_KEY_ENV_VAR} env var (also supported in .env file).`);
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
