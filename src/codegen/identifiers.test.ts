import { describe, it, expect } from 'vitest'
import { toIdentifier, isValidIdentifier } from './identifiers'

describe('toCamelCase', () => {
    const cases: [string, string][] = [
        ['', ''],
        ['foo', 'foo'],
        ['Foo', 'foo'],
        ['FOO', 'foo'],
        ['helloWorld', 'helloWorld'],
        ['HelloWorld', 'helloWorld'],
        ['hello_world', 'helloWorld'],
        ['hello__world', 'helloWorld'],
        ['hello-world', 'helloWorld'],
        ['hello--world', 'helloWorld'],
        ['hello world', 'helloWorld'],
        ['HELLO_WORLD', 'helloWorld'],
        ['HTTP_status_code', 'httpStatusCode'],
        ['UserID', 'userId'],
        ['myURL', 'myUrl'],
        ['URL', 'url'],
        ['ver2_id', 'ver2Id'],
        ['  spaced  name  ', 'spacedName'],
        ['client(s)', 'clientS'],
        ['is "completed"?', 'isCompleted'],
        ["is 'completed'?", 'isCompleted'],
        ['emojii😊name', 'emojiiName'],
        ['1startsWithNumber', '_1StartsWithNumber'],
        // reserved words
        ['object', '_object'],
        ['any', '_any'],
    ]
    for (const [input, output] of cases) {
        it(`'${input}' -> '${output}'`, () => { expect(toIdentifier(input)).toBe(output) })
    }
})

describe('isValidIdentifier', () => {
    it('accepts typical valid identifiers', () => {
        expect(isValidIdentifier('foo')).toBe(true)
        expect(isValidIdentifier('fooBar')).toBe(true)
        expect(isValidIdentifier('_foo')).toBe(true)
        expect(isValidIdentifier('$foo')).toBe(true)
        expect(isValidIdentifier('_$x1')).toBe(true)
        expect(isValidIdentifier('a1')).toBe(true)
    })

    it('rejects empty or malformed identifiers', () => {
        expect(isValidIdentifier('')).toBe(false)
        expect(isValidIdentifier('1foo')).toBe(false)
        expect(isValidIdentifier('foo-bar')).toBe(false)
        expect(isValidIdentifier('foo bar')).toBe(false)
        expect(isValidIdentifier('foo.')).toBe(false)
        expect(isValidIdentifier('*foo')).toBe(false)
        expect(isValidIdentifier('-foo')).toBe(false)
    })

    it('rejects reserved words and globals', () => {
        const reserved = [
            'object', 'any', 'await', 'class', 'interface', 'eval', 'arguments',
            'true', 'false', 'null', 'undefined', 'Infinity', 'globalThis'
        ]
        for (const w of reserved) expect(isValidIdentifier(w)).toBe(false)
    })
})