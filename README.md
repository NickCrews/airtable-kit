# airtable-kit

A type-safe, fully-featured, and standards-centric Airtable API client for TypeScript and JavaScript. Plus a CLI!

Status: Beta. The basic shape of most functions is fairly stable.
But I will still make breaking changes, you should pin your version.

## Motivation

There are other type-safe airtable clients out there (see the [Comparison section](#comparison-to-other-airtable-libraries)),
but they all start from the premise of starting from typescript `interface`s to define the shape of records in each table.
This package takes a different approach: everything is derived directly from the
Airtable Base's JSON schema, as directly provided by the [Airtable API](https://airtable.com/developers/web/api/get-base-schema). We then provide some typescript generic magic so that we infer that e.g.
a `singleSelect` field with options "To Do", "In Progress", and "Done" maps to the union type `"To Do" | "In Progress" | "Done"` in typescript.

This has several advantages:
- It is trivial to codegen the schema files from existing bases since you pretty much write the JSON directly to a file, instead of needing to translate it to typescript interfaces. This makes it easy to create/update base schemas.
- You get runtime validation and JSONschema (eg for API docs/MCP servers/etc) for free. Most of these other libraries assume you know at compile time which bases you are working with. This package allows you to fetch a base's schema just-in-time at runtime, and still have type-mapping and runtime validation.
- Since we preserve the full JSON schema, you can inspect and manipulate the base's schema at runtime, eg generate a Zod validator. This is useful for e.g. building MCP tools for AI agents, since now they can see the exact schema of the base they are working with.

## Other Features

- **Rename-Resistant**: When someone modifies the name of a field in airtable, your code won't break because the client always sends field IDs to the API under the hood.
- **Complete Type-Safety**: Not just the basics. Eg get type safety on the valid options for single-select and multi-select fields, date formats, etc.
- **More-sane read behavior**: The Airtable API (and vanilla [airtable.js](https://github.com/airtable/airtable.js/)) don't include "falsy" values when reading records. We fill in those missing values with sane defaults, eg the empty string for text-like fields, empty arrays for multi-value fields, or an explicit `null` for eg number and date fields.
- **Typesafe Formula Builder**: Build Airtable formulas programmatically with full type-safety and autocompletion, eg 
  `formulaToString(tableSchema, ["<=", { field: "Due Date" }, ["DATEADD", ["TODAY"], 7, "days"]])`
  yields
  `{fld123xyz} <= DATEADD(TODAY(), 7, "days")`.
- **Two Layers**: The Airtable client, `createAirtable()`, maps 1:1 to the Airtable REST API. Typed clients from `airtable-kit/typed`, with methods like `base.tables.myTable.createRecords(records)`, are built on top of it. See [Concepts](#concepts).
- **Bring Your Own `fetch`**: Pass any `fetch`-shaped function for retries, logging, proxies, or mocking in tests.
- **Zero-Dependencies**: No required dependencies! `zod` is optional if you want runtime validation (eg for MCP tools).
- **Portable**: Works in Node.js, Deno, and the browser, including in sandboxed environments, e.g. where `process.env` and `os.homedir()` are not available.
- **Runtime Validation**: Optionally, dynamically generate Zod validators from the schema to validate all data sent to Airtable at runtime.
- **MCP Tools**: Ready-to-use MCP tools for LLM integration.

## Installation

This is [available on npm](https://www.npmjs.com/package/airtable-kit):

```bash
pnpm add airtable-kit
```

## Concepts

- **The Airtable client**, from `createAirtable()` in `airtable-kit`, calls the Airtable REST API:
  `airtable.bases`, `airtable.tables`, `airtable.fields`, and `airtable.records`.
  It handles authentication, pagination, and batching, and does not need a schema.
- **Typed clients**, `BaseClient` and `TableClient` from `airtable-kit/typed`, wrap an Airtable client
  with a base or table schema. They convert field values using the schema and type them precisely.
- **Raw records** (`RawRecord`) are records as Airtable sends them: empty fields are omitted,
  and values are plain JSON. The Airtable client reads and writes raw records.
- **Typed records** (`TypedRecord`) are records converted using the schema: keyed by field name,
  with empty fields filled in (eg `false`, `[]`, or `null`). Typed clients read and write typed records.

## Quick Start

### Use Case 1: The Airtable Client

The Airtable client reads and writes raw records, so it needs no schema.

```typescript
import { createAirtable } from 'airtable-kit';

// Reads the API key from the AIRTABLE_API_KEY environment variable
const airtable = createAirtable();
// Or pass an API key or OAuth access token
// const airtable = createAirtable({ apiKey: 'YOUR_API_KEY' });
// Or a function returning one, called before every request, eg to refresh an OAuth token
// const airtable = createAirtable({ apiKey: async () => getAccessToken() });
// Or your own fetch, eg to add retries or logging (see Configuration)
// const airtable = createAirtable({ fetch: myFetch });

await airtable.fields.create({
  baseId: 'appZZZZZZZZZZZZZZ',
  tableId: 'tblAAAAAAAAAAAAAA',
  field: { name: 'newField', type: 'singleLineText' },
});

await airtable.records.update({
  baseId: 'appZZZZZZZZZZZZZZ',
  tableId: 'tblAAAAAAAAAAAAAA',
  records: [{ id: 'recXXXXXXXXXXXXXX', fields: { fldYYYYYYYYYYYYYY: 47 } }],
});

const records = await airtable.records.list({
  baseId: 'appZZZZZZZZZZZZZZ',
  tableId: 'tblAAAAAAAAAAAAAA',
  filterByFormula: '{Done} = FALSE()',
});
// raw records: records[0].fields is Record<string, unknown>, and empty fields are omitted
```

The available methods are:

- `airtable.bases`: `list`, `get` (the full schema), `create`
- `airtable.tables`: `create`, `update`
- `airtable.fields`: `create`, `update`
- `airtable.records`: `list`, `iterate`, `listPage`, `get`, `create`, `update`, `delete`, `uploadAttachment`
- `airtable.request`: any other endpoint, with the client's credentials

### Use Case 2: Statically Typed Client for a Known Base

**Option A: Use the Web App (No Installation Required)**

Visit [https://nickcrews.github.io/airtable-kit/](https://nickcrews.github.io/airtable-kit/) to generate schema files directly in your browser. Just enter your API key, select a base, and copy/download the generated code.

**Option B: Use the CLI**

Run the codegen CLI to fetch and save all your base schemas to local files:

```bash
npx airtable-kit codegen all --api-key YOUR_API_KEY
```

This will fetch all the bases that the API key has access for, and create files under `./schemas/`, one per base.
(If you instead wanted to just generate a single base schema, see `npx airtable-kit codegen base --help`.)
Here is an example generated schema file for a base called `Project Tracker`, saved as `schemas/projectTracker.ts`:

```typescript
export default {
  "id": "appXXXXXXXXXXXXXX",
  "name": "projectTracker",
  "tables": [
    {
      "id": "tblXXXXXXXXXXXXXX",
      "name": "tasks",
      "primaryFieldId": "fldXXXXXXXXXXXXXX",
      "fields": [
        {
          "id": "fldXXXXXXXXXXXXXX",
          "name": "name",
          "type": "singleLineText",
        },
        {
          "id": "fldYYYYYYYYYYYYYY",
          "name": "status",
          "type": "singleSelect",
          "options": {
            "choices": [
              { "id": "selAAAAAAAAAAAAAA", "name": "To Do", "color": "red" },
              { "id": "selBBBBBBBBBBBBBB", "name": "In Progress", "color": "blue" },
              { "id": "selCCCCCCCCCCCCCC", "name": "Done", "color": "green" }
            ]
          }
        },
        {
          "id": "fldZZZZZZZZZZZZZZ",
          "name": "dueDate",
          "type": "date",
          "options": {
            "dateFormat": "iso",
            "timeFormat": "24hour",
            "timeZone": "client"
          }
        },
      ]
    }
  ]
} as const;
```

Note how this is almost a direct 1:1 correspondence with the raw JSON from the
`GET https://api.airtable.com/v0/meta/bases/{baseId}/tables` endpoint.
There are a few minor differences, such as table and field names are converted
to camelCase for easier consumption in javascript/TypeScript,
and we add the top-level `id: "appXXXXXXXXXXXXXX"` and `name: "projectTracker"` fields,
which aren't present in the raw JSON.

If you dropped the `as const` you would have a plain javascript file if you
are working with javascript. You can get the CLI to do this with the `--format js` flag.

Now, use the generated schema to create a type-safe Airtable client:

```typescript
import { createBaseClient } from 'airtable-kit/typed';
import projectTrackerSchema from './schemas/projectTracker.ts';

// `airtable` from createAirtable(), see Use Case 1
const client = createBaseClient(projectTrackerSchema, { airtable });
// if you tried `client.tables.nonExistentTable` you would get a type error here
client.tables.tasks.createRecords([
  {
    // You can use either the field IDs or names as keys
    fldXXXXXXXXXXXXXX: "Finish report",
    status: "In Progress",
    // This would give a type error because its not a valid select option
    // status: "in progress",
    // You can either provide a Date object or an ISO string
    dueDate: new Date("2024-12-31"), // or "2024-12-31" works too
    // This would give a type error because 42 is not a valid date
    // dueDate: 42
    // This would give a type error because dueBy is not a field
    // dueBy: "2024-12-31"
  },
]);
const tasks = await client.tables.tasks.listRecords({
  // You can build formulas programmatically with type-safety
  // All tasks due in the next 7 days that are not done.
  // This is compiled to the string:
  // AND(
  //   {fldZZZZZZZZZZZZZZ} >= TODAY(),
  //   {fldZZZZZZZZZZZZZZ} <= DATEADD(TODAY(), 7, "days"),
  //   OR(
  //     {fldYYYYYYYYYYYYYY} = "To Do",
  //     {fldYYYYYYYYYYYYYY} = "In Progress"
  //   )
  // )
  filterByFormula: [
    "AND",
    [">=", { field: "dueDate" }, ["TODAY"]],
    ["<=", { field: "dueDate" }, ["DATEADD", ["TODAY"], 7, "days"]],
    ["OR",
      ["=", { field: "status" }, "To Do"],
      ["=", { field: "status" }, "In Progress"],
    ],
  ],
});
console.log(tasks);
```

A typed table client has these methods:

- Records: `listRecords`, `iterateRecords`, `listRecordsPage`, `getRecord`,
  `createRecords`, `createRecord`, `updateRecords`, `updateRecord`, `deleteRecords`, `deleteRecord`,
  `uploadAttachment`
- Schema: `createField`, `updateField`, `updateTable`
- `formulaToString`, to build a formula for this table

`iterateRecords` fetches one page at a time as you go, for tables too large to hold in memory:

```typescript
for await (const task of client.tables.tasks.iterateRecords({ fields: ['name'] })) {
  console.log(task.fields.name);
}
```

`uploadAttachment` takes a `File`, a `Blob`, bytes, or a base64 string:

```typescript
await client.tables.tasks.uploadAttachment({ recordId: 'recXXXXXXXXXXXXXX', field: 'attachments', file });
```

To work with several bases, share one `Airtable` client,
so that every base uses the same credentials and `fetch`:

```typescript
import { createBaseClient } from 'airtable-kit/typed';
import projectTrackerSchema from './schemas/projectTracker.ts';
import otherBaseSchema from './schemas/otherBase.ts';

const projectTracker = createBaseClient(projectTrackerSchema, { airtable });
const otherBase = createBaseClient(otherBaseSchema, { airtable });
otherBase.tables.someTable.createRecords([ ... ]);
```

Without a generated schema, you can still get typed records for a few fields
by describing just those fields in a typed table client.
Each field needs its `id`, `name`, and `type`. Only select fields need `options` (their `choices`),
and formula, rollup, and lookup fields need `options.result`:

```typescript
import { createTableClient } from 'airtable-kit/typed';

// `airtable` from createAirtable(), see Use Case 1
const tasks = createTableClient({
  id: 'tblAAAAAAAAAAAAAA',
  fields: [
    { id: 'fldDue', name: 'dueDate', type: 'date' },
    { id: 'fldDone', name: 'done', type: 'checkbox' },
  ],
} as const, { baseId: 'appZZZZZZZZZZZZZZ', airtable });

await tasks.updateRecord({ id: 'recXXXXXXXXXXXXXX', fields: { dueDate: new Date(), done: true } });
const [record] = await tasks.listRecords({ fields: ['dueDate', 'done'] });
record.fields.done; // boolean
```

### Use Case 3: The CLI

We ship a CLI in the style of `gh`, for performing verbs such as `list`, `get`, `create`, and `update`
on each of the Airtable nouns `base`, `table`, `field`, and `record`.
Try it with no installation using `npx airtable-kit`:

```bash
# Reads the API key from AIRTABLE_API_KEY, or a .env file. Or pass --api-key.
npx airtable-kit base list
# # Bases (2)
#
# | Name            | ID                | Tables |
# | --------------- | ----------------- | ------ |
# | Project Tracker | appQ5r6S7t8U9v0W1 | 2      |
# | CRM             | appX2y3Z4a5B6c7D8 | 1      |

npx airtable-kit base use "Project Tracker"
# ✓ Set current base to: Project Tracker (appQ5r6S7t8U9v0W1)

npx airtable-kit table list
# # Tables in base `Project Tracker` (appQ5r6S7t8U9v0W1)
#
# Total: **2** tables
#
# | Name   | ID                | Fields | Description  |
# | ------ | ----------------- | ------ | ------------ |
# | tasks  | tblE9f0G1h2I3j4K5 | 3      | Things to do |
# | people | tblL6m7N8o9P0q1R2 | 1      |              |

npx airtable-kit table use tasks
# ✓ Set current table to: tasks (tblE9f0G1h2I3j4K5) in Project Tracker

npx airtable-kit record list --filter '{status} = "To Do"' --sort dueDate:asc --max 10
# ** Total: 2 records **
#
# | ID                | name          | status | dueDate    |
# | ----------------- | ------------- | ------ | ---------- |
# | recA1b2C3d4E5f6G7 | Write report  | To Do  | 2026-11-20 |
# | recH8i9J0k1L2m3N4 | Review budget | To Do  | 2026-11-24 |

npx airtable-kit record list --fields name,status --format json
# [
#   {
#     "id": "recA1b2C3d4E5f6G7",
#     "createdTime": "2026-11-01T09:00:00.000Z",
#     "fields": {
#       "name": "Write report",
#       "status": "To Do"
#     }
#   },
#   ...
# ]

npx airtable-kit record update recA1b2C3d4E5f6G7 --data '{"fields": {"status": "Done"}}'
# # Record recA1b2C3d4E5f6G7
#
# | Field   | Value             |
# | ------- | ----------------- |
# | ID      | recA1b2C3d4E5f6G7 |
# | name    | Write report      |
# | status  | Done              |
# | dueDate | 2026-11-20        |
#
# ✅ Updated record: recA1b2C3d4E5f6G7

npx airtable-kit record create --data '{"fields": {"name": "Plan offsite", "status": "To Do"}}'
# ** Total: 1 records **
#
# | ID                | name         | status | dueDate |
# | ----------------- | ------------ | ------ | ------- |
# | recZ1a2B3c4D5e6F7 | Plan offsite | To Do  | (empty) |
#
# ✅ Created 1 record(s)

npx airtable-kit field create notes --type multilineText --description "Anything else to know"
# # Field `notes` (fldS3t4U5v6W7x8Y9)
#
# - **Name**: notes
# - **ID**: fldS3t4U5v6W7x8Y9
# - **Type**: multilineText
# - **Description**: Anything else to know
#
# ✅ Field created: notes (fldS3t4U5v6W7x8Y9)

npx airtable-kit codegen --outdir schemas
# 🔍 Fetching all base schemas...
# ✓ Found 2 bases
#   • Generated schemas/projectTracker.generated.ts
#   • Generated schemas/crm.generated.ts
#
# ✅ Generated 2 schema file(s) in schemas
```

Run `npx airtable-kit <command> --help` for every command and option.

### Use Case 4: Dynamic Client for Unknown Bases, eg an MCP Tool

```typescript
import { createBaseClient } from 'airtable-kit/typed';
import { makeListTool } from 'airtable-kit/mcp';

// `airtable` from createAirtable(), see Use Case 1
const client = createBaseClient(await airtable.bases.get('appXXXXXXXXXXXXXX'), { airtable });
const listTool = makeListTool(client.tables.tasks);

// Now you can pass this off to an AI agent framework, eg Vercel's AI SDK (https://github.com/vercel/ai)
import { tool, ToolLoopAgent } from 'ai'
const agent = new ToolLoopAgent({
  model: 'openai/gpt-5-codex',
  system: 'Help the user find info in their Airtable base.',
  tools: {
    listRecords: tool({
      description: listTool.description,
      inputSchema: listTool.zodInputValidator,
      execute: listTool.execute,
    })
  },
});
```

### Use Case 5: Generate an OpenAPI Spec

Generate an [OpenAPI 3](https://www.openapis.org/) document describing the
Airtable REST API for one of your bases (record CRUD, comments, attachments,
webhooks, and base/table metadata):

```bash
AIRTABLE_API_KEY=... npx airtable-kit openapi <baseId>   # prints JSON to stdout
npx airtable-kit openapi <baseId> --out airtable.json    # or write to a file
```

Or programmatically, for full control over which surfaces are included:

```typescript
import { baseToOpenApi } from 'airtable-kit/openapi';

// `airtable` from createAirtable(), see Use Case 1
const base = await airtable.bases.get('appXXXXXXXXXXXXXX');
const spec = baseToOpenApi(base, {
  title: 'My API',
  include: { records: true, webhooks: false }, // every surface defaults to true
});
console.log(JSON.stringify(spec, null, 2));
```

## Configuration

`createAirtable` takes:

- `apiKey`: an API key or OAuth access token, or a function returning one,
  which is called before every request (eg to refresh an OAuth token).
  Defaults to the `AIRTABLE_API_KEY` environment variable, read before every request,
  so a client can be created before the variable is set.
- `fetch`: any function with the shape `(url: string, init: RequestInit) => Promise<Response>`.
  Defaults to `globalThis.fetch`, throttled to Airtable's limit of 5 requests per second per base,
  and retried on rate limits (HTTP 429) and transient errors.
  A custom `fetch` is used as given, without throttling or retries; wrap it with
  `withThrottle` and `withRetry` to keep them.
  If you pass a custom `fetch` and no API key is found,
  requests are sent without an `Authorization` header, so your `fetch` can add its own.
- `baseUrl`: defaults to `https://api.airtable.com/v0`.
- `contentBaseUrl`: the base URL for attachment uploads. Defaults to `baseUrl` if given,
  otherwise `https://content.airtable.com/v0`.

The typed clients take an `airtable` option, which is either an `Airtable`
client or these options. If you omit it, `createAirtable()` is used.

To add logging to a custom `fetch`, while keeping the default throttling and retries:

```typescript
import { createAirtable, withRetry, withThrottle } from 'airtable-kit';

const loggingFetch = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  console.log(init.method, url, response.status);
  return response;
};
const airtable = createAirtable({
  fetch: withRetry(withThrottle(loggingFetch), {
    onRetry: ({ attempt, delayMs }) => console.log(`retry ${attempt} in ${delayMs}ms`),
  }),
});
```

Failed requests throw an `AirtableKitApiError` (from `airtable-kit/exceptions`)
with the HTTP `status` and the parsed response body as `rawResponse`.

For tests, `createMockFetch()` returns a `fetch` that responds with a fixed JSON body and records each request:

```typescript
import { createAirtable, createMockFetch } from 'airtable-kit';

const fetch = createMockFetch();
fetch.setReturnValue({ records: [] });
const airtable = createAirtable({ fetch });
await airtable.records.list({ baseId: 'appX', tableId: 'tblX' });
fetch.getCallHistory(); // [{ url: 'https://api.airtable.com/v0/appX/tblX', method: 'GET', data: undefined }]
```

## Comparison to Other Airtable Libraries

### [airtable-ts](https://github.com/domdomegg/airtable-ts)
I was using this before building this library, and it is a great library.
- Also type-safe
- Derives types from typescript `interface`s instead of the raw base schema.
  This loses some type-safety, eg for supplying valid select options.
  This is how most typescript airtable libraries work.
  There is a separate `airtable-ts-codegen` package to generate these interfaces.
- Requires doing [two fetches](https://github.com/domdomegg/airtable-ts/blob/c1963b522cf0f955068bdfaaaa79c6c28bcb2f3a/src/AirtableTs.ts#L37-L38) for all operations:
  one to get the tables schema so that it can map field types and names,
  and another to do the actual operation (eg insert records).
  This package, since it operates directly from the base schema, therefore
  only needs to do one fetch per operation after the initial schema fetch.
- You can only work with bases known at compile-time, you can't dynamically
  fetch a base schema at runtime and make a client for it.
- No zod schema generation for JSONschema generation.

### [airtable-mcp-server](https://github.com/domdomegg/airtable-mcp-server)
- Single purpose MCP server.
- Does not expose an API for building your own MCP tools or agents, where this package does.
- Does support working with unknown bases at runtime, similar to this package.
  But this package allows for generating a set of MCP tools per base,
  whereas that package only provides a single `insertRecords` tool that works
  with any base.
  This means that we can provide a specific-to-that-base JSON schema for the LLM
  to work with, which (I think, but not tested) improves reliability.

## License

MIT

## Contributing

I don't want this project to feature-creep too much, so at first I will be hesitant
on accepting new features. At least file an issue before starting work.
But bug reports, documentation improvements,
and performance improvements are always welcome!
