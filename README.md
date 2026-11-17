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

## CLI Usage

We ship a CLI in the style of `gh`, for performing verbs such as `list`, `get`, `create`, and `update`
on each of the airtable nouns of `base`, `table`, `field`, and `record`.

Try it with no installation by `npx airtable-kit --help`, which gives:

```
Usage: airtable-kit [options] [command]

A better TypeScript Airtable toolkit

Options:
  --version          output the version number
  --api-key <key>    Airtable API key
  -h, --help         display help for command

Commands:
  base               Manage Airtable bases
  table              Manage Airtable tables
  field              Manage Airtable fields
  record             Manage Airtable records
  openapi [options]  Generate an OpenAPI 3 spec for a base.
  codegen [options]  Generate ts/js schema files for all bases. Shortcut for running "base codegen <baseId>" command with all bases sequentially.
```

### Generate an OpenAPI spec

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
import { createAirtable } from 'airtable-kit';

const base = await createAirtable().bases.get('appXXXXXXXXXXXXXX');
const spec = baseToOpenApi(base, {
  title: 'My API',
  include: { records: true, webhooks: false }, // every surface defaults to true
});
console.log(JSON.stringify(spec, null, 2));
```

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

### Use Case 1: Statically Typed Client for a Known Base

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

// Uses the AIRTABLE_API_KEY environment variable,
// or pass options: createBaseClient(projectTrackerSchema, { apiKey: 'YOUR_API_KEY' })
const client = createBaseClient(projectTrackerSchema);
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

To work with several bases, create one `Airtable` client and share it,
so that every base uses the same credentials and `fetch`:

```typescript
import { createAirtable } from 'airtable-kit';
import { createBaseClient } from 'airtable-kit/typed';
import projectTrackerSchema from './schemas/projectTracker.ts';
import otherBaseSchema from './schemas/otherBase.ts';

const airtable = createAirtable({ apiKey: 'YOUR_API_KEY' });
const projectTracker = createBaseClient(projectTrackerSchema, airtable);
const otherBase = createBaseClient(otherBaseSchema, airtable);
otherBase.tables.someTable.createRecords([ ... ]);
```

### Use Case 2: Dynamic Client for Unknown Bases, eg an MCP Tool

```typescript
import { createAirtable } from 'airtable-kit';
import { createBaseClient } from 'airtable-kit/typed';
import { makeListTool } from 'airtable-kit/mcp';

const airtable = createAirtable({ apiKey: 'YOUR_API_KEY' });
const client = createBaseClient(await airtable.bases.get('appXXXXXXXXXXXXXX'), airtable);
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

### Use Case 3: The Airtable Client Without a Schema

The Airtable client reads and writes raw records, so it needs no schema.

```typescript
import { createAirtable } from 'airtable-kit';

const airtable = createAirtable({ apiKey: 'YOUR_API_KEY' });

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

- `airtable.bases`: `list`, `get` (the full schema), `listSchemas`, `create`
- `airtable.tables`: `create`, `update`
- `airtable.fields`: `create`, `update`
- `airtable.records`: `list`, `listPage`, `get`, `create`, `update`, `delete`, `uploadAttachment`
- `airtable.request`: any other endpoint, with the client's credentials

To get typed records for a few fields without a generated schema,
describe just those fields in a typed table client.
Each field needs the same `options` Airtable returns in the base schema:

```typescript
import { createTableClient } from 'airtable-kit/typed';

const tasks = createTableClient('appZZZZZZZZZZZZZZ', {
  id: 'tblAAAAAAAAAAAAAA',
  name: 'tasks',
  fields: [
    { id: 'fldDue', name: 'dueDate', type: 'date', options: { dateFormat: { name: 'iso', format: 'YYYY-MM-DD' } } },
    { id: 'fldDone', name: 'done', type: 'checkbox', options: { icon: 'check', color: 'greenBright' } },
  ],
} as const, airtable);

await tasks.updateRecords([{ id: 'recXXXXXXXXXXXXXX', fields: { dueDate: new Date(), done: true } }]);
const [record] = await tasks.listRecords({ fields: ['dueDate', 'done'] });
record.fields.done; // boolean
```

## Configuration

`createAirtable` takes:

- `apiKey`: an API key or OAuth access token, or a function returning one,
  which is called before every request (eg to refresh an OAuth token).
  Defaults to the `AIRTABLE_API_KEY` environment variable.
- `fetch`: any function with the shape `(url: string, init: RequestInit) => Promise<Response>`.
  Defaults to `globalThis.fetch`. If you pass a custom `fetch` and no API key is found,
  requests are sent without an `Authorization` header, so your `fetch` can add its own.
- `baseUrl`: defaults to `https://api.airtable.com/v0`.

Anywhere a typed client takes an `airtable` argument, you can pass either an `Airtable`
client or these options. If you omit it, `createAirtable()` is used.

```typescript
const airtable = createAirtable({
  fetch: async (url, init) => {
    for (let attempt = 0; ; attempt++) {
      const response = await fetch(url, init);
      if (response.status !== 429 || attempt === 3) return response;
      await new Promise((resolve) => setTimeout(resolve, 30_000));
    }
  },
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
