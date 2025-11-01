/**
 * Tests for CLI commands
 */

import fs from 'node:fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import tasksSchema from './tests/taskBase.ts';
import { type Fetcher } from './client/fetcher.ts';
import { cli } from './cli.ts';
import { makeInTmpDir } from './tests/inTmpDir.ts';

describe('CLI', () => {
  const mockFetch = vi.fn(async (args: { path: string }) => {
    if (args.path === '/meta/bases') {
      return {
        bases: [
          { id: 'appOne', name: 'Task Base', permissionLevel: 'edit' },
          { id: 'appTwo', name: 'Other Base', permissionLevel: 'edit' },
        ],
      };
    }
    if (args.path === '/meta/bases/appOne/tables' || args.path === '/meta/bases/appTwo/tables') {
      return { tables: (tasksSchema as any).tables };
    }
    if (args.path.startsWith('/meta/bases/')) {
      return { tables: (tasksSchema as any).tables };
    }
    return tasksSchema as any;
  });
  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
  }
  const mockFetcher = { fetch: mockFetch } as Fetcher;

  const mockedCli = (args: string[]) => cli(args, mockFetcher, mockConsole);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const inTmpDir = makeInTmpDir();

  describe('codegen command', () => {
    it('should create output directory', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await mockedCli(["codegen", "base", "appTestBase", "--api-key", "patTest123", "--outfile", "schemas/frEvents.ts"]);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.ts`, 'utf-8')).toMatchSnapshot();
    });

    it('should generate  js', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await mockedCli(["codegen", "base", "appTestBase", "--api-key", "patTest123", "--outfile", "schemas/frEvents.js"]);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.js`, 'utf-8')).toMatchSnapshot();
    });

    it('should use custom --base-name', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await mockedCli(["codegen", "base", "appTestBase", "--api-key", "patTest123", "--outfile", "schemas/frEvents.js", "--base-name", "My Custom Base"]);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.js`, 'utf-8')).toMatchSnapshot();
    });

    it('should default outfile to ./<BASE_NAME>-schema.ts when omitted', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await mockedCli(["codegen", "base", "appTestBase", "--api-key", "patTest123"]);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/appTestBase-schema.ts`, 'utf-8')).toMatchSnapshot();
    });

    it('should generate all base schemas into outdir', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await mockedCli(["codegen", "all", "--api-key", "patTest123", "--outdir", "schemas", "--format", "ts"]);
      expect(fs.readFileSync(`${tmpDir}/schemas/taskBase-schema.ts`, 'utf-8')).toMatchSnapshot();
      expect(fs.existsSync(`${tmpDir}/schemas/otherBase-schema.ts`)).toBe(true);
    });
  });

  describe('version and help', () => {
    it('should display help text with "--help"', async () => {
      await mockedCli(["--help"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Airtable Kit CLI'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should display help text with "help"', async () => {
      await mockedCli(["help"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Airtable Kit CLI'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should display version with "--version"', async () => {
      await mockedCli(["--version"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+$/));
      expect(mockFetch).not.toHaveBeenCalled();
    });
    it('should display version with "version"', async () => {
      await mockedCli(["version"]);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+$/));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('CLI error handling', () => {
    it('should require base-id for codegen base command', async () => {
      await expect(
        async () => await mockedCli(["codegen", "base", "--api-key", "patTest123"])
      ).rejects.toThrow();
    });

    it('should require api-key for codegen base command', async () => {
      await expect(
        async () => await mockedCli(["codegen", "base", "appTestBase"])
      ).rejects.toThrow();
    });
  });
});
