/**
 * Types for validators module
 */

import type { z } from 'zod';

export interface BaseValidators {
  tables: Record<string, TableValidators>;
}

export interface TableValidators {
  record: z.ZodSchema;
  fields: Record<string, z.ZodSchema>;
  createInput: z.ZodSchema;
  updateInput: z.ZodSchema;
}
