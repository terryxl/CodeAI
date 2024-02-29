/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export declare function getDocumentSections(doc: vscode.TextDocument, getFoldingRanges?: typeof defaultGetFoldingRanges, getSymbols?: typeof defaultGetSymbols): Promise<vscode.Range[]>;
/**
 * Gets the folding range containing the target position.
 * Target position that sits outside of any folding range will return undefined.
 *
 * NOTE: Use getSmartSelection from utils/index.ts instead
 */
export declare function getSelectionAroundLine(doc: vscode.TextDocument, line: number): Promise<vscode.Selection | undefined>;
/**
 * Finds the folding range containing the given target position.
 *
 * NOTE: exported for testing purposes only
 * @param ranges - The array of folding ranges to search.
 * @param targetLine - The position to find the containing range for.
 * @returns The folding range containing the target position, or undefined if not found.
 */
export declare function findRangeByLine(ranges: vscode.Range[], targetLine: number): vscode.Range | undefined;
declare function defaultGetSymbols(uri: vscode.Uri): Promise<vscode.SymbolInformation[]>;
declare function defaultGetFoldingRanges(uri: vscode.Uri): Promise<vscode.FoldingRange[]>;
export {};
//# sourceMappingURL=document-sections.d.ts.map