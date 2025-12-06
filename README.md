# airtable-kit

A type-safe, fully-featured, and standards-centric Airtable API client for TypeScript and JavaScript.

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
- **More-sane read behavior**: The raw API (and vanilla [airtable.js](https://github.com/airtable/airtable.js/)) don't include "falsy" values when reading records. We fill in those missing values with sane defaults, eg the empty string for text-like fields, empty arrays for multi-value fields, or an explicit `null` for eg number and date fields.
- **Typesafe Formula Builder**: Build Airtable formulas programmatically with full type-safety and autocompletion, eg 
  `formulaToString(tableSchema, ["<=", { field: "Due Date" }, ["DATEADD", ["TODAY"], 7, "days"]])`
  yields
  `{fld123xyz} <= DATEADD(TODAY(), 7, "days")`.
- **Both Functional and OOP APIs**: Use either the functional API that is a 1:1 mapping to the Airtable REST API, or the OOP-style client with methods like `base.tables.myTable.create(records)`.
- **Zero-Dependencies**: No required dependencies! `zod` is optional if you want runtime validation (eg for MCP tools).
- **Portable**: Works in Node.js, Deno, and the browser, including in sandboxed environments, e.g. where `process.env` and `os.homedir()` are not available.
- **Runtime Validation**: Optionally, dynamically generate Zod validators from the schema to validate all data sent to Airtable at runtime.
- **MCP Tools**: Ready-to-use MCP tools for LLM integration.

## Installation

This is [available on npm](https://www.npmjs.com/package/airtable-kit):

```bash
pnpm add airtable-kit
```

## Quick Start

### Use Case 1: Statically Typed Client for a Known Base

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
import atk from 'airtable-kit';
import projectTrackerSchema from './schemas/projectTracker.ts';

const client = atk.clients.makeBaseClient({
  baseSchema: projectTrackerSchema,
  fetcher: 'YOUR_API_KEY',
});
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

This also supports multi-base clients!

```typescript
import atk from 'airtable-kit';
import projectTrackerSchema from './schemas/projectTracker.ts';
import otherBase from './schemas/otherBase.ts';

const client = atk.clients.makeOrgClient({
  bases: [projectTrackerSchema, otherBase],
  fetcher: 'YOUR_API_KEY',
});
client.bases.otherBase.tables.someTable.createRecords([ ... ]);
// `client.bases.<base name>` is an instance of BaseClient, like above.
// `client.bases.nonExistentBase` would be a type error
```

### Use Case 2: Dynamic Client for Unknown Bases, eg an MCP Tool

```typescript
import atk from 'airtable-kit';

const fetcher = 'YOUR_API_KEY';
const baseSchema = await atk.bases.getBaseSchema({ baseId: 'appXXXXXXXXXXXXXX', fetcher });
const client = atk.clients.makeBaseClient({ baseSchema, fetcher });
const listTool = atk.mcp.makeListTool(client);

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

### Use Case 3: Use the functional API for simple uses

```typescript
import atk from 'airtable-kit';

atk.fields.createField(
  {
    baseId: 'appZZZZZZZZZZZ',
    tableId: 'tblAAAAAAAAAAAAAA',
    field: {
      name: 'newField',
      type: 'singleLineText',
    },
    fetcher: 'YOUR_API_KEY',
  }
)

atk.records.updateRecords(
  {
    records: [
      {id: 'recXXXXXXXXXXXX', fields: { 'fldYYYYYYYYYYYYYY': 47 } },
    ],
    baseId: 'appZZZZZZZZZZZ',
    tableId: 'tblAAAAAAAAAAAAAA',
    fetcher: 'YOUR_API_KEY',
    // TODO: This is currently required to do value conversion when reading
    // and writing to the API, but ideally this would be optional, in which
    // case we would just pass through values as-is.
    // See the "more sane read behavior" feature above.
    fields: [{
      id: 'fldYYYYYYYYYYYYYY',
      name: 'priority',
      type: 'number',
    }]
  }
)
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
