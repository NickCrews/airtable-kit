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
  const callCli = (args: string[]) => cli(args, undefined);

  const inTmpDir = makeInTmpDir();
  const cliWithApiKey = (args: string[]) => callCli(["--api-key", apiKey, ...args]);

  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => { });
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('version and help', () => {
    const spiedFetch = vi.spyOn(globalThis, 'fetch');
    afterAll(() => {
      spiedFetch.mockRestore();
    });
    it('should display help text with "--help"', async () => {
      await callCli(["--help"]);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage: airtable-kit'));
      expect(spiedFetch).not.toHaveBeenCalled();
    });

    it('should display help text with no args', async () => {
      await callCli([]);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage: airtable-kit'));
      expect(spiedFetch).not.toHaveBeenCalled();
    });

    it('should display version with "--version"', async () => {
      await callCli(["--version"]);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/\d+\.\d+\.\d+/));
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
      await cliWithApiKey(["codegen", "--outdir", "schemas", "--format", "ts"]);
      // That should be the only file in the dir
      expect(fs.readdirSync(`${tmpDir}/schemas`)).toEqual(['airtableKitTestBase.generated.ts']);
      expect(await importTsJs(`${tmpDir}/schemas/airtableKitTestBase.generated.ts`)).toEqual(realSchema);
    });
  });
  it('should handle invalid api key gracefully', async () => {
    await callCli(["codegen", "--api-key", "invalid_key"]);
    expect(mockConsoleError.mock.calls).toMatchInlineSnapshot(`[]`);
  });

  describe('base command', () => {
    it('should list bases', async () => {
      await cliWithApiKey(["base", "list"]);
      const calls = mockConsoleLog.mock.calls.map(c => c[0]);
      expect(calls.some(c => typeof c === 'string' && c.includes('airtable-kit'))).toBe(true);
    });

    it('should list bases as json', async () => {
      await cliWithApiKey(["base", "list", "--output", "json"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "| Name | ID | Tables |
        | --- | --- | --- |
        | airtable-kit Test Base | apprK003uuaGNkYHt | 3 |

        **Total: 1 bases**",
          ],
        ]
      `);
    });

    it('should get base details by id', async () => {
      await cliWithApiKey(["base", "get", baseId]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "# airtable-kit Test Base

        ## Metadata

        | Property | Value |
        | --- | --- |
        | ID | apprK003uuaGNkYHt |
        | Name | airtable-kit Test Base |
        ## Tables

        **Total: 3 tables**

        - **linkedItems** (\`tblQmRji68UKpOvpr\`): 3 fields
        - **tasks** (\`tblF7z7AZkP8kGBk9\`): 8 fields
        - **allTypes** (\`tblWElQIMTlgl1Udr\`): 22 fields
        ",
          ],
        ]
      `);
    });

    it('should get base details as json', async () => {
      await cliWithApiKey(["base", "get", baseId, "--output", "json"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "# airtable-kit Test Base

        ## Metadata

        | Property | Value |
        | --- | --- |
        | ID | apprK003uuaGNkYHt |
        | Name | airtable-kit Test Base |
        ## Tables

        **Total: 3 tables**

        - **linkedItems** (\`tblQmRji68UKpOvpr\`): 3 fields
        - **tasks** (\`tblF7z7AZkP8kGBk9\`): 8 fields
        - **allTypes** (\`tblWElQIMTlgl1Udr\`): 22 fields
        ",
          ],
        ]
      `);
    });

    it('should set base context with use command', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cliWithApiKey(["base", "use", baseId]);
      const calls = mockConsoleLog.mock.calls.map(c => c[0]);
      expect(calls.some(c => typeof c === 'string' && c.includes('✓ Set current base'))).toBe(true);
    });

    it('should generate schema for specific base', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cliWithApiKey(["base", "codegen", baseId, "--outdir", "schemas", "--format", "ts"]);
      const files = fs.readdirSync(`${tmpDir}/schemas`);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/\.generated\.ts$/);
    });

    it('should generate schema in javascript format', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cliWithApiKey(["base", "codegen", baseId, "--outdir", "schemas", "--format", "js"]);
      const files = fs.readdirSync(`${tmpDir}/schemas`);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/\.generated\.js$/);
    });
  });

  describe('table command', () => {

    it('should list tables in a base', async () => {
      await cliWithApiKey(["table", "list", "--base", baseId]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "| Name | ID | Fields | Description |
        | --- | --- | --- | --- |
        | linkedItems | tblQmRji68UKpOvpr | 3 | Simple table for testing record links, rollups, and lookups |
        | tasks | tblF7z7AZkP8kGBk9 | 8 | Task tracking table |
        | allTypes | tblWElQIMTlgl1Udr | 22 | Table with all field types for comprehensive testing |

        **Total: 3 tables**",
          ],
        ]
      `);
    });

    it('should list tables as json', async () => {
      await cliWithApiKey(["table", "list", "--base", baseId, "--output", "json"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "| Name | ID | Fields | Description |
        | --- | --- | --- | --- |
        | linkedItems | tblQmRji68UKpOvpr | 3 | Simple table for testing record links, rollups, and lookups |
        | tasks | tblF7z7AZkP8kGBk9 | 8 | Task tracking table |
        | allTypes | tblWElQIMTlgl1Udr | 22 | Table with all field types for comprehensive testing |

        **Total: 3 tables**",
          ],
        ]
      `)
    });

    it('should get table details by id', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["table", "get", tableId, "--base", baseId]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "# linkedItems

        ## Metadata

        | Property | Value |
        | --- | --- |
        | ID | tblQmRji68UKpOvpr |
        | Name | linkedItems |
        | Fields | 3 |
        | Description | Simple table for testing record links, rollups, and lookups |
        ## Fields

        - **name** (\`fldqEHqF9nj767Myh\`) — singleLineText
        - **numberValue** (\`fldbhguSvmm9uHhuQ\`) — number — {"precision":0}...
        - **singleLineTextValue** (\`fldKly011PZtDYSbv\`) — singleLineText
        ",
          ],
        ]
      `);
    });

    it('should get table details by name', async () => {
      const tableName = realSchema.tables[0].name;
      await cliWithApiKey(["table", "get", tableName, "--base", baseId]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "# linkedItems

        ## Metadata

        | Property | Value |
        | --- | --- |
        | ID | tblQmRji68UKpOvpr |
        | Name | linkedItems |
        | Fields | 3 |
        | Description | Simple table for testing record links, rollups, and lookups |
        ## Fields

        - **name** (\`fldqEHqF9nj767Myh\`) — singleLineText
        - **numberValue** (\`fldbhguSvmm9uHhuQ\`) — number — {"precision":0}...
        - **singleLineTextValue** (\`fldKly011PZtDYSbv\`) — singleLineText
        ",
          ],
        ]
      `);
    });

    it('should get table details as json', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["table", "get", tableId, "--base", baseId, "--output", "json"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "# linkedItems

        ## Metadata

        | Property | Value |
        | --- | --- |
        | ID | tblQmRji68UKpOvpr |
        | Name | linkedItems |
        | Fields | 3 |
        | Description | Simple table for testing record links, rollups, and lookups |
        ## Fields

        - **name** (\`fldqEHqF9nj767Myh\`) — singleLineText
        - **numberValue** (\`fldbhguSvmm9uHhuQ\`) — number — {"precision":0}...
        - **singleLineTextValue** (\`fldKly011PZtDYSbv\`) — singleLineText
        ",
          ],
        ]
      `);
    });

    it('should set table context with use command', async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cliWithApiKey(["base", "use", baseId]);
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["table", "use", tableId, "--base", baseId]);
      const calls = mockConsoleLog.mock.calls.map(c => c[0]);
      expect(calls.some(c => typeof c === 'string' && c.includes('✓ Set current table'))).toBe(true);
    });
  });

  describe('field command', () => {
    beforeEach(async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cliWithApiKey(["base", "use", baseId]);
    });

    it('should list fields in a table', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["field", "list", "--base", baseId, "--table", tableId]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "| Name | ID | Type | Description |
        | --- | --- | --- | --- |
        | name | fldqEHqF9nj767Myh | singleLineText | Item name |
        | numberValue | fldbhguSvmm9uHhuQ | number | Numeric value for rollup testing |
        | singleLineTextValue | fldKly011PZtDYSbv | singleLineText | String value for rollup testing |

        **Total: 3 fields**",
          ],
        ]
      `);
    });

    it('should list fields as json', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["field", "list", "--base", baseId, "--table", tableId, "--output", "json"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "| Name | ID | Type | Description |
        | --- | --- | --- | --- |
        | name | fldqEHqF9nj767Myh | singleLineText | Item name |
        | numberValue | fldbhguSvmm9uHhuQ | number | Numeric value for rollup testing |
        | singleLineTextValue | fldKly011PZtDYSbv | singleLineText | String value for rollup testing |

        **Total: 3 fields**",
          ],
        ]
      `);
    });

    it('should get field details by id', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldId = realSchema.tables[0].fields[0]?.id;
      await cliWithApiKey(["field", "get", fieldId, "--base", baseId, "--table", tableId]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "# name

        ## Details

        | Property | Value |
        | --- | --- |
        | ID | fldqEHqF9nj767Myh |
        | Name | name |
        | Type | singleLineText |
        | Description | Item name |
        ",
          ],
        ]
      `);
    });

    it('should get field details by name', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldName = realSchema.tables[0].fields[0]?.name;
      await cliWithApiKey(["field", "get", fieldName, "--base", baseId, "--table", tableId]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "# name

        ## Details

        | Property | Value |
        | --- | --- |
        | ID | fldqEHqF9nj767Myh |
        | Name | name |
        | Type | singleLineText |
        | Description | Item name |
        ",
          ],
        ]
      `);
    });

    it('should get field details as json', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldId = realSchema.tables[0].fields[0]?.id;
      await cliWithApiKey(["field", "get", fieldId, "--base", baseId, "--table", tableId, "--output", "json"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "# name

        ## Details

        | Property | Value |
        | --- | --- |
        | ID | fldqEHqF9nj767Myh |
        | Name | name |
        | Type | singleLineText |
        | Description | Item name |
        ",
          ],
        ]
      `);
    });
  });

  describe('record command', () => {
    beforeEach(async (ctx) => {
      const tmpDir = inTmpDir(ctx);
      await cliWithApiKey(["base", "use", baseId]);
    });

    it('should list records in a table', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["record", "list", "--base", baseId, "--table", tableId, "--max", "5"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "
        | ID | name | numberValue | singleLineTextValue |
        | --- | --- | --- | --- |
        | rec3bYL33aOP21zPL | undefined | undefined | undefined |
        | recCax8xrScOPulmL | undefined | undefined | undefined |
        | recK0JPwauCskngpI | undefined | undefined | undefined |
        | recW4MM6ALg2yi8Ud | undefined | undefined | undefined |
        | recnKrnFMsFU2Ez71 | undefined | undefined | undefined |

        **Total: 5 records**",
          ],
        ]
      `);
    });

    it('should list records as json', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["record", "list", "--base", baseId, "--table", tableId, "--output", "json", "--max", "5"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "
        | ID | name | numberValue | singleLineTextValue |
        | --- | --- | --- | --- |
        | rec3bYL33aOP21zPL | undefined | undefined | undefined |
        | recCax8xrScOPulmL | undefined | undefined | undefined |
        | recK0JPwauCskngpI | undefined | undefined | undefined |
        | recW4MM6ALg2yi8Ud | undefined | undefined | undefined |
        | recnKrnFMsFU2Ez71 | undefined | undefined | undefined |

        **Total: 5 records**",
          ],
        ]
      `);
    });

    it('should list records with field filter', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldName = realSchema.tables[0].fields[0]?.name;
      await cliWithApiKey(["record", "list", "--base", baseId, "--table", tableId, "--fields", fieldName, "--max", "5"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "
        | ID | name | numberValue | singleLineTextValue |
        | --- | --- | --- | --- |
        | rec3bYL33aOP21zPL | undefined | undefined | undefined |
        | recCax8xrScOPulmL | undefined | undefined | undefined |
        | recK0JPwauCskngpI | undefined | undefined | undefined |
        | recW4MM6ALg2yi8Ud | undefined | undefined | undefined |
        | recnKrnFMsFU2Ez71 | undefined | undefined | undefined |

        **Total: 5 records**",
          ],
        ]
      `);
    });

    it('should list records with max limit', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["record", "list", "--base", baseId, "--table", tableId, "--max", "1"]);
      expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (apprK003uuaGNkYHt)",
          ],
          [
            "
        | ID | name | numberValue | singleLineTextValue |
        | --- | --- | --- | --- |
        | rec3bYL33aOP21zPL | undefined | undefined | undefined |

        **Total: 1 records**",
          ],
        ]
      `);
    });
  });
});
