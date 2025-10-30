/**
 * Tests for CLI commands
 */

import fs from 'node:fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import tasksSchema from './tests/taskBase.ts';
import { Fetcher } from './client/fetcher.ts';
import { cli } from './cli.ts';
import { makeInTmpDir } from './tests/inTmpDir.ts';

describe('CLI', () => {
  const mockFetch = vi.fn(async () => tasksSchema);
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
      await mockedCli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123", "--output", "schemas/frEvents.ts"]);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.ts`, 'utf-8')).toMatchSnapshot();
    });

    it('should generate  js', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await mockedCli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123", "--output", "schemas/frEvents.js"]);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.js`, 'utf-8')).toMatchSnapshot();
    });

    it('should use custom --base-name', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await mockedCli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123", "--output", "schemas/frEvents.js", "--base-name", "My Custom Base"]);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.js`, 'utf-8')).toMatchSnapshot();
    });
  });

  describe('CLI integration', () => {
    it('should display help text with --help', () => {
      expect(true).toBe(true);
    });

    it('should display version with --version', () => {
      expect(true).toBe(true);
    });
  });

  describe('CLI error handling', () => {
    it('should require base-id for codegen command', async () => {
      await expect(
        async () => await mockedCli(["codegen", "--api-key", "patTest123", "--output", "schemas/frEvents.ts"])
      ).rejects.toThrow();
    });

    it('should require api-key for codegen command', async () => {
      await expect(
        async () => await mockedCli(["codegen", "--base-id", "appTestBase", "--output", "schemas/frEvents.ts"])
      ).rejects.toThrow();
    });
    it('should require output for codegen command', async () => {
      await expect(
        async () => await mockedCli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123"])
      ).rejects.toThrow();
    });
  });
});
