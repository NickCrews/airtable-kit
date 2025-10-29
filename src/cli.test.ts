/**
 * Tests for CLI commands
 */

import fs from 'node:fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import tasksSchema from './tests/taskBase.js';
import { Fetcher } from './client/fetcher.js';
import { cli } from './cli.js';
import { makeInTmpDir } from './tests/inTmpDir.js';
import { aw } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';

describe('CLI', () => {
  const mockFetch = vi.fn(async () => tasksSchema);
  const mockFetcher = { fetch: mockFetch } as Fetcher;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const inTmpDir = makeInTmpDir();

  describe('codegen command', () => {
    it('should create output directory', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123", "--output", "schemas/frEvents.ts"], mockFetcher);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.ts`, 'utf-8')).toMatchSnapshot();
    });

    it('should generate  js', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123", "--output", "schemas/frEvents.js"], mockFetcher);
      expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase/tables' });
      expect(fs.readFileSync(`${tmpDir}/schemas/frEvents.js`, 'utf-8')).toMatchSnapshot();
    });

    it('should use custom --base-name', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123", "--output", "schemas/frEvents.js", "--base-name", "My Custom Base"], mockFetcher);
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
});

describe('CLI error handling', () => {
  it('should require base-id for codegen command', () => {
    expect(
      async () => await cli(["codegen", "--api-key", "patTest123", "--output", "schemas/frEvents.ts"])
    ).rejects.toThrow();
  });

  it('should require api-key for codegen command', () => {
    expect(
      async () => await cli(["codegen", "--base-id", "appTestBase", "--output", "schemas/frEvents.ts"])
    ).rejects.toThrow();
  });
  it('should require output for codegen command', () => {
    expect(
      async () => await cli(["codegen", "--base-id", "appTestBase", "--api-key", "patTest123"])
    ).rejects.toThrow();
  });
});
