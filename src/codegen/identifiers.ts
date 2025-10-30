export function toIdentifier(name: string): string {
    const cleaned = name
        .replace(/[^A-Za-z0-9]+/g, ' ')
        .trim();
    if (!cleaned) return '';
    const parts = cleaned.match(/[A-Z]{2,}(?=[A-Z][a-z]|[0-9]|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]+|[0-9]+/g) || [];
    const [head, ...tail] = parts;
    if (!head) return '';
    const first = head.toLowerCase();
    const rest = tail.map(p => p.toLowerCase().replace(/^./, c => c.toUpperCase()));
    let id = first + rest.join('');
    if (/^[0-9]/.test(id)) id = '_' + id; // JS identifier cannot start with a digit
    if (RESERVED_WORDS.has(id)) id = '_' + id; // Avoid reserved words
    return id;
}

export function isValidIdentifier(name: string): boolean {
    if (!name) return false;
    if (RESERVED_WORDS.has(name)) return false;
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

// https://262.ecma-international.org/14.0/#sec-keywords-and-reserved-words
// 14 is ES2023
const identifiers = [
    // Keywords
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',

    // Future reserved keywords (strict mode)
    'implements',
    'interface',
    'let',
    'package',
    'private',
    'protected',
    'public',
    'static',

    // Not keywords, but still restricted
    'arguments',
    'eval',
];

// https://262.ecma-international.org/14.0/#sec-value-properties-of-the-global-object
const globalProperties = [
    'globalThis',
    'Infinity',
    'NaN',
    'undefined',
];

// These are TypeScript's built-in types that are reserved and cannot be used for type names
const typeScriptTypes = [
    'any',
    'bigint',
    'boolean',
    'never',
    'null',
    'number',
    'object',
    'string',
    'symbol',
    'undefined',
    'unknown',
    'void',
];

const RESERVED_WORDS = new Set<string>([
    ...identifiers,
    ...globalProperties,
    ...typeScriptTypes,
]);