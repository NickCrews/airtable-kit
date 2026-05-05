import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // Need this to resolve airtable-kit/* imports straight from the source.
    // Without it, the imports still work AS LONG AS YOU RAN `pnpm run build` first,
    // but then the tests run against the built code instead of the source,
    // so as you make changes to the source files, the tests are pulling from the stale version.
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'node',
    // Vitest's default behavior is to run each test file in parallel.
    // But our tests all share the same real Airtable test base.
    // So they clobber each other, with one test deleting records as another is reading them, etc.
    fileParallelism: false,
  },
});
