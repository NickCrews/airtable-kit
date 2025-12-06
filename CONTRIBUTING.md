# Contributing to airtable-kit

Thank you for your interest in contributing to airtable-kit! This guide will help you set up your development environment and run tests.

## Prerequisites

- Node.js >= 20
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
   export AIRTABLE_KIT_TEST_API_KEY=patXXXXXXXXXXXXXX

   # The workspace ID where the test base will be created
   export AIRTABLE_WORKSPACE_ID=wspXXXXXXXXXXXXXX

   # This will be set by the setup script
   export AIRTABLE_TEST_BASE_ID=appXXXXXXXXXXXXXX
   ```

   **How to get these values:**

   - **API Key**: Go to [Airtable Account Settings](https://airtable.com/account) → "Developer" section → Create a personal access token
   - **Workspace ID**: Open your Airtable workspace → Click on your workspace name → "Workspace settings" → The ID is in the URL (`wsp...`)

## Setting Up the Test Base

The test suite uses a real Airtable base for integration tests. You need to create this test base once before running tests:

```bash
pnpm run create-test-base
```

This script will:
1. Create a new test base in your specified workspace via the Airtable Meta API
2. Create 4 tables: `Tasks`, `Users`, `LinkedItems`, and `AllTypes`
3. Populate the tables with seed data
4. Generate a TypeScript schema file at `src/tests/test-base-schema.generated.ts`
5. Output the base ID that you need to add to your environment variables

After running the setup script, **add the generated base ID to your environment**:

```bash
export AIRTABLE_TEST_BASE_ID=appXXXXXXXXXXXXXX
```

Or add it to your `.env` file.

### Test Base Structure

The test base contains:

- **Tasks**: Task tracking with status, priority, due dates, and assignments
- **Users**: User records with name, email, and phone
- **LinkedItems**: Simple table for testing record links, rollups, and lookups
- **AllTypes**: Comprehensive table with all 33 Airtable field types

## Running Tests

Once the test base is set up, you can run the test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/client/table-client.test.ts
```

### Test Isolation

- Tests use real API calls to the test base
- Each test suite resets the base data to seed state using `resetBaseData()`
- Tests can create additional records during execution
- The test base persists between test runs (it's not deleted)

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
- If you need to recreate the test base (e.g., after schema changes), manually delete the old base in Airtable and run `pnpm run create-test-base` again
- You can view your test base in Airtable at: `https://airtable.com/[YOUR_BASE_ID]`

### Rate Limits

- Airtable has API rate limits (5 requests per second per base)
- Tests may be slower than mock-based tests due to real API calls
- If you hit rate limits, tests will fail with a 429 error

### Sensitive Data

- Never commit your `.env` file or any files containing API keys
- The generated schema file (`src/tests/test-base-schema.generated.ts`) is gitignored
- Test data should not contain real personal information

## Testing Best Practices

When writing new tests:

1. **Use the test utilities**: Import `testBaseClient()` from `src/tests/test-utils.ts`
2. **Reset data when needed**: Call `await resetBaseData()` in `beforeEach` for test isolation
3. **Focus on outcomes**: Test the returned data and side effects, not API call details
4. **Use real data**: Create records in tests rather than mocking API responses
5. **Clean assertions**: Use `toMatchObject()` for partial matches, check specific fields

Example test structure:

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { testBaseClient } from "../tests/test-utils.ts";

describe("My Feature", () => {
  let tasksTableClient: Awaited<ReturnType<typeof testBaseClient>>["tasksTableClient"];
  let resetBaseData: Awaited<ReturnType<typeof testBaseClient>>["resetBaseData"];

  beforeEach(async () => {
    const testClient = await testBaseClient();
    tasksTableClient = testClient.tasksTableClient;
    resetBaseData = testClient.resetBaseData;
    await resetBaseData(); // Optional: only if test isolation is needed
  });

  it("should do something", async () => {
    const result = await tasksTableClient.createMany([...]);
    expect(result).toMatchObject([...]);
  });
});
```

## Troubleshooting

### "AIRTABLE_TEST_BASE_ID environment variable not set"

Run `pnpm run create-test-base` to create the test base and get the base ID.

### "AIRTABLE_API_KEY environment variable not set"

Set your Airtable personal access token in your environment or `.env` file.

### Tests are failing with 401 Unauthorized

Check that your API key is valid and has the necessary permissions (read/write access to the workspace).

### Tests are failing with 404 Not Found

The test base may have been deleted. Delete the `AIRTABLE_TEST_BASE_ID` from your environment and run `pnpm run create-test-base` again.

### "Required tables not found in schema"

The generated schema file may be out of sync. Delete `src/tests/test-base-schema.generated.ts` and run `pnpm run create-test-base` again.

## Questions or Issues?

If you encounter any problems or have questions:

- Check existing [GitHub Issues](https://github.com/NickCrews/airtable-kit/issues)
- Open a new issue with a clear description of the problem
- Include error messages and relevant environment details

Thank you for contributing to airtable-kit!
