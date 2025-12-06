/**
 * Tests for CLI commands
 */

import fs from 'node:fs';
import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { cli } from './cli.ts';
import { makeInTmpDir } from './tests/inTmpDir.ts';
import { getTestEnv } from './tests/test-utils.ts';
import realSchema from './tests/test-base-schema.generated.ts';

const {
  AIRTABLE_KIT_TEST_API_KEY: apiKey,
  AIRTABLE_KIT_TEST_BASE_ID: baseId,
  AIRTABLE_KIT_TEST_WORKSPACE_ID: workspaceId,
} = getTestEnv();

const importTsJs = (p: string) => import(p).then((mod) => mod.default || mod);

describe('CLI', () => {
  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
  }

  const callCli = (args: string[]) => cli(args, undefined, mockConsole);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const inTmpDir = makeInTmpDir();

  describe('codegen command', () => {
    it('should create output directory', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await callCli(["codegen", "base", baseId, "--api-key", apiKey, "--outfile", "schemas/frEvents.ts"]);
      expect(await importTsJs(`${tmpDir}/schemas/frEvents.ts`)).toEqual(realSchema);
    });

    it('should generate  js', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await callCli(["codegen", "base", baseId, "--api-key", apiKey, "--outfile", "schemas/frEvents.js"]);
      expect(await importTsJs(`${tmpDir}/schemas/frEvents.js`)).toEqual(realSchema);
    });

    it('should use custom --base-name', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await callCli(["codegen", "base", baseId, "--api-key", apiKey, "--outfile", "schemas/frEvents.js", "--base-name", "My Custom Base"]);
      expect(await importTsJs(`${tmpDir}/schemas/frEvents.js`)).toEqual(realSchema);
    });

    it('should default outfile to ./<BASE_NAME>.generated.ts when omitted', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await callCli(["codegen", "base", baseId, "--api-key", apiKey]);
      // That should be the only file in the dir
      expect(fs.readdirSync(tmpDir)).toEqual(['airtableKitTestBase.generated.ts']);
      expect(await importTsJs(`${tmpDir}/airtableKitTestBase.generated.ts`)).toEqual(realSchema);
    });

    it('should generate all base schemas into outdir', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await callCli(["codegen", "all", "--api-key", apiKey, "--outdir", "schemas", "--format", "ts"]);
      // That should be the only file in the dir
      expect(fs.readdirSync(`${tmpDir}/schemas`)).toEqual(['airtableKitTestBase.generated.ts']);
      expect(await importTsJs(`${tmpDir}/schemas/airtableKitTestBase.generated.ts`)).toEqual(realSchema);
    });
  });

  describe('version and help', () => {
    const spiedFetch = vi.spyOn(globalThis, 'fetch');
    afterAll(() => {
      spiedFetch.mockRestore();
    });
    it('should display help text with "--help"', async () => {
      await callCli(["--help"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Airtable Kit CLI'));
      expect(spiedFetch).not.toHaveBeenCalled();
    });

    it('should display help text with "help"', async () => {
      await callCli(["help"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Airtable Kit CLI'));
      expect(spiedFetch).not.toHaveBeenCalled();
    });

    it('should display version with "--version"', async () => {
      await callCli(["--version"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+$/));
      expect(spiedFetch).not.toHaveBeenCalled();
    });
    it('should display version with "version"', async () => {
      await callCli(["version"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+$/));
      expect(spiedFetch).not.toHaveBeenCalled();
    });
  });

  describe('CLI error handling', () => {
    it('should require base-id for codegen base command', async () => {
      await expect(
        async () => await callCli(["codegen", "base", "--api-key", "patTest123"])
      ).rejects.toThrow();
    });

    it('should require api-key for codegen base command', async () => {
      await expect(
        async () => await callCli(["codegen", "base", "appTestBase"])
      ).rejects.toThrow();
    });

    it('should error for bogus --format', async () => {
      await expect(
        async () => await callCli(["codegen", "base", "appTestBase", "--api-key", "patTest123", "--format", "py"])
      ).rejects.toThrow();
    });
  });
});
