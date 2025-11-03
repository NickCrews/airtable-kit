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
- **Zero-Dependencies**: No required dependencies! `zod` is optional if you want runtime validation (eg for MCP tools).
- **Portable**: Works in Node.js, Deno, and the browser, including in sandboxed environments, e.g. where `process.env` and `os.homedir()` are not available.
- **Runtime Validation**: Optionally, dynamically generate Zod validators from the schema to validate all data sent to Airtable at runtime.
- **MCP Tools**: Ready-to-use MCP tools for LLM integration.

## Installation

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

There is also a typescript API to get and save the schema.
Read the code to see how.

Now, use the generated schema to create a type-safe Airtable client:

```typescript
import { makeBaseClient } from 'airtable-kit';
import projectTrackerSchema from './schemas/projectTracker.ts';

const client = makeBaseClient({
  baseSchema: projectTrackerSchema,
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
import { makeOrgClient } from 'airtable-kit';
import projectTrackerSchema from './schemas/projectTracker.ts';
import otherBase from './schemas/otherBase.ts';

const client = makeOrgClient({
  bases: [projectTrackerSchema, otherBase],
  fetcher: YOUR_API_KEY,
});
client.bases.otherBase.tables.someTable.insert([ ... ]);
// `client.bases.<base name>` is an instance of BaseClient, like above.
// `client.bases.nonExistentBase` would be a type error
```

### Use Case 2: Dynamic Client for Unknown Bases, eg an MCP Tool

```typescript
import { fetchBaseSchema, makeBaseClient } from 'airtable-kit';

const baseSchema = await fetchBaseSchema({
  baseId: 'appXXXXXXXXXXXXXX',
  fetcher: YOUR_API_KEY,
});

// TODO: actually flesh this out with an example
```
## Architecture

The package is organized into focused modules:

- **Core** (`airtable-kit`): Basic types and utilities
- **Fields Module** (`airtable-kit/fields`): Type definitions for all Airtable field schemas, eg 'singleSelect'
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
