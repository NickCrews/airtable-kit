/**
 * Integration tests for code generator
 * Tests the full flow from schema to generated TypeScript code
 */

import { describe, it, expect } from 'vitest';
import { generateCode } from './index.ts';
import taskBase from '../tests/taskBase.ts';

describe('Code Generator Integration', () => {
  it('should match snapshot with no options', () => {
    const code = generateCode(taskBase);
    expect(code).toMatchSnapshot();
  });

  it('should match snapshot with filetype=js', () => {
    const code = generateCode(taskBase, { filetype: 'js' });
    expect(code).toMatchSnapshot();
  });

  it('should match snapshot with filetype=ts', async () => {
    const code = generateCode(taskBase, { filetype: 'ts' });
    expect(code).toMatchSnapshot();
  });
});
