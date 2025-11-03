import { describe, it, expect } from "vitest";
import {
    formulaToString,
    type Formula,
} from "./formula.ts";
import taskBaseSchema from "../tests/taskBase.ts";

const fields = taskBaseSchema.tables.find(t => t.name === "tasks")!.fields;
type Field = typeof fields[number];


describe("formulaToString()", () => {
    it("should convert string literals", () => {
        const result = formulaToString(fields, "John");
        expect(result).toBe('"John"');
    });

    it("should escape quotes in string literals", () => {
        const result = formulaToString(fields, 'John "The Rock" Doe');
        expect(result).toBe('"John \\"The Rock\\" Doe"');
    });

    it("should convert empty strings", () => {
        const result = formulaToString(fields, '');
        expect(result).toBe('""');
    });

    it("should convert number literals", () => {
        const result = formulaToString(fields, 42);
        expect(result).toBe("42");
    });

    it("should convert boolean true", () => {
        const result = formulaToString(fields, true);
        expect(result).toBe("TRUE()");
    });

    it("should convert boolean false", () => {
        const result = formulaToString(fields, false);
        expect(result).toBe("FALSE()");
    });

    it("should convert undefined to BLANK()", () => {
        const result = formulaToString(fields, undefined);
        expect(result).toBe("BLANK()");
    });

    it("should convert null to BLANK()", () => {
        const result = formulaToString(fields, null);
        expect(result).toBe("BLANK()");
    });

    it("should convert Date objects to ISO strings", () => {
        const date = new Date("2023-01-01T00:00:00Z");
        const result = formulaToString(fields, date);
        expect(result).toBe('"2023-01-01T00:00:00.000Z"');
    });

    it("should convert field names to field IDs", () => {
        const formula: Formula<Field> = { field: "Name" };
        const result = formulaToString(fields, formula);
        expect(result).toBe("{fldName}");
    });

    it("should keep field IDs as field IDs", () => {
        const formula: Formula<Field> = { field: "fldName" };
        const result = formulaToString(fields, formula);
        expect(result).toBe("{fldName}");
    });

    it("should throw error for unknown field", () => {
        // @ts-expect-error invalid field reference
        const formula: Formula<Field> = { field: "unknownField" }
        expect(() => formulaToString(fields, formula)).toThrow(
            'Field "unknownField" not found in table mappings'
        );
    });

    it("should convert simple function calls", () => {
        const formula: Formula<Field> = ["BLANK", { field: "Notes" }];
        const result = formulaToString(fields, formula);
        expect(result).toBe("BLANK({fldNotes})");
    });

    it("should convert OR formulas", () => {
        const formula: Formula<Field> = [
            "OR",
            { field: "Completed" },
            ["=", { field: "Name" }, "John"]
        ];
        const result = formulaToString(fields, formula);
        expect(result).toBe('OR({fldCompleted}, {fldName} = "John")');
    });

    it("should convert AND formulas", () => {
        const formula: Formula<Field> = [
            "AND",
            { field: "Completed" },
            ["=", { field: "Priority" }, 25]
        ];
        const result = formulaToString(fields, formula);
        expect(result).toBe("AND({fldCompleted}, {fldPriority} = 25)");
    });

    it("should convert nested formulas", () => {
        const formula: Formula<Field> = [
            "AND",
            [
                "OR",
                ["=", { field: "Name" }, "John"],
                ["=", { field: "fldName" }, "Jane"]
            ],
            { field: "Completed" }
        ];
        const result = formulaToString(fields, formula);
        expect(result).toBe(
            'AND(OR({fldName} = "John", {fldName} = "Jane"), {fldCompleted})'
        );
    });

    it("should work with 0-argument functions", () => {
        const topUpcoming: Formula<Field> = [
            "AND",
            [">=", { field: "Due Date" }, ["TODAY"]],
            ["<=", { field: "Due Date" }, ["DATEADD", ["TODAY"], 7, "days"]],
            ["=", { field: "Priority" }, "High"],
        ];
        const result = formulaToString(fields, topUpcoming);
        expect(result).toBe(
            'AND({fldDueDate} >= TODAY(), {fldDueDate} <= DATEADD(TODAY(), 7, "days"), {fldPriority} = "High")'
        );
    });

    it("should convert SEARCH function", () => {
        const formula: Formula<Field> = [
            "SEARCH",
            ["LOWER", "john"],
            ["LOWER", { field: "Name" }],
        ];
        const result = formulaToString(fields, formula);
        expect(result).toBe('SEARCH(LOWER("john"), LOWER({fldName}))');
    });

    it("should convert complex nested formula with multiple functions", () => {
        const formula: Formula<Field> = [
            "AND",
            ["NOT", ["BLANK", { field: "Notes" }]],
            [">=", { field: "Priority" }, 18],
            [
                "OR",
                ["SEARCH", ["LOWER", "john"], ["LOWER", { field: "Name" }]],
                ["SEARCH", ["LOWER", "john"], ["LOWER", { field: "Name" }]]
            ]
        ];
        const result = formulaToString(fields, formula);
        expect(result).toBe(
            'AND(NOT(BLANK({fldNotes})), {fldPriority} >= 18, OR(SEARCH(LOWER("john"), LOWER({fldName})), SEARCH(LOWER("john"), LOWER({fldName}))))'
        );
    });

    it("should throw for wrong number of arguments", () => {
        // Ideally this would typecheck as well
        expect(() => formulaToString(fields, ["=", 4])).toThrow();
    });

    it("should typecheck for empty arrays (functions with no opcodes)", () => {
        // @ts-expect-error invalid field reference
        expect(() => formulaToString(fields, [])).toThrow();
    });

    it("should typecheck for bogus formulas ", () => {
        // @ts-expect-error invalid field reference
        expect(() => formulaToString(fields, ["FOOBAR", 42])).toThrow();
    });
});
