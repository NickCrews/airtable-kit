#!/usr/bin/env node
/**
 * CLI for airtable-kit
 */

import { cli } from "./cli.ts";

cli(process.argv.slice(2)).catch((error) => {
    console.error("❌ Error:", (error as Error).message);
    process.exit(1);
});