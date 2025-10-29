/**
 * Integration tests for code generator
 * Tests the full flow from schema to generated TypeScript code
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { generateCode } from './index.js';
import taskBase from '../tests/taskBase.js';

describe('Code Generator Integration', () => {
  const fullSchema = {...taskBase, id: 'appTestBase123' as const, name: 'Test Base'}
  it('should match snapshot with no options', () => {
    const code = generateCode(fullSchema);
    expect(code).toMatchSnapshot();
  });

  it('should match snapshot with filetype=js', () => {
    const code = generateCode(fullSchema, { filetype: 'js' });
    expect(code).toMatchSnapshot();
  });

  it('should match snapshot with filetype=ts', async () => {
    const code = generateCode(fullSchema, { filetype: 'ts' });
    expect(code).toMatchSnapshot();
  });
});
