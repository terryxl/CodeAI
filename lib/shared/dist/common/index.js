// TODO(sqs): copied from sourcegraph/sourcegraph. should dedupe.
export const isErrorLike = (value) => typeof value === 'object' &&
    value !== null &&
    ('stack' in value || 'message' in value) &&
    !('__typename' in value);
/**
 * Returns true if `val` is not `null` or `undefined`
 */
export const isDefined = (value) => value !== undefined && value !== null;
export function pluralize(string, count, plural = `${string}s`) {
    return count === 1 || count === 1n ? string : plural;
}
/**
 * Return a filtered version of the given array, de-duplicating items based on the given key function.
 * The order of the filtered array is not guaranteed to be related to the input ordering.
 */
export const dedupeWith = (items, key) => [
    ...new Map(items.map(item => [typeof key === 'function' ? key(item) : item[key], item])).values(),
];
//# sourceMappingURL=index.js.map