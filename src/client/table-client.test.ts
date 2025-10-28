import { beforeEach, describe, expect, it } from "vitest";
import { createMockFetcher } from "./fetcher.ts";
import { tableClient } from "./table-client.ts";

const myFields = [
    { name: "age", type: "number", id: "fldAge" },
    { name: "fullName", type: "singleLineText", id: "fldFullName" },
    { name: "dob", type: "date", id: "fldDob" },
    {
        name: "status",
        type: "singleSelect",
        id: "fldStatus",
        options: {
            choices: [
                { id: "sel1", name: "New" },
                { id: "sel2", name: "In Progress" },
                { id: "sel3", name: "Done" },
            ],
        },
    },
] as const;

describe("TableClient", () => {
    const mockFetcher = createMockFetcher();
    const client = tableClient({
        baseId: "app123",
        tableId: "tbl123",
        fetcher: mockFetcher,
        fieldSpecs: myFields,
    });
    beforeEach(() => {
        mockFetcher.reset();
    });
    it("can insert records", async () => {
        await client.insert(
            [{
                age: 30,
                fldFullName: "John Doe",
                dob: new Date("1990-01-01"),
            }],
        );
        expect(mockFetcher.getCallHistory()).toEqual([{
            path: "/app123/tbl123",
            method: "POST",
            data: {
                records: [
                    {
                        fields: {
                            fldAge: 30,
                            fldFullName: "John Doe",
                            fldDob: "1990-01-01",
                        },
                    },
                ],
            },
        }]);
    });
    it("has typesafety on selects and multiselects", async () => {
        const f = async () =>
            await client.insert(
                [
                    {
                        status: "In Progress",
                    },
                    {
                        status: "sel3",
                    },
                    {
                        // @ts-expect-error invalid select option
                        status: "bogus",
                    },
                ],
            );
        await expect(f()).rejects.toThrow();
    });
});
