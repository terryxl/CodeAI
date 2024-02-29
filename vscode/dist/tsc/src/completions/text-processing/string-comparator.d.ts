/**
 * Compares string by editing distance algorithm, returns true
 * whenever string are almost the same, means that strings are
 * the same if we can apply less than MAX_NUMBER_EDITS to the stringA
 * to convert it to the stringB. There are three possible types of edit
 * - Substitution
 * - Insertion
 * - Deletion
 *
 * For more details see https://en.wikipedia.org/wiki/Levenshtein_distance
 */
export declare const isAlmostTheSameString: (stringA: string, stringB: string, percentage?: number) => boolean;
//# sourceMappingURL=string-comparator.d.ts.map