import { type FieldSchemaRead } from "../fields/types.ts";

export const FUNCTION_OPCODES = [
    "ABS",
    "AND",
    "ARRAYCOMPACT",
    "ARRAYFLATTEN",
    "ARRAYJOIN",
    "ARRAYSLICE",
    "ARRAYUNIQUE",
    "AVERAGE",
    "BLANK",
    "CEILING",
    "CONCATENATE",
    "COUNT",
    "COUNTA",
    "COUNTALL",
    "CREATED_TIME",
    "DATEADD",
    "DATESTR",
    "DATETIME_DIFF",
    "DATETIME_FORMAT",
    "DATETIME_PARSE",
    "DAY",
    "ENCODE_URL_COMPONENT",
    "ERROR",
    "EVEN",
    "EXP",
    "FALSE",
    "FIND",
    "FLOOR",
    "HOUR",
    "IF",
    "INT",
    "IS_AFTER",
    "IS_BEFORE",
    "IS_SAME",
    "ISERROR",
    "LAST_MODIFIED_TIME",
    "LEFT",
    "LEN",
    "LOG",
    "LOWER",
    "MAX",
    "MID",
    "MIN",
    "MINUTE",
    "MOD",
    "MONTH",
    "NOT",
    "NOW",
    "ODD",
    "OR",
    "POWER",
    "RECORD_ID",
    "REGEX_EXTRACT",
    "REGEX_MATCH",
    "REGEX_REPLACE",
    "REPLACE",
    "REPT",
    "RIGHT",
    "ROUND",
    "ROUNDDOWN",
    "ROUNDUP",
    "SEARCH",
    "SECOND",
    "SET_LOCALE",
    "SET_TIMEZONE",
    "SQRT",
    "SUBSTITUTE",
    "SUM",
    "SWITCH",
    "T",
    "TIMESTR",
    "TODAY",
    "TONOW",
    "TRIM",
    "TRUE",
    "UPPER",
    "VALUE",
    "WEEKDAY",
    "WEEKNUM",
    "WORKDAY_DIFF",
    "WORKDAY",
    "XOR",
    "YEAR",
] as const;
const OPERATOR_OPCODES = [
    '&',
    '>',
    '<',
    '>=',
    '<=',
    '=',
    '!=',
    '+',
    '-',
    '*',
    '/',
] as const;
type FunctionOpCode = typeof FUNCTION_OPCODES[number];
type OperatorOpCode = typeof OPERATOR_OPCODES[number];
type OpCode = FunctionOpCode | OperatorOpCode;

// Formula types
type FieldRef<T extends FieldSchemaRead> = { field: T["id"] | T["name"] };
type ToIdMapping<T extends FieldSchemaRead> = Record<T["id"] | T["name"], T["id"]>;
type FormulaValue<T extends FieldSchemaRead> =
    | undefined
    | null
    | string
    | number
    | boolean
    | Date
    | FieldRef<T>
    | FormulaFunction<T>;
type FormulaFunction<T extends FieldSchemaRead> = [OpCode, ...FormulaValue<T>[]];

/**
 * Formula type representing a formula expression for a given set of fields.
 * 
 * @typeParam T - A readonly array of {@link FieldSchema} objects representing the fields in the table
 * @see {@link formulaToString} for more info and examples
 */
export type Formula<T extends FieldSchemaRead> = FormulaValue<T>;

function _formulaToString<T extends FieldSchemaRead>(
    fields: ReadonlyArray<T>,
    value: FormulaValue<T>,
    toId: ToIdMapping<T>,
): string {
    if (value === null) {
        return "BLANK()";
    }
    if (value === undefined) {
        return "BLANK()";
    }
    if (typeof value === "string") {
        // Escape quotes in strings and wrap in quotes
        return `"${value.replace(/"/g, '\\"')}"`;
    }
    if (typeof value === "number") {
        return value.toString();
    }
    if (typeof value === "boolean") {
        return value ? "TRUE()" : "FALSE()";
    }
    if (value instanceof Date) {
        return `"${value.toISOString()}"`;
    }
    if (typeof value === "object" && "field" in value) {
        // Field reference - replace with fieldId
        const fieldId = toId[value.field];
        if (!fieldId) {
            throw new Error(
                `Field "${value.field}" not found in table mappings. Available fields: ${fields.map(field => field.name).join(", ")}`
            );
        }
        return `{${fieldId}}`;
    }
    if (Array.isArray(value)) {
        // Function or operator call
        const [opcode, ...args] = value;
        if (opcode === undefined || typeof opcode !== "string") {
            throw new Error(`Invalid opcode in formula: ${JSON.stringify(opcode)}`);
        }
        if (FUNCTION_OPCODES.includes(opcode as FunctionOpCode)) {
            const argsStr = args.map((arg) => _formulaToString(fields, arg, toId)).join(", ");
            return `${opcode}(${argsStr})`;
        } else if (OPERATOR_OPCODES.includes(opcode as OperatorOpCode)) {
            if (args.length !== 2) {
                throw new Error(`Operator "${opcode}" requires exactly 2 arguments, got ${args.length}`);
            }
            const left = _formulaToString(fields, args[0], toId);
            const right = _formulaToString(fields, args[1], toId);
            return `${left} ${opcode} ${right}`;
        } else {
            throw new Error(`Unknown opcode in formula: ${opcode}`);
        }
    }
    throw new Error(`Unsupported formula value: ${JSON.stringify(value satisfies never)}`);
}

/**
 * Converts a formula object to its string representation.
 * 
 * @template T - A readonly array of {@link FieldSchema} objects representing the fields in the table
 * @param {T} fields - An array of {@link FieldSchema} objects representing the fields in the table
 * @param {Formula<T>} formula - The {@link Formula} object to convert to a string
 * @returns {string} The string representation of the formula, ready to be used in Airtable API requests
 * 
 * @example
 * ```ts
 * const fields = [
 *   { id: "fldXXXXXXXXXX", name: "Task Name", type: "singleLineText" },
 *   { id: "fldYYYYYYYYYY", name: "Due Date", type: "date" },
 *   {
 *      id: "fldZZZZZZZZZZ",
 *      name: "Priority",
 *      type: "singleSelect",
 *      options: {
 *          choices: [
 *              { id: "selAAAAAAAA", name: "Low" },
 *              { id: "selBBBBBBBB", name: "Medium" },
 *              { id: "selCCCCCCCC", name: "High" },
 *          ]
 *      }
 *   },
 * ] as const;
 * 
 * const topUpcoming: Formula<typeof fields> = [
 *   "AND",
 *   // due after today
 *   [">=", { field: "Due Date" }, ["TODAY"]],
 *   // due within 7 days
 *   ["<=", { field: "Due Date" }, ["DATEADD", ["TODAY"], 7, "days"]],
 *   ["=", { field: "Priority" }, "High"],
 *   // name is not blank
 *   // Can also reference by field ID
 *   ["!=", { field: "fldXXXXXXXXXX" }, null],
 * ];
 * const formulaStr = formulaToString(fields, topUpcoming);
 * console.log(formulaStr);
 * // 'AND({fldYYYYYYYYYY} >= TODAY(), {fldYYYYYYYYYY} <= DATEADD(TODAY(), 7, "days"), {fldZZZZZZZZZZ} = "High", {fldXXXXXXXXXX} != BLANK())'
 * ```
 * 
 * See how the individual components of the formula are interpreted:
 * - Literals:
 *      - `string`s and `number`s are passed through directly.
 *      - `boolean`s become `TRUE()` or `FALSE()`
 *      - `null` and `undefined` become `BLANK()`
 *      - `Date` objects become ISO strings wrapped in quotes, eg `new Date("2023-01-01")` becomes `"2023-01-01T00:00:00.000Z"`
 * - Field references:
 *      - Any object of the form `{ field: "Task Name" }` (reference by name) or `{ field: "fldXXXXXXXXXX" }` (reference by ID)
 *        becomes a field reference using the field ID, eg `{fldXXXXXXXXXX}`.
 * - Formula functions:
 *     - Arrays are interpreted as function or operator calls.
 *       The first element is the function name, the rest are the arguments.
 *       For example, `["DATEADD", ["TODAY"], 7, "days"]` becomes `DATEADD(TODAY(), 7, "days")`.
 *       This also works for operators like `+`, `-`, `=`, eg `["+", 1, 2]` becomes `1 + 2`.
 *       The `&` operator is unsupported. Use the `CONCATENATE` function instead.
 * 
 * This is unable to handle comparing select fields by choice ID,
 * because the underlying Airtable formula language does not support that.
 * You unfortunately have to compare select fields by choice name,
 * which makes them vulnerable to renames.
 * See the above example, where we compare the "Priority" field by the choice name "High".
 */
export function formulaToString<T extends FieldSchemaRead>(
    fields: ReadonlyArray<T>,
    formula: Formula<T>,
): string {
    const toId: ToIdMapping<T> = fields.reduce((acc, field) => {
        // put id second so it takes precedence
        acc[field.name as T["name"]] = field.id as T["id"];
        acc[field.id as T["id"]] = field.id as T["id"];
        return acc;
    }, {} as ToIdMapping<T>);
    return _formulaToString(fields, formula, toId);
}