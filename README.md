# airtable-kit

A type-safe, fully-featured, and standards-centric Airtable API client for TypeScript and JavaScript.

## Features

- **Standards-Centric**: Everything is derived from a Base's.tsON schema directly from the [Airtable API](https://airtable.com/developers/web/api/get-base-schema).
- **Type-Safe**: Full TypeScript support is inferred from this schema: keep your API safe from field renames, and get full IDE type hints when working with records (eg the available select options for a select field)
- **Also Dynamic at Runtime**: If instead you are building an API where you don't know which bases you'll be working with at compile time, this architecture means that you can just-in-time fetch the base's schema and still have pleasant type-mapping.
- **Zero-Dependencies**: No required dependencies! `zod` is optional if you want runtime validation (eg for MCP tools).
- **Portable**: Works in Node.js, Deno, and the browser, including in sandboxed environments, e.g. where `process.env` and `os.homedir()` are not available.
- **Runtime Validation**: Optionally, dynamically generate Zod validators from the schema to validate all data sent to Airtable at runtime.
- **MCP Tools**: Ready-to-use MCP tools for LLM integration

## Installation

```bash
pnpm add airtable-kit
```

## Quick Start

### Use Case 1: Statically Typed Client for a Known Base

Run the codegen CLI to fetch and save your base schema to a local file:

```bash
npx airtable-kit codegen --api-key YOUR_API_KEY --base-id appXXXXXXXXXXXXXX --output ./schemas/myBase.ts
```

This will create a file at `./schemas/myBase.ts` with the very simple contents of

```typescript
export default {
  "id": "appXXXXXXXXXXXXXX",
  "name": "myBase",
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
and we add the top-level `id: "appXXXXXXXXXXXXXX"` and `name: "myBase"` fields,
which aren't present in the raw JSON.

If you dropped the `as const` you would have a plain javascript file if you
are working with javascript. You can get the CLI to do this simply by changing the
output file extension from `.ts` to `.ts`.

There is also a programmatic way to get and save the schema.
Read the code to see how.

Now, use the generated schema to create a type-safe Airtable client:

```typescript
import { baseClient } from 'airtable-kit/client';
import myBaseSchema from './schemas/myBase';

const client = baseClient({
  baseId: myBaseSchema.id,
  tables: myBaseSchema.tables,
  fetcher: YOUR_API_KEY,
});
// if you tried `client.tables.nonExistentTable` you would get a type error here
client.tables.tasks.insert([
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
```

This also supports multi-base clients!

```typescript
import { orgClient } from 'airtable-kit/client';
import myBase from './schemas/myBase';
import otherBase from './schemas/otherBase';

const client = orgClient({
  bases: [myBase, otherBase],
  fetcher: YOUR_API_KEY,
});
client.bases.otherBase.tables.someTable.insert([ ... ]);
// `client.bases.<base name>` is an instance of BaseClient, like above.
// `client.bases.nonExistentBase` would be a type error
```

### Use Case 2: Dynamic Client for Unknown Bases, eg an MCP Tool

```typescript
import { baseClient } from 'airtable-kit/client';
import { fetchBaseSchema } from 'airtable-kit/schema';

const baseSchema = await fetchBaseSchema({
  apiKey: YOUR_API_KEY,
  baseId: 'appXXXXXXXXXXXXXX',
});

// TODO: actually flesh this out with an example
```
## Architecture

The package is organized into focused modules:

- **Schema Module** (`airtable-kit/schema`): Fetch and persist Airtable base schemas
- **Client Module** (`airtable-kit/client`): Unified HTTP client with optional validation
- **Codegen Module** (`airtable-kit/codegen`): Generate schema files from Airtable bases
- **Validators Module** (`airtable-kit/validators`): Generate Zod schemas for runtime validation
- **MCP Module** (`airtable-kit/mcp`): MCP tools for LLM integration

## Comparison to Other Airtable Libraries

### [airtable-ts](https://github.com/domdomegg/airtable-ts)
I was using this before building this library, and it is a great library.
- Also type-safe
- Derives types from typescript `interface`s instead of the raw base schema.
  This loses some type-safety, eg for supplying valid select options.
  This is how most typescript airtable libraries work.
  There is a separate `airtable-ts-codegen` package to generate these interfaces.
- You can only work with bases known at compile-time, you can't dynamically
  fetch a base schema at runtime and make a client for it.
- No runtime validation support.

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
