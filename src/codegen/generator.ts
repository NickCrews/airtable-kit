/**
 * Code generator - generate static TypeScript code from Airtable schema
 */

import { promises as fs } from "node:fs";
import type { BaseId, BaseSchema } from "../schema/bases.js";

export interface CodegenOptions {
  baseId: BaseId;
  baseName: string;
}

export interface CodeGenerator {
  generateSchema(schema: BaseSchema): string;
  writeToFile(code: string, filePath: string): Promise<void>;
  formatCode(code: string): Promise<string>;
}

export function createCodeGenerator(options?: CodegenOptions): CodeGenerator {
  const opts = {
    variableName: "baseSchema",
    ...options,
  };

  function generateSchema(schema: BaseSchema): string {
    return `/**
 * Auto-generated from Airtable schema
 * Do not edit manually
 */

export default ${JSON.stringify(schema, null, 2)} as const;
`;
  }

  async function writeToFile(code: string, filePath: string): Promise<void> {
    const formatted = await formatCode(code);
    await fs.writeFile(filePath, formatted, "utf-8");
  }

  async function formatCode(code: string): Promise<string> {
    // Try to use prettier if available, otherwise return as-is
    try {
      const prettier = (await import("prettier" as string).catch(() =>
        null
      )) as any;
      if (prettier && prettier.format) {
        return await prettier.format(code, {
          parser: "typescript",
          singleQuote: true,
          trailingComma: "es5",
          printWidth: 100,
        });
      }
    } catch {
      // Prettier not available or error, continue
    }

    return code;
  }

  return {
    generateSchema,
    writeToFile,
    formatCode,
  };
}
