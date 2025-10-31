/**
 * Validators module - generate Zod schemas from Airtable schemas
 */

import * as z4 from 'zod/v4';

export {
  fieldSchemaToZod,
} from './field-to-zod.ts';

export {
  makeZodForWriteRecord,
} from './schema-to-zod.ts';

export const RecordIdSchema = z4.templateLiteral(["rec", z4.string().length(14)]).describe("Airtable Record ID of the form 'recXXXXXXXXXXXXXX'");