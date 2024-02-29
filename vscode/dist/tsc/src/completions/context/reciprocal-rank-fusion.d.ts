/**
 * Implements a basic variant of reciprocal rank fusion to combine context items from various
 * retrievers into one result set.
 *
 * Since the definition of documents can vary across the consumers, a rankingIdentities function needs
 * to be implemented that returns a set of identifiers for a document. A set is used to support our
 * needs of varying context windows across Cody retrievers. In our case, these ranking identity
 * would yield one identifier for every line of code affected by a context window.
 *
 * When combining the top ranked documents, we will make sure that no item is added twice (as
 * denoted by their referential equality).
 *
 * For an example, consider two retrievers that return results of line ranges within a code file:
 *
 *   - Set 1: [foo.ts#20-25, foo.ts#1-5]
 *   - Set 2: [foo.ts#3-7]
 *
 * The ranking identity function can now generate unique identifiers for every row that is being
 * retrieved, so we end up having the following IDs in this example:
 *
 *   - foo.ts#20-25 => [foo.ts:20, foo.ts:21, foo.ts:22, foo.ts:23, foo.ts:24, foo.ts:25]
 *   - foo.ts#1-5   => [foo.ts:1, foo.ts:2, foo.ts:3, foo.ts:4, foo.ts:5]
 *   - foo.ts#3-7   => [foo.ts:3, foo.ts:3, foo.ts:4, foo.ts:5, foo.ts:6, foo.ts:7]
 *
 * Based on this expanded set of "documents", we now apply RRF and find overlaps at the following
 * places:
 *
 *  - [foo.ts:3 foo.ts:4, foo.ts:5]
 *
 * RRF will now boost the rank for these three lins and when we reconcile the result set, we
 * will start by picking all ranges that overlap with the first line.
 */
export declare function fuseResults<T>(retrievedSets: Set<T>[], rankingIdentities: (result: T) => string[]): Set<T>;
//# sourceMappingURL=reciprocal-rank-fusion.d.ts.map