/**
 * airtable-kit - Type-safe Airtable client with runtime validation and code generation
 */

import * as schema from "./schema/index.js";
export { schema };

import * as validators from "./validators/index.js";
export { validators };

import * as client from "./client/index.js";
export { client };

import * as mcp from "./mcp/index.js";
export { mcp };

import * as codegen from "./codegen/index.js";
export { codegen };

/**
 * A unique Symbol to access the record ID on records.
 *
 * In several of the APIs, records are represented as objects
 */
// export const RecordId: unique symbol = Symbol.for("airtable-kit:RecordId");
// export type WithRecordId<T extends Record<string, any> = Record<string, any>> = T & { [RecordId]: string };
