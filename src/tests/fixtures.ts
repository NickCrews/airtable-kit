/**
 * Vitest fixtures for tests. Import `test` from here instead of from vitest,
 * and destructure the fixtures a test needs from its first argument:
 *
 * ```ts
 * import { describe, expect } from "vitest";
 * import { test } from "../src/tests/fixtures.ts";
 *
 * test("lists the seeded tasks", async ({ base }) => {
 *     const tasks = await base.tables.tasks.listRecords();
 *     expect(tasks).toHaveLength(8);
 * });
 *
 * test("starts from an empty table", async ({ emptyBase }) => {
 *     await emptyBase.tables.tasks.createRecords([{ name: "Only task" }]);
 *     expect(await emptyBase.tables.tasks.listRecords()).toHaveLength(1);
 * });
 * ```
 *
 * Fixtures are set up only for the tests that destructure them, so a test that
 * doesn't touch the test base makes no requests and doesn't need the test env.
 *
 * `base` and `emptyBase` are the same Airtable base in different starting
 * states, so a test should use only one of them. Within a test, call
 * `base.reset()` or `base.clear()` to return to either state.
 */

import { test as vitestTest } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { type Airtable } from "../client.ts";
import { type TestBase, type TestEnv, createTestBase, getTestAirtable, getTestEnv } from "./test-utils.ts";

export interface Fixtures {
    /** The test environment variables. */
    env: TestEnv;
    /** An {@link Airtable} client using the test API key. */
    airtable: Airtable;
    /** The test base, with every table holding exactly the seed data. */
    base: TestBase;
    /** The test base, with every table empty. */
    emptyBase: TestBase;
    /**
     * A fresh directory at `<test file dir>/.test/<test file>/<test name>`, which is the
     * cwd for the duration of the test. It is left on disk afterwards for inspection.
     */
    tmpDir: string;
}

export const test = vitestTest.extend<Fixtures>({
    env: async ({ }, use) => {
        await use(getTestEnv());
    },
    airtable: async ({ }, use) => {
        await use(getTestAirtable());
    },
    base: async ({ airtable }, use) => {
        const base = createTestBase(airtable);
        await base.reset();
        await use(base);
    },
    emptyBase: async ({ airtable }, use) => {
        const base = createTestBase(airtable);
        await base.clear();
        await use(base);
    },
    tmpDir: async ({ task }, use) => {
        const testName = task.name !== "" ? task.name : task.id;
        const testPath = task.file.filepath;
        const dir = path.join(
            path.dirname(testPath),
            ".test",
            path.basename(testPath),
            testName.replace(/[^a-zA-Z0-9-_]/g, "_"),
        );
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
        const originalCwd = process.cwd();
        process.chdir(dir);
        try {
            await use(dir);
        } finally {
            process.chdir(originalCwd);
        }
    },
});

export const it = test;
