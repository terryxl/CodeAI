interface ErrorLike {
    message: string;
    name?: string;
}
export declare const isErrorLike: (value: unknown) => value is ErrorLike;
/**
 * Returns true if `val` is not `null` or `undefined`
 */
export declare const isDefined: <T>(value: T) => value is NonNullable<T>;
export declare function pluralize(string: string, count: number | bigint, plural?: string): string;
/**
 * Return a filtered version of the given array, de-duplicating items based on the given key function.
 * The order of the filtered array is not guaranteed to be related to the input ordering.
 */
export declare const dedupeWith: <T>(items: T[], key: keyof T | ((item: T) => string)) => T[];
export {};
//# sourceMappingURL=index.d.ts.map