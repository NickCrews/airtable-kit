import { parseEnv } from 'node:util';
import path from "node:path";
import process from 'node:process';
import fs from 'node:fs';
import { Command } from 'commander';

import { fetchAllSchemas } from "../bases/index.ts";
import { generateCode } from "../codegen/index.ts";
import { IntoFetcher, DEFAULT_API_KEY_ENV_VAR } from '../fetcher.ts';
import { toIdentifier } from '../codegen/identifiers.ts';
import { createBaseCommand } from "./base.ts";
import { createTableCommand } from "./table.ts";
import { createFieldCommand } from "./field.ts";
import { createRecordCommand } from "./record.ts";

import * as packageJson from '../../package.json';

type Consolish = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export async function cli(args: string[], fetcher?: IntoFetcher, console: Consolish = globalThis.console): Promise<void> {
  const program = new Command()
    .name('airtable-kit')
    .version(packageJson.version, "--version")
    .helpCommand(false)
    .description('A better TypeScript Airtable toolkit')
    .option('--api-key <key>', 'Airtable API key')
    .option('--output <format>', 'Output format: json or markdown (default: markdown)')
    .configureOutput({
      writeOut: (str) => console.log(str),
      writeErr: (str) => console.error(str),
    })
    .exitOverride();

  const resolveFetcher = (): IntoFetcher => {
    const apiKeyFromArgs = getApiKeyFromArgs(args);
    return fetcher ?? getApiKey(apiKeyFromArgs);
  };

  program.addCommand(createBaseCommand(resolveFetcher));
  program.addCommand(createTableCommand(resolveFetcher));
  program.addCommand(createFieldCommand(resolveFetcher));
  program.addCommand(createRecordCommand(resolveFetcher));

  program
    .command('codegen')
    .description('Generate ts/js schema files for all bases. Shortcut for running "base codegen <baseId>" command with all bases sequentially.')
    .option('--api-key <key>', 'Airtable API key')
    .option('--format <format>', 'Output format: ts or js')
    .option('--outdir <path>', 'Output directory', '.atk/bases')
    .action(async (options) => {
      const finalFetcher = fetcher ?? getApiKey(options.apiKey);
      const finalFormat = (options.format === 'ts' || options.format === 'js') ? options.format : 'ts';
      const outDir = options.outdir ?? '.atk/bases';

      console.log("🔍 Fetching all base schemas...");
      const baseSchemas = await fetchAllSchemas({ fetcher: finalFetcher });
      console.log(`✓ Found ${baseSchemas.length} bases`);

      for (const baseSchema of baseSchemas) {
        const safeName = toIdentifier(baseSchema.name) || baseSchema.name;
        const outPath = path.join(outDir, `${safeName}.generated.${finalFormat}`);
        await generateCode(baseSchema, { format: finalFormat, outPath });
        console.log(`  • Generated ${outPath}`);
      }
      console.log(`\n✅ Generated ${baseSchemas.length} schema file(s) in ${outDir}`);
    });

  if (args.length === 0) {
    program.outputHelp();
    return;
  }

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

function getApiKeyFromArgs(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--api-key') {
      return args[i + 1];
    }
    if (arg.startsWith('--api-key=')) {
      return arg.slice('--api-key='.length);
    }
  }
  return undefined;
}

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
