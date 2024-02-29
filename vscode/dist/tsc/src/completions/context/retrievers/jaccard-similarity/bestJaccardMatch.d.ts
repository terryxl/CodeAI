export interface JaccardMatch {
    score: number;
    content: string;
    startLine: number;
    endLine: number;
}
type WordOccurrences = Map<string, number>;
/**
 * Finds the window from matchText with the highest Jaccard similarity to the targetText.
 *
 * The Jaccard similarity is the ratio of the number of words that are common to both texts
 * to the number of words that are unique to either text.
 * @param targetText is the text that serves as the target we are trying to find a match for
 * @param matchText is the text we are sliding our window through to find the best match
 * @param windowSize is the size of the match window in number of lines
 * @param maxMatches is the maximum number of matches to return
 */
export declare function bestJaccardMatches(targetText: string, matchText: string, windowSize: number, maxMatches: number): JaccardMatch[];
export declare function getWordOccurrences(s: string): WordOccurrences;
export {};
//# sourceMappingURL=bestJaccardMatch.d.ts.map