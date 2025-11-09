#!/usr/bin/env tsx
/**
 * Setup script to create the test base for integration tests
 *
 * This script:
 * 1. Validates required environment variables
 * 2. Creates a new test base via the Airtable Meta API
 * 3. Generates the TypeScript schema file
 * 4. Outputs the base ID for adding to environment variables
 */

import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBase } from "../src/tests/create-test-base.ts";
import { generateCode } from "../src/codegen/generator.ts";
import { WorkspaceId } from "../src/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.log("Creating test base for airtable-kit integration tests...\n");

    // Check for required environment variables
    const apiKey = process.env.AIRTABLE_API_KEY;
    const workspaceId = process.env.AIRTABLE_WORKSPACE_ID as WorkspaceId;

    if (!apiKey) {
        console.error("ERROR: AIRTABLE_API_KEY environment variable is not set.");
        console.error("Please set it to your Airtable personal access token.");
        console.error("\nExample:");
        console.error("  export AIRTABLE_API_KEY=patXXXXXXXXXXXXXX");
        process.exit(1);
    }

    if (!workspaceId) {
        console.error("ERROR: AIRTABLE_WORKSPACE_ID environment variable is not set.");
        console.error("Please set it to the workspace ID where the test base should be created.");
        console.error("\nYou can find workspace IDs in your Airtable workspace settings.");
        console.error("\nExample:");
        console.error("  export AIRTABLE_WORKSPACE_ID=wspXXXXXXXXXXXXXX");
        process.exit(1);
    }

    console.log(`✓ API key found: ${apiKey.substring(0, 10)}...`);
    console.log(`✓ Workspace ID: ${workspaceId}\n`);

    // Create the test base
    console.log("Creating test base via Airtable Meta API...");
    const baseSchema = await createBase(workspaceId, apiKey);
    console.log(`✓ Base created successfully: ${baseSchema.id}\n`);

    // Generate the TypeScript schema file
    console.log("Generating TypeScript schema file...");
    const schemaPath = path.join(__dirname, "..", "src", "tests", "test-base-schema.generated.ts");
    await generateCode(baseSchema, {
        outPath: schemaPath,
        format: "ts",
    });
    console.log(`✓ Schema file generated: ${schemaPath}\n`);

    // Output instructions for the user
    console.log("========================================");
    console.log("Setup complete!");
    console.log("========================================\n");
    console.log("Your test base has been created and is ready to use.\n");
    console.log("IMPORTANT: Add the following to your .env file or environment:\n");
    console.log(`  export AIRTABLE_TEST_BASE_ID=${baseSchema.id}\n`);
    console.log("Then run your tests with:");
    console.log("  pnpm test\n");
    console.log("View your test base in Airtable:");
    console.log(`  https://airtable.com/${baseSchema.id}\n`);
}

main().catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error.message);
    if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
    }
    process.exit(1);
});
