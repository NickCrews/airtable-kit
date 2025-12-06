/**
 * Codegen module - generate static TypeScript code from Airtable schema
 */

export {
  type CodegenOptions,
  generateCode,
} from './generator.ts';

export {
  isValidIdentifier,
  toIdentifier,
} from './identifiers.ts';
