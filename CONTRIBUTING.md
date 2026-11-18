# Contributing to airtable-kit

Thank you for your interest in contributing to airtable-kit! This guide will help you set up your development environment and run tests.

## Prerequisites

- Node.js >= 22
- pnpm package manager
- An Airtable account with API access
- A personal access token (PAT) from Airtable

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/NickCrews/airtable-kit.git
   cd airtable-kit
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory (or export these variables in your shell):

   ```bash
   # Your Airtable personal access token
   AIRTABLE_KIT_TEST_API_KEY=patXXXXXXXXXXXXXX

   # The workspace the test base lives in
   AIRTABLE_KIT_TEST_WORKSPACE_ID=wspXXXXXXXXXXXXXX

   # The test base. See "Setting Up the Test Base" below.
   AIRTABLE_KIT_TEST_BASE_ID=appXXXXXXXXXXXXXX
   ```

   **How to get these values:**

   - **API Key**: Go to [Airtable Account Settings](https://airtable.com/account) → "Developer" section → Create a personal access token
   - **Workspace ID**: Open your Airtable workspace → Click on your workspace name → "Workspace settings" → The ID is in the URL (`wsp...`)

## Setting Up the Test Base

The integration tests run against a real Airtable base. Before running them, run:

```bash
pnpm run ensure-test-base
```

This script:
1. Uses the base in `AIRTABLE_KIT_TEST_BASE_ID`, or creates one in your workspace if it isn't set and there is no generated schema yet
2. Creates any missing tables and fields from the schema in `src/tests/test-base.ts`
3. Writes the base's schema to `src/tests/test-base-schema.generated.ts` (gitignored), which the tests import

If it created a new base, put that base's ID in `AIRTABLE_KIT_TEST_BASE_ID`.
Run it again whenever the schema in `src/tests/test-base.ts` changes.

The base has three tables:

- **tasks**: Task tracking with status, priority, due dates, tags, and attachments
- **linkedItems**: Simple table for testing record links, rollups, and lookups
- **allTypes**: A field of every writable type

The seed data that tests start from is in `src/tests/seed-data.ts`.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test tests/table-client.test.ts
```

Tests that don't use the test base run without any environment variables.
All test files share one base, so they run one at a time (see `vitest.config.ts`).

## Development Workflow

1. **Make your changes**

   Edit source files in the `src/` directory.

2. **Run tests**

   Ensure all tests pass:
   ```bash
   pnpm test
   ```

3. **Build the project**

   ```bash
   pnpm run build
   ```

4. **Commit your changes**

   Follow conventional commit message format:
   - `feat: add new feature`
   - `fix: bug fix`
   - `docs: documentation changes`
   - `test: add or update tests`
   - `refactor: code refactoring`

## Important Notes

### Test Base Persistence

- The test base is **not automatically deleted**
- After changing the schema in `src/tests/test-base.ts`, run `pnpm run ensure-test-base` to update the base
- You can view your test base in Airtable at: `https://airtable.com/[YOUR_BASE_ID]`

### Rate Limits

- Airtable has API rate limits (5 requests per second per base)
- Tests may be slower than mock-based tests due to real API calls
- The client throttles requests and retries on 429 responses

### Sensitive Data

- Never commit your `.env` file or any files containing API keys
- The generated schema file (`src/tests/test-base-schema.generated.ts`) is gitignored
- Test data should not contain real personal information

## Writing Tests

Import `test` (or its alias `it`) from `src/tests/fixtures.ts` instead of from vitest,
and destructure the fixtures a test needs:

| Fixture     | Value                                                                         |
| ----------- | ----------------------------------------------------------------------------- |
| `base`      | The test base, with every table holding exactly the seed data                 |
| `emptyBase` | The test base, with every table empty                                         |
| `airtable`  | An `Airtable` client using the test API key                                   |
| `env`       | The test environment variables                                                |
| `tmpDir`    | A fresh directory that is the cwd for the test, left on disk for inspection   |

`base` and `emptyBase` are typed `BaseClient`s for the test base, plus two methods:
`reset()` returns it to the seed data, and `clear()` empties every table.
Call them mid-test when a test needs to start over.

A fixture is set up only for tests that destructure it, so a test that doesn't use
`base` or `emptyBase` makes no requests. For tests that only need the schema,
use `offlineTestBase` from `src/tests/test-utils.ts`.

```typescript
import { describe, expect } from "vitest";
import { test } from "../src/tests/fixtures.ts";
import { offlineTestBase } from "../src/tests/test-utils.ts";

describe("My Feature", () => {
  test("reads the schema", () => {
    expect(offlineTestBase.tables.tasks.fields.dueDate.type).toBe("date");
  });

  test("reads the seed data", async ({ base }) => {
    const records = await base.tables.tasks.listRecords();
    expect(records).toHaveLength(8);
  });

  test("starts from nothing", async ({ emptyBase }) => {
    await emptyBase.tables.tasks.createRecords([{ name: "Only task" }]);
    expect(await emptyBase.tables.tasks.listRecords()).toHaveLength(1);
  });
});
```

To give every test in a file the same starting point under a shorter name,
extend `test` with a fixture built on `base` or `emptyBase`:

```typescript
import { test as baseTest } from "../src/tests/fixtures.ts";
import { type TestBase } from "../src/tests/test-utils.ts";

const test = baseTest.extend<{ tasks: TestBase["tables"]["tasks"] }>({
  tasks: async ({ base }, use) => {
    await use(base.tables.tasks);
  },
});

test("lists tasks", async ({ tasks }) => {
  expect(await tasks.listRecords()).toHaveLength(8);
});
```

Other guidelines:

1. **Focus on outcomes**: Test the returned data and side effects, not API call details
2. **Use real data**: Create records in tests rather than mocking API responses
3. **Clean assertions**: Use `toMatchObject()` for partial matches, check specific fields

## Troubleshooting

### "Missing required environment variables"

Set `AIRTABLE_KIT_TEST_API_KEY`, `AIRTABLE_KIT_TEST_BASE_ID`, and `AIRTABLE_KIT_TEST_WORKSPACE_ID` in your environment or `.env` file.

### Tests are failing with 401 Unauthorized

Check that your API key is valid and has the necessary permissions (read/write access to the workspace).

### Tests are failing with 404 Not Found

The test base may have been deleted. Unset `AIRTABLE_KIT_TEST_BASE_ID`, delete `src/tests/test-base-schema.generated.ts`, and run `pnpm run ensure-test-base` to create a new one.

### Type errors or missing fields in the generated schema

Run `pnpm run ensure-test-base` to bring the base and `src/tests/test-base-schema.generated.ts` up to date.

## Questions or Issues?

If you encounter any problems or have questions:

- Check existing [GitHub Issues](https://github.com/NickCrews/airtable-kit/issues)
- Open a new issue with a clear description of the problem
- Include error messages and relevant environment details

Thank you for contributing to airtable-kit!
