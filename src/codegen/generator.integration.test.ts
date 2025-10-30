/**
 * Integration tests for code generator
 * Tests the full flow from schema to generated TypeScript code
 */

import { describe, it, expect } from 'vitest';
import { generateCode } from './index.ts';
import taskBase from '../tests/taskBase.ts';
import { de } from 'zod/locales';

describe('Code Generator Integration', () => {
  it('should match snapshot with no options', async () => {
    const code = await generateCode(taskBase);
    expect(code).toMatchSnapshot();
  });

  it('should match snapshot with filetype=js', async () => {
    const code = await generateCode(taskBase, { filetype: 'js' });
    expect(code).toMatchSnapshot();
  });

  it('should match snapshot with filetype=ts', async () => {
    const code = await generateCode(taskBase, { filetype: 'ts' });
    expect(code).toMatchSnapshot();
  });

  describe('Name Escaping', () => {
    const baseWithBadNames = {
      ...taskBase,
      name: 'My Base!',
      tables: [
        {
          ...taskBase.tables[0],
          name: 'await',
          fields: [
            {
              ...taskBase.tables[0].fields[0],
              name: '1st Field',
            },
          ],
        },
      ],
    };
    it('should work by default', async () => {
      const code = await generateCode(baseWithBadNames, { filetype: 'ts' });
      expect(code).toMatchInlineSnapshot(`
      "/**
       * Auto-generated from Airtable schema
       * Do not edit manually
       */

      export default {
        "id": "appTaskBase",
        "name": "myBase",
        "tables": [
          {
            "id": "tblTasks",
            "name": "_await",
            "fields": [
              {
                "id": "fldName",
                "name": "_1StField",
                "type": "singleLineText",
                "description": "The name of the task"
              }
            ]
          }
        ]
      } as const;
      "
    `);
    });
    it('should work with custom escape function', async () => {
      const escapeFn = (name: string) => `_${name.replace(/\\W/g, '')}_`;
      const code = await generateCode(baseWithBadNames, { filetype: 'ts', escapeIdentifiers: escapeFn });
      expect(code).toMatchInlineSnapshot(`
      "/**
       * Auto-generated from Airtable schema
       * Do not edit manually
       */

      export default {
        "id": "appTaskBase",
        "name": "_My Base!_",
        "tables": [
          {
            "id": "tblTasks",
            "name": "_await_",
            "fields": [
              {
                "id": "fldName",
                "name": "_1st Field_",
                "type": "singleLineText",
                "description": "The name of the task"
              }
            ]
          }
        ]
      } as const;
      "
    `);
    });
    it('should work with escapeIdentifiers=false', async () => {
      const code = await generateCode(baseWithBadNames, { filetype: 'ts', escapeIdentifiers: false });
      expect(code).toMatchInlineSnapshot(`
      "/**
       * Auto-generated from Airtable schema
       * Do not edit manually
       */

      export default {
        "id": "appTaskBase",
        "name": "My Base!",
        "tables": [
          {
            "id": "tblTasks",
            "name": "await",
            "fields": [
              {
                "id": "fldName",
                "name": "1st Field",
                "type": "singleLineText",
                "description": "The name of the task"
              }
            ]
          }
        ]
      } as const;
      "
    `);
    });
  });
});
