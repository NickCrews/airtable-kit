import type { BaseId, TableId, BaseSchema, TableSchema } from "../types.ts";

export interface ResolutionResult<T> {
    matches: T[];
    isExact: boolean;
}

export class ResolutionError extends Error {
    constructor(
        public entityType: string,
        public identifier: string,
        public matches: unknown[],
        public context?: string
    ) {
        const matchInfo = matches.length > 0
            ? `Found ${matches.length} match(es): ${matches.map(m => (m as any).name || (m as any).id).join(", ")}`
            : "No matches found";

        const ctx = context ? ` (${context})` : "";
        super(`Could not resolve ${entityType} "${identifier}"${ctx}. ${matchInfo}`);
    }
}

function normalizeString(s: string): string {
    return s.toLowerCase().trim();
}

export function resolveBase(
    identifier: string | null | undefined,
    bases: BaseSchema[]
): ResolutionResult<BaseSchema> {
    if (!identifier) {
        return { matches: [], isExact: false };
    }

    const normalized = normalizeString(identifier);
    const exact = bases.find(b => b.id === identifier);

    if (exact) {
        return { matches: [exact], isExact: true };
    }

    const nameMatches = bases.filter(b =>
        normalizeString(b.name).includes(normalized)
    );

    return { matches: nameMatches, isExact: false };
}

export function resolveTable(
    baseId: BaseId | string | null | undefined,
    identifier: string | null | undefined,
    bases: BaseSchema[]
): ResolutionResult<{ base: BaseSchema; table: TableSchema }> {
    if (!identifier) {
        return { matches: [], isExact: false };
    }

    const normalized = normalizeString(identifier);
    const matches: { base: BaseSchema; table: TableSchema }[] = [];

    for (const base of bases) {
        if (baseId && base.id !== baseId && normalizeString(baseId).toLowerCase() !== normalizeString(base.name)) {
            continue;
        }

        const exact = base.tables.find(t => t.id === identifier);
        if (exact) {
            matches.push({ base, table: exact });
        } else {
            const nameMatches = base.tables.filter(t =>
                normalizeString(t.name).includes(normalized)
            );
            matches.push(...nameMatches.map(table => ({ base, table })));
        }
    }

    const isExact = matches.some(m => m.table.id === identifier);
    return { matches, isExact };
}

export function resolveField(
    baseId: BaseId | string | null | undefined,
    tableId: TableId | string | null | undefined,
    identifier: string | null | undefined,
    bases: BaseSchema[]
): ResolutionResult<{ base: BaseSchema; table: TableSchema; field: any }> {
    if (!identifier) {
        return { matches: [], isExact: false };
    }

    const normalized = normalizeString(identifier);
    const matches: { base: BaseSchema; table: TableSchema; field: any }[] = [];

    for (const base of bases) {
        if (baseId && base.id !== baseId && normalizeString(baseId).toLowerCase() !== normalizeString(base.name)) {
            continue;
        }

        for (const table of base.tables) {
            if (tableId && table.id !== tableId && normalizeString(tableId).toLowerCase() !== normalizeString(table.name)) {
                continue;
            }

            const exact = table.fields.find(f => f.id === identifier);
            if (exact) {
                matches.push({ base, table, field: exact });
            } else {
                const nameMatches = table.fields.filter(f =>
                    normalizeString(f.name).includes(normalized)
                );
                matches.push(
                    ...nameMatches.map(field => ({ base, table, field }))
                );
            }
        }
    }

    const isExact = matches.some(m => m.field.id === identifier);
    return { matches, isExact };
}

export function requireUnique<T extends { id?: string; name?: string }>(
    matches: T[],
    entityType: string,
    identifier: string,
    context?: string
): T {
    if (matches.length === 0) {
        throw new ResolutionError(entityType, identifier, [], context);
    }
    if (matches.length === 1) {
        return matches[0];
    }
    throw new ResolutionError(entityType, identifier, matches, context);
}

export function ensureOneMatch<T>(
    result: ResolutionResult<T>,
    entityType: string,
    identifier: string,
    context?: string
): T {
    if (result.matches.length === 0) {
        throw new ResolutionError(entityType, identifier, [], context);
    }
    if (result.matches.length > 1 && !result.isExact) {
        throw new ResolutionError(entityType, identifier, result.matches, context);
    }
    return result.matches[0];
}
