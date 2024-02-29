/// <reference path="../../../../../src/fileUri.d.ts" />
import type { URI } from 'vscode-uri';
import * as vscode from 'vscode';
/**
 * Gets folding ranges for the given URI.
 * @param uri - The URI of the document to get folding ranges for.
 * @param type - Optional type of folding ranges to get. Can be 'imports', 'comment' or 'all'. Default 'all'.
 * @param getLastItem - Optional boolean whether to only return the last range of the given type. Default false.
 * @returns A promise resolving to the array of folding ranges, or undefined if none.
 *
 * This calls the built-in VS Code folding range provider to get folding ranges for the given URI.
 * It can filter the results to only return ranges of a certain type, like imports or comments.
 * The getLastItem flag returns just the last range of the given type.
 */
export declare function getFoldingRanges(uri: URI, type?: 'imports' | 'comment' | 'all', getLastItem?: boolean): Promise<vscode.FoldingRange[] | undefined>;
//# sourceMappingURL=folding-range.d.ts.map