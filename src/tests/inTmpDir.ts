import { TaskContext, afterAll } from 'vitest';
import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import { afterEach } from 'node:test';

/**
 * Utility to run tests in a temporary directory.
 * Cleans up after the test is done.
 * 
 * @example
 * ```ts
 * import { describe, expect, it } from 'vitest';
 * import { makeInTmpDir } from './inTmpDir.ts';
 * import fs from 'node:fs';
 * import os from 'node:os';
 * 
 * describe('my test suite', () => {
 *   const inTmpDir = makeInTmpDir();
 * 
 *   it('should do something in a tmp dir', (ctx) => {
 *     const tmpDir = inTmpDir(ctx);
 *     fs.writeFileSync('test.txt', 'Hello, world!');
 *     expect(process.cwd()).toBe(tmpDir);
 *   });
 *   // After the test, the cwd is restored (but the tmp dir is not deleted for inspection)
 * });
 * ```  
 */
export function makeInTmpDir() {
    const originalCwd = process.cwd();
    afterEach(() => {
        process.chdir(originalCwd);
        // Don't cleanup to allow inspection of test artifacts
    });
    function inTmpDir(ctx: TaskContext) {
        const rawTestName = ctx.task.name != "" ? ctx.task.name : ctx.task.id;
        const safeTestName = rawTestName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const testPath = ctx.task.file.filepath;
        const testFileName = path.basename(testPath);
        const testDir = path.dirname(testPath);
        const tmpDir = path.join(testDir, '.test', testFileName, safeTestName);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.mkdirSync(tmpDir, { recursive: true });
        process.chdir(tmpDir);
        return tmpDir;
    }
    return inTmpDir;
}