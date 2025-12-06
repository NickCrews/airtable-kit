/**
 * @module airtable-kit
 * Type-safe Airtable client with runtime validation and code generation
 * 
 * https://github.com/NickCrews/airtable-kit
 */

import * as bases from "./bases/index.ts";
import * as codegen from "./codegen/index.ts";
import * as exceptions from "./exceptions.ts";
import * as fetcher from "./fetcher.ts";
import * as fields from "./fields/index.ts";
import * as formula from "./formula/index.ts";
import * as mcp from "./mcp/index.ts";
import * as records from "./records/index.ts";
import * as tables from "./tables/index.ts";
import * as types from "./types.ts";
import * as validators from "./validators/index.ts";

export {
    bases,
    codegen,
    exceptions,
    fetcher,
    fields,
    formula,
    mcp,
    records,
    tables,
    types,
    validators,
};