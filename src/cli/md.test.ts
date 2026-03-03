import { describe, it, expect } from 'vitest';
import { mdTable } from './md.ts';

describe('mdTable', () => {
    it('should create a basic table', () => {
        const headers = ['Name', 'Age'];
        const rows = [['Alice', '30'], ['Bob', '25']];
        const result = mdTable(headers, rows);
        expect(result).toMatchInlineSnapshot(`
          "| Name  | Age |
          | ----- | --- |
          | Alice | 30  |
          | Bob   | 25  |"
        `)
    });

    it('should align columns with padding', () => {
        const headers = ['Name', 'Age', 'City'];
        const rows = [
            ['Alice', '30', 'New York'],
            ['Bob', '25', 'LA'],
            ['Christopher', '35', 'Austin'],
        ];
        const result = mdTable(headers, rows);
        expect(result).toMatchInlineSnapshot(`
          "| Name        | Age | City     |
          | ----------- | --- | -------- |
          | Alice       | 30  | New York |
          | Bob         | 25  | LA       |
          | Christopher | 35  | Austin   |"
        `)
    });

    it('should pad columns to align text', () => {
        const headers = ['X', 'Long Header'];
        const rows = [
            ['A', 'Y'],
            ['Longer', 'Z'],
        ];
        const result = mdTable(headers, rows);
        expect(result).toMatchInlineSnapshot(`
          "| X      | Long Header |
          | ------ | ----------- |
          | A      | Y           |
          | Longer | Z           |"
        `)
    });

    it('should handle different value types', () => {
        const headers = ['String', 'Number', 'Boolean', 'Null'];
        const rows = [
            ['hello', '42', true, null],
            ['world', '3.14', false, undefined],
        ];
        const result = mdTable(headers, rows);
        expect(result).toMatchInlineSnapshot(`
          "| String | Number | Boolean | Null |
          | ------ | ------ | ------- | ---- |
          | hello  | 42     | \`true\`  |      |
          | world  | 3.14   | \`false\` |      |"
        `)
    });

    it('should truncate long strings', () => {
        const headers = ['Text'];
        const longText = 'a'.repeat(100);
        const rows = [[longText]];
        const result = mdTable(headers, rows);
        expect(result).toMatchInlineSnapshot(`
          "| Text                                                            |
          | --------------------------------------------------------------- |
          | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa... |"
        `)
    });
});
