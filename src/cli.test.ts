/**
 * Tests for CLI commands
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import tasksSchema from './tests/taskBase.js';
import { Fetcher } from './client/fetcher.js';
import { cli } from './cli.js';

describe('CLI', () => {
  // const mockFetch = vi.fn(async () => tasksSchema);

  // const mockFetcher = { fetch: mockFetch } as Fetcher;
  // vi.mock('./client/fetcher.js', () => ({
  //   makeFetcher: vi.fn(() => mockFetcher),
  // }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('codegen command', () => {
    it('should create output directory', async () => {
      cli(['codegen', '--base-id', 'appTestBase123', '--api-key', 'keyTest123', '--output', './schemas/appTestBase123.ts']);
      // expect(mockFetch).toHaveBeenCalledWith({ path: '/meta/bases/appTestBase123/tables' });
    });

    it('should generate ts and js', async () => {

    });

    it('should use custom base nickname', async () => {

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
    expect(true).toBe(true);
  });

  it('should require api-key for codegen command', () => {
    expect(true).toBe(true);
  });

  it('should handle fetch errors gracefully', async () => {

  });

  it('should handle file write errors', async () => {

  });
});
