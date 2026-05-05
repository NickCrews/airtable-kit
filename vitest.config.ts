import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Need these to resolve straight from the source. Without these,
      // the imports still work AS LONG AS YOU RAN `pnpm run build` first,
      // but then the tests run against the built code instead of the source,
      // so as you make changes to the source files, the tests are pulling from the stale version.
      'airtable-kit/fetcher': resolve(__dirname, 'src/fetcher.ts'),
      'airtable-kit/bases': resolve(__dirname, 'src/bases/index.ts'),
      'airtable-kit/tables': resolve(__dirname, 'src/tables/index.ts'),
      'airtable-kit/fields': resolve(__dirname, 'src/fields/index.ts'),
      'airtable-kit/records': resolve(__dirname, 'src/records/index.ts'),
      'airtable-kit/mcp': resolve(__dirname, 'src/mcp/index.ts'),
      'airtable-kit/codegen': resolve(__dirname, 'src/codegen/index.ts'),
      'airtable-kit/formula': resolve(__dirname, 'src/formula/index.ts'),
      'airtable-kit/exceptions': resolve(__dirname, 'src/exceptions.ts'),
      'airtable-kit/validators': resolve(__dirname, 'src/validators/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
