/**
 * Integration tests for code generator
 * Tests the full flow from schema to generated TypeScript code
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCodeGenerator } from './generator.js';
import taskBase from '../tests/taskBase.js';

describe('Code Generator Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test outputs
    tempDir = join(tmpdir(), `airtable-codegen-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should match snapshot for sample schema', () => {
    const generator = createCodeGenerator();
    const code = generator.generateSchema({...taskBase, id: 'appTestBase123', name: 'Test Base'});

    // Snapshot test - this will create a snapshot file on first run
    // and compare against it on subsequent runs
    expect(code).toMatchSnapshot();
  });

  it('should generate schema with all field types from sample', () => {
    const generator = createCodeGenerator({ variableName: 'testSchema' });
    const schema = createSampleBaseSchema();

    const code = generator.generateSchema(schema);

    // Verify all expected fields from Tasks table
    expect(code).toContain('"fldName"');
    expect(code).toContain('"fldStatus"');
    expect(code).toContain('"fldPriority"');
    expect(code).toContain('"fldDueDate"');
    expect(code).toContain('"fldCompleted"');
    expect(code).toContain('"fldNotes"');
    expect(code).toContain('"fldTags"');

    // Verify all expected fields from Users table
    expect(code).toContain('"fldEmail"');
    expect(code).toContain('"fldFullName"');
    expect(code).toContain('"fldPhone"');

    // Verify select options are included
    expect(code).toContain('"selTodo"');
    expect(code).toContain('"Todo"');
    expect(code).toContain('"selInProgress"');
    expect(code).toContain('"In Progress"');
    expect(code).toContain('"selDone"');
    expect(code).toContain('"Done"');

    // Verify multiple select options
    expect(code).toContain('"selUrgent"');
    expect(code).toContain('"Urgent"');
    expect(code).toContain('"selImportant"');
    expect(code).toContain('"Important"');

    // Verify select colors are included
    expect(code).toContain('"blueLight2"');
    expect(code).toContain('"yellowLight2"');
    expect(code).toContain('"greenLight2"');
    expect(code).toContain('"redLight2"');
    expect(code).toContain('"orangeLight2"');
  });

  it('should handle multiple write operations to same file', async () => {
    const generator = createCodeGenerator();
    const schema1 = createSampleBaseSchema();
    const schema2 = { ...schema1, id: 'appDifferentBase' };
    const outputPath = join(tempDir, 'schema.ts');

    // First write
    const code1 = generator.generateSchema(schema1);
    await generator.writeToFile(code1, outputPath);

    let content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('appTestBase123');

    // Second write (should overwrite)
    const code2 = generator.generateSchema(schema2);
    await generator.writeToFile(code2, outputPath);

    content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('appDifferentBase');
    expect(content).not.toContain('appTestBase123');
  });

  it('should generate schema with proper TypeScript const assertion', () => {
    const generator = createCodeGenerator();
    const schema = createSampleBaseSchema();

    const code = generator.generateSchema(schema);

    // Verify the structure ends with "as const;"
    expect(code).toMatch(/} as const;[\s]*$/);

    // Verify proper export
    expect(code).toMatch(/^\/\*\*[\s\S]*?\*\/\s*export const \w+ =/m);
  });

  it('should preserve field options in generated code', () => {
    const generator = createCodeGenerator();
    const schema = createSampleBaseSchema();

    const code = generator.generateSchema(schema);

    // Check that field options are preserved
    expect(code).toContain('"options"');
    expect(code).toContain('"choices"');

    // For number field, check precision if it exists
    const codeObj = JSON.parse(
      code.match(/= (.*) as const;/s)?.[1] || '{}'
    );

    const tasksTable = codeObj.tables.find((t: any) => t.id === 'tblTasks');
    const priorityField = tasksTable?.fields.find((f: any) => f.id === 'fldPriority');

    expect(priorityField).toBeDefined();
    expect(priorityField?.type).toBe('number');
  });
});

describe('Code Generator Error Handling', () => {
  it('should handle empty schema', () => {
    const generator = createCodeGenerator();
    const emptySchema = { id: 'appEmpty', tables: [] };

    const code = generator.generateSchema(emptySchema);

    expect(code).toContain('export const baseSchema =');
    expect(code).toContain('"id": "appEmpty"');
    expect(code).toContain('"tables": []');
  });

  it('should handle schema with special characters in names', () => {
    const generator = createCodeGenerator();
    const schema = {
      id: 'appTest',
      tables: [
        {
          id: 'tblTest',
          name: "Table with 'quotes' and \"double quotes\"",
          description: 'Description with\nnewlines\tand\ttabs',
          primaryFieldId: 'fld1',
          fields: [
            {
              id: 'fld1',
              name: 'Field with unicode: 日本語 🎉',
              type: 'singleLineText',
            },
          ],
          views: [],
        },
      ],
    };

    const code = generator.generateSchema(schema as any);

    expect(code).toContain('export const baseSchema =');
    // JSON.stringify should handle escaping
    expect(code).toBeTruthy();
  });

  it('should throw error when writing to invalid path', async () => {
    const generator = createCodeGenerator();
    const schema = createSampleBaseSchema();
    const code = generator.generateSchema(schema);

    // Try to write to an invalid path (assuming /invalid/path doesn't exist)
    await expect(
      generator.writeToFile(code, '/invalid/path/that/does/not/exist/schema.ts')
    ).rejects.toThrow();
  });
});
