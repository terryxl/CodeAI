/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { EditIntent } from '../types';
interface SmartSelectionOptions {
    forceExpand?: boolean;
}
/**
 * This function retrieves a "smart" selection for a FixupTask when selectionRange is not available.
 *
 * The idea of a "smart" selection is to look at both the start and end positions of the current selection,
 * and attempt to expand those positions to encompass more meaningful chunks of code, such as folding regions.
 *
 * The function does the following:
 * 1. Finds the document URI from it's fileName
 * 2. If the selection starts in a folding range, moves the selection start position back to the start of that folding range.
 * 3. If the selection ends in a folding range, moves the selection end positionforward to the end of that folding range.
 * @returns A Promise that resolves to an `vscode.Range` which represents the combined "smart" selection.
 */
export declare function getEditSmartSelection(document: vscode.TextDocument, selectionRange: vscode.Range, { forceExpand }?: SmartSelectionOptions, intent?: EditIntent): Promise<vscode.Range>;
/**
 * Expands the selection to encompass as much of the document as we can include as context to the LLM.
 */
export declare function getEditMaximumSelection(document: vscode.TextDocument, selectionRange: vscode.Range): vscode.Range;
/**
 * Expands the selection to include all non-whitespace characters from the selected lines.
 * This is to help produce consistent edits regardless of user behaviour.
 */
export declare function getEditLineSelection(document: vscode.TextDocument, selection: vscode.Range): vscode.Range;
export {};
//# sourceMappingURL=edit-selection.d.ts.map