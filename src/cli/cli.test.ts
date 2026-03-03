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

/**
 * Replaces Airtable IDs in a string with normalized, deterministic substitutes.
 * 
 * This function maps each unique Airtable ID to a numbered placeholder based on its prefix,
 * ensuring consistent scrubbing across multiple calls. IDs are identified by their 3-letter
 * prefix (app, tbl, fld, sel, viw, rec) followed by 14 alphanumeric characters.
 * 
 * @param s - The input string potentially containing Airtable IDs
 * @returns A string with all Airtable IDs replaced by normalized placeholders (e.g., "app0", "tbl1")
 * 
 * @example
 * const input = "app1a2b3c4d5e6f7 and tbl8g9h0i1j2k3l4 and app1a2b3c4d5e6f7 again";
 * const scrubbed = scrubIds(input);
 * // Returns: "app0 and tbl0 and app0 again"
 */
function scrubIds(s: string): string {
  const idMap = new Map<string, string>();
  const counters: Record<string, number> = {
    app: 0,
    tbl: 0,
    fld: 0,
    sel: 0,
    viw: 0,
    rec: 0,
  };

  return s.replace(/([a-z]{3})[0-9A-Za-z]{14}/g, (match) => {
    const prefix = match.slice(0, 3);
    if (idMap.has(match)) {
      return idMap.get(match)!;
    }

    if (prefix in counters) {
      const replacement = `${prefix}${counters[prefix]}`;
      counters[prefix]++;
      idMap.set(match, replacement);
      return replacement;
    }

    return match;
  });
}

function scrubAllCalls(calls: any[][]): any[][] {
  return calls.map((callArgs) =>
    callArgs.map((arg) =>
      typeof arg === 'string' ? scrubIds(arg) : arg
    )
  );
}

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
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "[
          {
            "id": "app0",
            "name": "airtable-kit Test Base",
            "tables": [
              {
                "id": "tbl0",
                "name": "linkedItems",
                "description": "Simple table for testing record links, rollups, and lookups",
                "primaryFieldId": "fld0",
                "fields": [
                  {
                    "type": "singleLineText",
                    "id": "fld0",
                    "name": "name",
                    "description": "Item name"
                  },
                  {
                    "type": "number",
                    "options": {
                      "precision": 0
                    },
                    "id": "fld1",
                    "name": "numberValue",
                    "description": "Numeric value for rollup testing"
                  },
                  {
                    "type": "singleLineText",
                    "id": "fld2",
                    "name": "singleLineTextValue",
                    "description": "String value for rollup testing"
                  }
                ],
                "views": [
                  {
                    "id": "viw0",
                    "name": "Grid view",
                    "type": "grid"
                  }
                ]
              },
              {
                "id": "tbl1",
                "name": "tasks",
                "description": "Task tracking table",
                "primaryFieldId": "fld3",
                "fields": [
                  {
                    "type": "singleLineText",
                    "id": "fld3",
                    "name": "name",
                    "description": "The name of the task"
                  },
                  {
                    "type": "singleSelect",
                    "options": {
                      "choices": [
                        {
                          "id": "sel0",
                          "name": "Todo",
                          "color": "blueLight2"
                        },
                        {
                          "id": "sel1",
                          "name": "In Progress",
                          "color": "yellowLight2"
                        },
                        {
                          "id": "sel2",
                          "name": "Done",
                          "color": "greenLight2"
                        }
                      ]
                    },
                    "id": "fld4",
                    "name": "status",
                    "description": "The current status of the task"
                  },
                  {
                    "type": "number",
                    "options": {
                      "precision": 0
                    },
                    "id": "fld5",
                    "name": "priority",
                    "description": "The priority level of the task. Lower numbers indicate higher priority."
                  },
                  {
                    "type": "date",
                    "options": {
                      "dateFormat": {
                        "name": "iso",
                        "format": "YYYY-MM-DD"
                      }
                    },
                    "id": "fld6",
                    "name": "dueDate",
                    "description": "The due date of the task"
                  },
                  {
                    "type": "checkbox",
                    "options": {
                      "icon": "check",
                      "color": "greenBright"
                    },
                    "id": "fld7",
                    "name": "completed",
                    "description": "Whether the task is completed"
                  },
                  {
                    "type": "multilineText",
                    "id": "fld8",
                    "name": "notes",
                    "description": "Additional notes about the task"
                  },
                  {
                    "type": "multipleSelects",
                    "options": {
                      "choices": [
                        {
                          "id": "sel3",
                          "name": "Urgent",
                          "color": "redLight2"
                        },
                        {
                          "id": "sel4",
                          "name": "Important",
                          "color": "orangeLight2"
                        }
                      ]
                    },
                    "id": "fld9",
                    "name": "tags",
                    "description": "Tags associated with the task"
                  },
                  {
                    "type": "multipleAttachments",
                    "options": {
                      "isReversed": false
                    },
                    "id": "fld10",
                    "name": "attachments",
                    "description": "Files attached to the task"
                  }
                ],
                "views": [
                  {
                    "id": "viw1",
                    "name": "Grid view",
                    "type": "grid"
                  }
                ]
              },
              {
                "id": "tbl2",
                "name": "allTypes",
                "description": "Table with all field types for comprehensive testing",
                "primaryFieldId": "fld11",
                "fields": [
                  {
                    "type": "barcode",
                    "id": "fld11",
                    "name": "barcode"
                  },
                  {
                    "type": "checkbox",
                    "options": {
                      "icon": "check",
                      "color": "blueBright"
                    },
                    "id": "fld12",
                    "name": "checkbox"
                  },
                  {
                    "type": "currency",
                    "options": {
                      "precision": 2,
                      "symbol": "$"
                    },
                    "id": "fld13",
                    "name": "currency"
                  },
                  {
                    "type": "date",
                    "options": {
                      "dateFormat": {
                        "name": "iso",
                        "format": "YYYY-MM-DD"
                      }
                    },
                    "id": "fld14",
                    "name": "date"
                  },
                  {
                    "type": "dateTime",
                    "options": {
                      "dateFormat": {
                        "name": "iso",
                        "format": "YYYY-MM-DD"
                      },
                      "timeFormat": {
                        "name": "24hour",
                        "format": "HH:mm"
                      },
                      "timeZone": "utc"
                    },
                    "id": "fld15",
                    "name": "dateTime"
                  },
                  {
                    "type": "duration",
                    "options": {
                      "durationFormat": "h:mm:ss"
                    },
                    "id": "fld16",
                    "name": "duration"
                  },
                  {
                    "type": "email",
                    "id": "fld17",
                    "name": "email"
                  },
                  {
                    "type": "multilineText",
                    "id": "fld18",
                    "name": "multilineText"
                  },
                  {
                    "type": "multipleAttachments",
                    "options": {
                      "isReversed": false
                    },
                    "id": "fld19",
                    "name": "multipleAttachments"
                  },
                  {
                    "type": "multipleSelects",
                    "options": {
                      "choices": [
                        {
                          "id": "sel5",
                          "name": "Tag 1",
                          "color": "blueBright"
                        },
                        {
                          "id": "sel6",
                          "name": "Tag 2",
                          "color": "greenBright"
                        },
                        {
                          "id": "sel7",
                          "name": "Tag 3",
                          "color": "orangeBright"
                        }
                      ]
                    },
                    "id": "fld20",
                    "name": "multipleSelects"
                  },
                  {
                    "type": "number",
                    "options": {
                      "precision": 5
                    },
                    "id": "fld21",
                    "name": "Number"
                  },
                  {
                    "type": "percent",
                    "options": {
                      "precision": 2
                    },
                    "id": "fld22",
                    "name": "Percent"
                  },
                  {
                    "type": "phoneNumber",
                    "id": "fld23",
                    "name": "PhoneNumber"
                  },
                  {
                    "type": "rating",
                    "options": {
                      "icon": "star",
                      "max": 10,
                      "color": "yellowBright"
                    },
                    "id": "fld24",
                    "name": "Rating"
                  },
                  {
                    "type": "richText",
                    "id": "fld25",
                    "name": "RichText"
                  },
                  {
                    "type": "singleCollaborator",
                    "id": "fld26",
                    "name": "SingleCollaborator"
                  },
                  {
                    "type": "singleLineText",
                    "id": "fld27",
                    "name": "SingleLineText"
                  },
                  {
                    "type": "singleSelect",
                    "options": {
                      "choices": [
                        {
                          "id": "sel8",
                          "name": "Option A",
                          "color": "blueLight2"
                        },
                        {
                          "id": "sel9",
                          "name": "Option B",
                          "color": "greenLight2"
                        },
                        {
                          "id": "sel10",
                          "name": "Option C",
                          "color": "redLight2"
                        }
                      ]
                    },
                    "id": "fld28",
                    "name": "SingleSelect"
                  },
                  {
                    "type": "url",
                    "id": "fld29",
                    "name": "URL"
                  },
                  {
                    "type": "formula",
                    "options": {
                      "isValid": true,
                      "formula": "\\"hello\\" & {fld27}",
                      "referencedFieldIds": [
                        "fld27"
                      ],
                      "result": {
                        "type": "singleLineText"
                      }
                    },
                    "id": "fld30",
                    "name": "FormulaSingleLineText"
                  },
                  {
                    "type": "formula",
                    "options": {
                      "isValid": true,
                      "formula": "AND({fld12}, TRUE())",
                      "referencedFieldIds": [
                        "fld12"
                      ],
                      "result": {
                        "type": "checkbox",
                        "options": {
                          "icon": "check",
                          "color": "greenBright"
                        }
                      }
                    },
                    "id": "fld31",
                    "name": "FormulaCheckbox"
                  },
                  {
                    "type": "formula",
                    "options": {
                      "isValid": true,
                      "formula": "{fld21} + 5",
                      "referencedFieldIds": [
                        "fld21"
                      ],
                      "result": {
                        "type": "number",
                        "options": {
                          "precision": 0
                        }
                      }
                    },
                    "id": "fld32",
                    "name": "FormulaNumber"
                  }
                ],
                "views": [
                  {
                    "id": "viw2",
                    "name": "Grid view",
                    "type": "grid"
                  }
                ]
              }
            ]
          }
        ]",
          ],
        ]
      `);
    });

    it('should get base details by id', async () => {
      await cliWithApiKey(["base", "get", baseId]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "# Base \`airtable-kit Test Base\` (app0)
          
        - **Name**: airtable-kit Test Base
        - **ID**: app0
        - **URL**: [https://airtable.com/app0](https://airtable.com/app0)

        ## Tables (3)

        | Name        | ID                | Fields | Description                                                 |
        | ----------- | ----------------- | ------ | ----------------------------------------------------------- |
        | linkedItems | tbl0 | 3      | Simple table for testing record links, rollups, and lookups |
        | tasks       | tbl1 | 8      | Task tracking table                                         |
        | allTypes    | tbl2 | 22     | Table with all field types for comprehensive testing        |",
          ],
        ]
      `);
    });

    it('should get base details as json', async () => {
      await cliWithApiKey(["base", "get", baseId, "--output", "json"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "{
          "id": "app0",
          "name": "airtable-kit Test Base",
          "tables": [
            {
              "id": "tbl0",
              "name": "linkedItems",
              "description": "Simple table for testing record links, rollups, and lookups",
              "primaryFieldId": "fld0",
              "fields": [
                {
                  "type": "singleLineText",
                  "id": "fld0",
                  "name": "name",
                  "description": "Item name"
                },
                {
                  "type": "number",
                  "options": {
                    "precision": 0
                  },
                  "id": "fld1",
                  "name": "numberValue",
                  "description": "Numeric value for rollup testing"
                },
                {
                  "type": "singleLineText",
                  "id": "fld2",
                  "name": "singleLineTextValue",
                  "description": "String value for rollup testing"
                }
              ],
              "views": [
                {
                  "id": "viw0",
                  "name": "Grid view",
                  "type": "grid"
                }
              ]
            },
            {
              "id": "tbl1",
              "name": "tasks",
              "description": "Task tracking table",
              "primaryFieldId": "fld3",
              "fields": [
                {
                  "type": "singleLineText",
                  "id": "fld3",
                  "name": "name",
                  "description": "The name of the task"
                },
                {
                  "type": "singleSelect",
                  "options": {
                    "choices": [
                      {
                        "id": "sel0",
                        "name": "Todo",
                        "color": "blueLight2"
                      },
                      {
                        "id": "sel1",
                        "name": "In Progress",
                        "color": "yellowLight2"
                      },
                      {
                        "id": "sel2",
                        "name": "Done",
                        "color": "greenLight2"
                      }
                    ]
                  },
                  "id": "fld4",
                  "name": "status",
                  "description": "The current status of the task"
                },
                {
                  "type": "number",
                  "options": {
                    "precision": 0
                  },
                  "id": "fld5",
                  "name": "priority",
                  "description": "The priority level of the task. Lower numbers indicate higher priority."
                },
                {
                  "type": "date",
                  "options": {
                    "dateFormat": {
                      "name": "iso",
                      "format": "YYYY-MM-DD"
                    }
                  },
                  "id": "fld6",
                  "name": "dueDate",
                  "description": "The due date of the task"
                },
                {
                  "type": "checkbox",
                  "options": {
                    "icon": "check",
                    "color": "greenBright"
                  },
                  "id": "fld7",
                  "name": "completed",
                  "description": "Whether the task is completed"
                },
                {
                  "type": "multilineText",
                  "id": "fld8",
                  "name": "notes",
                  "description": "Additional notes about the task"
                },
                {
                  "type": "multipleSelects",
                  "options": {
                    "choices": [
                      {
                        "id": "sel3",
                        "name": "Urgent",
                        "color": "redLight2"
                      },
                      {
                        "id": "sel4",
                        "name": "Important",
                        "color": "orangeLight2"
                      }
                    ]
                  },
                  "id": "fld9",
                  "name": "tags",
                  "description": "Tags associated with the task"
                },
                {
                  "type": "multipleAttachments",
                  "options": {
                    "isReversed": false
                  },
                  "id": "fld10",
                  "name": "attachments",
                  "description": "Files attached to the task"
                }
              ],
              "views": [
                {
                  "id": "viw1",
                  "name": "Grid view",
                  "type": "grid"
                }
              ]
            },
            {
              "id": "tbl2",
              "name": "allTypes",
              "description": "Table with all field types for comprehensive testing",
              "primaryFieldId": "fld11",
              "fields": [
                {
                  "type": "barcode",
                  "id": "fld11",
                  "name": "barcode"
                },
                {
                  "type": "checkbox",
                  "options": {
                    "icon": "check",
                    "color": "blueBright"
                  },
                  "id": "fld12",
                  "name": "checkbox"
                },
                {
                  "type": "currency",
                  "options": {
                    "precision": 2,
                    "symbol": "$"
                  },
                  "id": "fld13",
                  "name": "currency"
                },
                {
                  "type": "date",
                  "options": {
                    "dateFormat": {
                      "name": "iso",
                      "format": "YYYY-MM-DD"
                    }
                  },
                  "id": "fld14",
                  "name": "date"
                },
                {
                  "type": "dateTime",
                  "options": {
                    "dateFormat": {
                      "name": "iso",
                      "format": "YYYY-MM-DD"
                    },
                    "timeFormat": {
                      "name": "24hour",
                      "format": "HH:mm"
                    },
                    "timeZone": "utc"
                  },
                  "id": "fld15",
                  "name": "dateTime"
                },
                {
                  "type": "duration",
                  "options": {
                    "durationFormat": "h:mm:ss"
                  },
                  "id": "fld16",
                  "name": "duration"
                },
                {
                  "type": "email",
                  "id": "fld17",
                  "name": "email"
                },
                {
                  "type": "multilineText",
                  "id": "fld18",
                  "name": "multilineText"
                },
                {
                  "type": "multipleAttachments",
                  "options": {
                    "isReversed": false
                  },
                  "id": "fld19",
                  "name": "multipleAttachments"
                },
                {
                  "type": "multipleSelects",
                  "options": {
                    "choices": [
                      {
                        "id": "sel5",
                        "name": "Tag 1",
                        "color": "blueBright"
                      },
                      {
                        "id": "sel6",
                        "name": "Tag 2",
                        "color": "greenBright"
                      },
                      {
                        "id": "sel7",
                        "name": "Tag 3",
                        "color": "orangeBright"
                      }
                    ]
                  },
                  "id": "fld20",
                  "name": "multipleSelects"
                },
                {
                  "type": "number",
                  "options": {
                    "precision": 5
                  },
                  "id": "fld21",
                  "name": "Number"
                },
                {
                  "type": "percent",
                  "options": {
                    "precision": 2
                  },
                  "id": "fld22",
                  "name": "Percent"
                },
                {
                  "type": "phoneNumber",
                  "id": "fld23",
                  "name": "PhoneNumber"
                },
                {
                  "type": "rating",
                  "options": {
                    "icon": "star",
                    "max": 10,
                    "color": "yellowBright"
                  },
                  "id": "fld24",
                  "name": "Rating"
                },
                {
                  "type": "richText",
                  "id": "fld25",
                  "name": "RichText"
                },
                {
                  "type": "singleCollaborator",
                  "id": "fld26",
                  "name": "SingleCollaborator"
                },
                {
                  "type": "singleLineText",
                  "id": "fld27",
                  "name": "SingleLineText"
                },
                {
                  "type": "singleSelect",
                  "options": {
                    "choices": [
                      {
                        "id": "sel8",
                        "name": "Option A",
                        "color": "blueLight2"
                      },
                      {
                        "id": "sel9",
                        "name": "Option B",
                        "color": "greenLight2"
                      },
                      {
                        "id": "sel10",
                        "name": "Option C",
                        "color": "redLight2"
                      }
                    ]
                  },
                  "id": "fld28",
                  "name": "SingleSelect"
                },
                {
                  "type": "url",
                  "id": "fld29",
                  "name": "URL"
                },
                {
                  "type": "formula",
                  "options": {
                    "isValid": true,
                    "formula": "\\"hello\\" & {fld27}",
                    "referencedFieldIds": [
                      "fld27"
                    ],
                    "result": {
                      "type": "singleLineText"
                    }
                  },
                  "id": "fld30",
                  "name": "FormulaSingleLineText"
                },
                {
                  "type": "formula",
                  "options": {
                    "isValid": true,
                    "formula": "AND({fld12}, TRUE())",
                    "referencedFieldIds": [
                      "fld12"
                    ],
                    "result": {
                      "type": "checkbox",
                      "options": {
                        "icon": "check",
                        "color": "greenBright"
                      }
                    }
                  },
                  "id": "fld31",
                  "name": "FormulaCheckbox"
                },
                {
                  "type": "formula",
                  "options": {
                    "isValid": true,
                    "formula": "{fld21} + 5",
                    "referencedFieldIds": [
                      "fld21"
                    ],
                    "result": {
                      "type": "number",
                      "options": {
                        "precision": 0
                      }
                    }
                  },
                  "id": "fld32",
                  "name": "FormulaNumber"
                }
              ],
              "views": [
                {
                  "id": "viw2",
                  "name": "Grid view",
                  "type": "grid"
                }
              ]
            }
          ]
        }",
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
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "# Tables in base \`airtable-kit Test Base\` (app0)

        Total: **3** tables

        | Name        | ID                | Fields | Description                                                 |
        | ----------- | ----------------- | ------ | ----------------------------------------------------------- |
        | linkedItems | tbl0 | 3      | Simple table for testing record links, rollups, and lookups |
        | tasks       | tbl1 | 8      | Task tracking table                                         |
        | allTypes    | tbl2 | 22     | Table with all field types for comprehensive testing        |",
          ],
        ]
      `);
    });

    it('should list tables as json', async () => {
      await cliWithApiKey(["table", "list", "--base", baseId, "--output", "json"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "[
          {
            "id": "tbl0",
            "name": "linkedItems",
            "description": "Simple table for testing record links, rollups, and lookups",
            "primaryFieldId": "fld0",
            "fields": [
              {
                "type": "singleLineText",
                "id": "fld0",
                "name": "name",
                "description": "Item name"
              },
              {
                "type": "number",
                "options": {
                  "precision": 0
                },
                "id": "fld1",
                "name": "numberValue",
                "description": "Numeric value for rollup testing"
              },
              {
                "type": "singleLineText",
                "id": "fld2",
                "name": "singleLineTextValue",
                "description": "String value for rollup testing"
              }
            ],
            "views": [
              {
                "id": "viw0",
                "name": "Grid view",
                "type": "grid"
              }
            ]
          },
          {
            "id": "tbl1",
            "name": "tasks",
            "description": "Task tracking table",
            "primaryFieldId": "fld3",
            "fields": [
              {
                "type": "singleLineText",
                "id": "fld3",
                "name": "name",
                "description": "The name of the task"
              },
              {
                "type": "singleSelect",
                "options": {
                  "choices": [
                    {
                      "id": "sel0",
                      "name": "Todo",
                      "color": "blueLight2"
                    },
                    {
                      "id": "sel1",
                      "name": "In Progress",
                      "color": "yellowLight2"
                    },
                    {
                      "id": "sel2",
                      "name": "Done",
                      "color": "greenLight2"
                    }
                  ]
                },
                "id": "fld4",
                "name": "status",
                "description": "The current status of the task"
              },
              {
                "type": "number",
                "options": {
                  "precision": 0
                },
                "id": "fld5",
                "name": "priority",
                "description": "The priority level of the task. Lower numbers indicate higher priority."
              },
              {
                "type": "date",
                "options": {
                  "dateFormat": {
                    "name": "iso",
                    "format": "YYYY-MM-DD"
                  }
                },
                "id": "fld6",
                "name": "dueDate",
                "description": "The due date of the task"
              },
              {
                "type": "checkbox",
                "options": {
                  "icon": "check",
                  "color": "greenBright"
                },
                "id": "fld7",
                "name": "completed",
                "description": "Whether the task is completed"
              },
              {
                "type": "multilineText",
                "id": "fld8",
                "name": "notes",
                "description": "Additional notes about the task"
              },
              {
                "type": "multipleSelects",
                "options": {
                  "choices": [
                    {
                      "id": "sel3",
                      "name": "Urgent",
                      "color": "redLight2"
                    },
                    {
                      "id": "sel4",
                      "name": "Important",
                      "color": "orangeLight2"
                    }
                  ]
                },
                "id": "fld9",
                "name": "tags",
                "description": "Tags associated with the task"
              },
              {
                "type": "multipleAttachments",
                "options": {
                  "isReversed": false
                },
                "id": "fld10",
                "name": "attachments",
                "description": "Files attached to the task"
              }
            ],
            "views": [
              {
                "id": "viw1",
                "name": "Grid view",
                "type": "grid"
              }
            ]
          },
          {
            "id": "tbl2",
            "name": "allTypes",
            "description": "Table with all field types for comprehensive testing",
            "primaryFieldId": "fld11",
            "fields": [
              {
                "type": "barcode",
                "id": "fld11",
                "name": "barcode"
              },
              {
                "type": "checkbox",
                "options": {
                  "icon": "check",
                  "color": "blueBright"
                },
                "id": "fld12",
                "name": "checkbox"
              },
              {
                "type": "currency",
                "options": {
                  "precision": 2,
                  "symbol": "$"
                },
                "id": "fld13",
                "name": "currency"
              },
              {
                "type": "date",
                "options": {
                  "dateFormat": {
                    "name": "iso",
                    "format": "YYYY-MM-DD"
                  }
                },
                "id": "fld14",
                "name": "date"
              },
              {
                "type": "dateTime",
                "options": {
                  "dateFormat": {
                    "name": "iso",
                    "format": "YYYY-MM-DD"
                  },
                  "timeFormat": {
                    "name": "24hour",
                    "format": "HH:mm"
                  },
                  "timeZone": "utc"
                },
                "id": "fld15",
                "name": "dateTime"
              },
              {
                "type": "duration",
                "options": {
                  "durationFormat": "h:mm:ss"
                },
                "id": "fld16",
                "name": "duration"
              },
              {
                "type": "email",
                "id": "fld17",
                "name": "email"
              },
              {
                "type": "multilineText",
                "id": "fld18",
                "name": "multilineText"
              },
              {
                "type": "multipleAttachments",
                "options": {
                  "isReversed": false
                },
                "id": "fld19",
                "name": "multipleAttachments"
              },
              {
                "type": "multipleSelects",
                "options": {
                  "choices": [
                    {
                      "id": "sel5",
                      "name": "Tag 1",
                      "color": "blueBright"
                    },
                    {
                      "id": "sel6",
                      "name": "Tag 2",
                      "color": "greenBright"
                    },
                    {
                      "id": "sel7",
                      "name": "Tag 3",
                      "color": "orangeBright"
                    }
                  ]
                },
                "id": "fld20",
                "name": "multipleSelects"
              },
              {
                "type": "number",
                "options": {
                  "precision": 5
                },
                "id": "fld21",
                "name": "Number"
              },
              {
                "type": "percent",
                "options": {
                  "precision": 2
                },
                "id": "fld22",
                "name": "Percent"
              },
              {
                "type": "phoneNumber",
                "id": "fld23",
                "name": "PhoneNumber"
              },
              {
                "type": "rating",
                "options": {
                  "icon": "star",
                  "max": 10,
                  "color": "yellowBright"
                },
                "id": "fld24",
                "name": "Rating"
              },
              {
                "type": "richText",
                "id": "fld25",
                "name": "RichText"
              },
              {
                "type": "singleCollaborator",
                "id": "fld26",
                "name": "SingleCollaborator"
              },
              {
                "type": "singleLineText",
                "id": "fld27",
                "name": "SingleLineText"
              },
              {
                "type": "singleSelect",
                "options": {
                  "choices": [
                    {
                      "id": "sel8",
                      "name": "Option A",
                      "color": "blueLight2"
                    },
                    {
                      "id": "sel9",
                      "name": "Option B",
                      "color": "greenLight2"
                    },
                    {
                      "id": "sel10",
                      "name": "Option C",
                      "color": "redLight2"
                    }
                  ]
                },
                "id": "fld28",
                "name": "SingleSelect"
              },
              {
                "type": "url",
                "id": "fld29",
                "name": "URL"
              },
              {
                "type": "formula",
                "options": {
                  "isValid": true,
                  "formula": "\\"hello\\" & {fld27}",
                  "referencedFieldIds": [
                    "fld27"
                  ],
                  "result": {
                    "type": "singleLineText"
                  }
                },
                "id": "fld30",
                "name": "FormulaSingleLineText"
              },
              {
                "type": "formula",
                "options": {
                  "isValid": true,
                  "formula": "AND({fld12}, TRUE())",
                  "referencedFieldIds": [
                    "fld12"
                  ],
                  "result": {
                    "type": "checkbox",
                    "options": {
                      "icon": "check",
                      "color": "greenBright"
                    }
                  }
                },
                "id": "fld31",
                "name": "FormulaCheckbox"
              },
              {
                "type": "formula",
                "options": {
                  "isValid": true,
                  "formula": "{fld21} + 5",
                  "referencedFieldIds": [
                    "fld21"
                  ],
                  "result": {
                    "type": "number",
                    "options": {
                      "precision": 0
                    }
                  }
                },
                "id": "fld32",
                "name": "FormulaNumber"
              }
            ],
            "views": [
              {
                "id": "viw2",
                "name": "Grid view",
                "type": "grid"
              }
            ]
          }
        ]",
          ],
        ]
      `)
    });

    it('should get table details by id', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["table", "get", tableId, "--base", baseId]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "# Table \`linkedItems\` (tbl0)

        - **Name**: linkedItems
        - **ID**: tbl0
        - **Description**: Simple table for testing record links, rollups, and lookups
        - **Primary field**: \`name\` (fld0)

        ## Fields (3)

        | Name                | ID                | Type           | Description                      |
        | ------------------- | ----------------- | -------------- | -------------------------------- |
        | name                | fld0 | singleLineText | Item name                        |
        | numberValue         | fld1 | number         | Numeric value for rollup testing |
        | singleLineTextValue | fld2 | singleLineText | String value for rollup testing  |

        ## Views (1)

        | Name      | ID                | Type |
        | --------- | ----------------- | ---- |
        | Grid view | viw0 | grid |",
          ],
        ]
      `);
    });

    it('should get table details by name', async () => {
      const tableName = realSchema.tables[0].name;
      await cliWithApiKey(["table", "get", tableName, "--base", baseId]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "# Table \`linkedItems\` (tbl0)

        - **Name**: linkedItems
        - **ID**: tbl0
        - **Description**: Simple table for testing record links, rollups, and lookups
        - **Primary field**: \`name\` (fld0)

        ## Fields (3)

        | Name                | ID                | Type           | Description                      |
        | ------------------- | ----------------- | -------------- | -------------------------------- |
        | name                | fld0 | singleLineText | Item name                        |
        | numberValue         | fld1 | number         | Numeric value for rollup testing |
        | singleLineTextValue | fld2 | singleLineText | String value for rollup testing  |

        ## Views (1)

        | Name      | ID                | Type |
        | --------- | ----------------- | ---- |
        | Grid view | viw0 | grid |",
          ],
        ]
      `);
    });

    it('should get table details as json', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["table", "get", tableId, "--base", baseId, "--output", "json"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "{
          "id": "tbl0",
          "name": "linkedItems",
          "description": "Simple table for testing record links, rollups, and lookups",
          "primaryFieldId": "fld0",
          "fields": [
            {
              "type": "singleLineText",
              "id": "fld0",
              "name": "name",
              "description": "Item name"
            },
            {
              "type": "number",
              "options": {
                "precision": 0
              },
              "id": "fld1",
              "name": "numberValue",
              "description": "Numeric value for rollup testing"
            },
            {
              "type": "singleLineText",
              "id": "fld2",
              "name": "singleLineTextValue",
              "description": "String value for rollup testing"
            }
          ],
          "views": [
            {
              "id": "viw0",
              "name": "Grid view",
              "type": "grid"
            }
          ]
        }",
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
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "# Fields in table \`linkedItems\` (tbl0)

        - **Total: 3 fields**
        - **Primary field**: \`name\` (fld0)\`

        | Name                | ID                | Type           | Description                      |
        | ------------------- | ----------------- | -------------- | -------------------------------- |
        | name                | fld0 | singleLineText | Item name                        |
        | numberValue         | fld1 | number         | Numeric value for rollup testing |
        | singleLineTextValue | fld2 | singleLineText | String value for rollup testing  |",
          ],
        ]
      `);
    });

    it('should list fields as json', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["field", "list", "--base", baseId, "--table", tableId, "--output", "json"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "[
          {
            "type": "singleLineText",
            "id": "fld0",
            "name": "name",
            "description": "Item name"
          },
          {
            "type": "number",
            "options": {
              "precision": 0
            },
            "id": "fld1",
            "name": "numberValue",
            "description": "Numeric value for rollup testing"
          },
          {
            "type": "singleLineText",
            "id": "fld2",
            "name": "singleLineTextValue",
            "description": "String value for rollup testing"
          }
        ]",
          ],
        ]
      `);
    });

    it('should get field details by id', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldId = realSchema.tables[0].fields[2].id;
      await cliWithApiKey(["field", "get", fieldId, "--base", baseId, "--table", tableId]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "# Field \`singleLineTextValue\` (fld0)

        - **Name**: singleLineTextValue
        - **ID**: fld0
        - **Type**: singleLineText
        - **Description**: String value for rollup testing",
          ],
        ]
      `);
    });

    it('should get field details by name', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldName = realSchema.tables[0].fields[2].name;
      await cliWithApiKey(["field", "get", fieldName, "--base", baseId, "--table", tableId]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "# Field \`singleLineTextValue\` (fld0)

        - **Name**: singleLineTextValue
        - **ID**: fld0
        - **Type**: singleLineText
        - **Description**: String value for rollup testing",
          ],
        ]
      `);
    });

    it('should get field details as json', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldId = realSchema.tables[0].fields[2].id;
      await cliWithApiKey(["field", "get", fieldId, "--base", baseId, "--table", tableId, "--output", "json"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "{
          "type": "singleLineText",
          "id": "fld0",
          "name": "singleLineTextValue",
          "description": "String value for rollup testing"
        }",
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
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "** Total: 5 records **

        | ID                | name      | numberValue | singleLineTextValue |
        | ----------------- | --------- | ----------- | ------------------- |
        | rec0 | undefined | undefined   | undefined           |
        | rec1 | undefined | undefined   | undefined           |
        | rec2 | undefined | undefined   | undefined           |
        | rec3 | undefined | undefined   | undefined           |
        | rec4 | undefined | undefined   | undefined           |",
          ],
        ]
      `);
    });

    it('should list records as json', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["record", "list", "--base", baseId, "--table", tableId, "--output", "json", "--max", "5"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "[
          {
            "id": "rec0",
            "createdTime": "2026-03-03T16:46:44.000Z",
            "fields": {
              "name": "Item A",
              "numberValue": 10,
              "singleLineTextValue": "10"
            },
            "commentCount": 0
          },
          {
            "id": "rec1",
            "createdTime": "2026-03-03T16:46:44.000Z",
            "fields": {
              "name": "Item C",
              "numberValue": 30,
              "singleLineTextValue": "30"
            },
            "commentCount": 0
          },
          {
            "id": "rec2",
            "createdTime": "2026-03-03T16:46:44.000Z",
            "fields": {
              "name": "Item D",
              "numberValue": 40,
              "singleLineTextValue": "40"
            },
            "commentCount": 0
          },
          {
            "id": "rec3",
            "createdTime": "2026-03-03T16:46:44.000Z",
            "fields": {
              "name": "Item B",
              "numberValue": 20,
              "singleLineTextValue": "20"
            },
            "commentCount": 0
          },
          {
            "id": "rec4",
            "createdTime": "2026-03-03T16:46:44.000Z",
            "fields": {
              "name": "Item E",
              "numberValue": 50,
              "singleLineTextValue": "50"
            },
            "commentCount": 0
          }
        ]",
          ],
        ]
      `);
    });

    it('should list records with field filter', async () => {
      const tableId = realSchema.tables[0].id;
      const fieldName = realSchema.tables[0].fields[0].name;
      await cliWithApiKey(["record", "list", "--base", baseId, "--table", tableId, "--fields", fieldName, "--max", "5"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "** Total: 5 records **

        | ID                | name      | numberValue | singleLineTextValue |
        | ----------------- | --------- | ----------- | ------------------- |
        | rec0 | undefined | undefined   | undefined           |
        | rec1 | undefined | undefined   | undefined           |
        | rec2 | undefined | undefined   | undefined           |
        | rec3 | undefined | undefined   | undefined           |
        | rec4 | undefined | undefined   | undefined           |",
          ],
        ]
      `);
    });

    it('should list records with max limit', async () => {
      const tableId = realSchema.tables[0].id;
      await cliWithApiKey(["record", "list", "--base", baseId, "--table", tableId, "--max", "1"]);
      expect(scrubAllCalls(mockConsoleLog.mock.calls)).toMatchInlineSnapshot(`
        [
          [
            "✓ Set current base to: airtable-kit Test Base (app0)",
          ],
          [
            "** Total: 1 records **

        | ID                | name      | numberValue | singleLineTextValue |
        | ----------------- | --------- | ----------- | ------------------- |
        | rec0 | undefined | undefined   | undefined           |",
          ],
        ]
      `);
    });
  });
});
