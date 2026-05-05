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
  },
});
