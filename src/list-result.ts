import { ListResultConsumedError } from "./exceptions.ts";

/**
 * The result of a list method, such as `listRecords()`. Read it once, in one of two ways:
 *
 * ```typescript
 * const records = await tasks.listRecords();             // every page, as an array
 * for await (const record of tasks.listRecords()) { }    // one page at a time
 * ```
 *
 * Nothing is fetched until it is awaited or iterated.
 * Awaiting it more than once gives the same array, fetched once.
 * Iterating it a second time, or both awaiting and iterating it, throws a {@link ListResultConsumedError}.
 * Call the list method again to fetch again.
 */
export interface ListResult<T> extends PromiseLike<T[]>, AsyncIterable<T> {
    then<R1 = T[], R2 = never>(
        onfulfilled?: ((value: T[]) => R1 | PromiseLike<R1>) | null,
        onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
    ): Promise<R1 | R2>;
    catch<R = never>(onrejected?: ((reason: unknown) => R | PromiseLike<R>) | null): Promise<T[] | R>;
    finally(onfinally?: (() => void) | null): Promise<T[]>;
}

/**
 * Create a {@link ListResult} that reads from `source` when it is first awaited or iterated.
 *
 * @param source - Called once, to start fetching
 * @param name - The list method's name, used in error messages, eg "listRecords"
 */
export function makeListResult<T>(source: () => AsyncIterable<T>, name: string): ListResult<T> {
    let state: "unread" | "awaited" | "iterated" = "unread";
    let all: Promise<T[]> | undefined;
    const consumedError = () => new ListResultConsumedError(
        `The result of ${name}() was already ${state}. Call ${name}() again to fetch again.`,
    );
    const toPromise = (): Promise<T[]> => {
        if (state === "iterated") {
            return Promise.reject(consumedError());
        }
        if (!all) {
            state = "awaited";
            all = (async () => {
                const items: T[] = [];
                for await (const item of source()) {
                    items.push(item);
                }
                return items;
            })();
        }
        return all;
    };
    return {
        then: (onfulfilled, onrejected) => toPromise().then(onfulfilled, onrejected),
        catch: (onrejected) => toPromise().catch(onrejected),
        finally: (onfinally) => toPromise().finally(onfinally),
        [Symbol.asyncIterator]() {
            if (state !== "unread") {
                throw consumedError();
            }
            state = "iterated";
            return source()[Symbol.asyncIterator]();
        },
    };
}
