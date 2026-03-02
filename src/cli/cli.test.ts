/**
 * Tests for CLI commands
 */

import fs from 'node:fs';
import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { cli } from './cli.ts';
import { makeInTmpDir } from '../tests/inTmpDir.ts';
import { getTestEnv } from '../tests/test-utils.ts';
import realSchema from '../tests/test-base-schema.generated.ts';

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

  describe('version and help', () => {
    const spiedFetch = vi.spyOn(globalThis, 'fetch');
    afterAll(() => {
      spiedFetch.mockRestore();
    });
    it('should display help text with "--help"', async () => {
      await callCli(["--help"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Usage: airtable-kit'));
      expect(spiedFetch).not.toHaveBeenCalled();
    });

    it('should display help text with no args', async () => {
      await callCli([]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Usage: airtable-kit'));
      expect(spiedFetch).not.toHaveBeenCalled();
    });

    it('should display version with "--version"', async () => {
      await callCli(["--version"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringMatching(/\d+\.\d+\.\d+/));
      expect(spiedFetch).not.toHaveBeenCalled();
    });
    it('should error when using "version" command', async () => {
      await expect(async () => await callCli(["version"])).rejects.toThrow();
    });
    it('should error when using "help" command', async () => {
      await expect(async () => await callCli(["help"])).rejects.toThrow();
    });
  });

  describe('codegen command', () => {
    it('should generate all base schemas into outdir', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await callCli(["codegen", "--api-key", apiKey, "--outdir", "schemas", "--format", "ts"]);
      // That should be the only file in the dir
      expect(fs.readdirSync(`${tmpDir}/schemas`)).toEqual(['airtableKitTestBase.generated.ts']);
      expect(await importTsJs(`${tmpDir}/schemas/airtableKitTestBase.generated.ts`)).toEqual(realSchema);
    });
  });
  it('should require valid base-id for codegen base command', async () => {
    await expect(
      async () => await callCli(["codegen", "--api-key", "bogus"])
    ).rejects.toThrow();
  });
});
