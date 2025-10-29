/**
 * Generate Zod validators from Airtable schema
 */

import { z } from 'zod';
import type { BaseSchema, TableSchema } from '../schema/index.js';
import { fieldSchemaToZod, type FieldToZod } from './field-to-zod.js';
import type { BaseValidators } from './types.js';

export interface ValidatorGeneratorOptions {
  /**
   * Whether to make all fields optional (useful for updates)
   */
  optionalFields?: boolean;

  /**
   * Custom field type handlers
   */
  customHandlers?: Record<string, FieldToZod>;
}

export interface ValidatorGenerator {
  generateFieldValidator(
    field: { name: string; type: string },
    options?: ValidatorGeneratorOptions
  ): z.ZodSchema;
  generateTableFieldValidators(
    table: TableSchema,
    options?: ValidatorGeneratorOptions
  ): Record<string, z.ZodSchema>;
  generateRecordValidator(table: TableSchema, options?: ValidatorGeneratorOptions): z.ZodSchema;
  generateCreateValidator(table: TableSchema, options?: ValidatorGeneratorOptions): z.ZodSchema;
  generateUpdateValidator(table: TableSchema, options?: ValidatorGeneratorOptions): z.ZodSchema;
  generateBaseValidators(schema: BaseSchema, options?: ValidatorGeneratorOptions): BaseValidators;
}

export function createValidatorGenerator(
  defaultOptions?: ValidatorGeneratorOptions
): ValidatorGenerator {
  function generateFieldValidator(
    field: { name: string; type: string },
    options?: ValidatorGeneratorOptions
  ): z.ZodSchema {
    const opts = { ...defaultOptions, ...options };
    // This is a simplified version - in practice this would need the full FieldSchema
    const schema = fieldSchemaToZod(field as any, opts.customHandlers);
    return opts.optionalFields ? schema.optional() : schema;
  }

  function generateTableFieldValidators(
    table: TableSchema,
    options?: ValidatorGeneratorOptions
  ): Record<string, z.ZodSchema> {
    const opts = { ...defaultOptions, ...options };
    const validators: Record<string, z.ZodSchema> = {};

    for (const field of table.fields) {
      const schema = fieldSchemaToZod(field, opts.customHandlers);
      validators[field.name] = opts.optionalFields ? schema.optional() : schema;
    }

    return validators;
  }

  function generateRecordValidator(
    table: TableSchema,
    options?: ValidatorGeneratorOptions
  ): z.ZodSchema {
    const opts = { ...defaultOptions, ...options, includeComputedFields: true };
    const fieldValidators = generateTableFieldValidators(table, opts);

    return z.object({
      id: z.string(),
      createdTime: z.string().datetime(),
      fields: z.object(fieldValidators).passthrough(), // Allow extra fields
    });
  }

  function generateCreateValidator(
    table: TableSchema,
    options?: ValidatorGeneratorOptions
  ): z.ZodSchema {
    const opts = { ...defaultOptions, ...options, includeComputedFields: false };
    const fieldValidators: Record<string, z.ZodSchema> = {};

    for (const field of table.fields) {
      const schema = fieldSchemaToZod(field, opts.customHandlers);

      // Primary field is required, others are optional
      if (field.id === table.primaryFieldId) {
        fieldValidators[field.name] = schema;
      } else {
        fieldValidators[field.name] = schema.optional();
      }
    }

    return z.object({
      fields: z.object(fieldValidators),
    });
  }

  function generateUpdateValidator(
    table: TableSchema,
    options?: ValidatorGeneratorOptions
  ): z.ZodSchema {
    const opts = {
      ...defaultOptions,
      ...options,
      includeComputedFields: false,
      optionalFields: true,
    };
    const fieldValidators = generateTableFieldValidators(table, opts);

    return z.object({
      id: z.string(),
      fields: z.object(fieldValidators).partial(),
    });
  }

  function generateBaseValidators(
    schema: BaseSchema,
    options?: ValidatorGeneratorOptions
  ): BaseValidators {
    const validators: BaseValidators = {
      tables: {},
    };

    for (const table of schema.tables) {
      const fieldValidators = generateTableFieldValidators(table, options);

      validators.tables[table.name] = {
        record: generateRecordValidator(table, options),
        fields: fieldValidators,
        createInput: generateCreateValidator(table, options),
        updateInput: generateUpdateValidator(table, options),
      };

      // Also index by ID for easier lookup
      validators.tables[table.id] = validators.tables[table.name];
    }

    return validators;
  }

  return {
    generateFieldValidator,
    generateTableFieldValidators,
    generateRecordValidator,
    generateCreateValidator,
    generateUpdateValidator,
    generateBaseValidators,
  };
}
