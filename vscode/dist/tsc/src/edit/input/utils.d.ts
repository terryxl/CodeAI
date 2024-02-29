/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ContextFile } from '@sourcegraph/cody-shared';
/**
 * Removes the string after the last '@' character in the given string.
 * Returns the original string if '@' is not found.
 */
export declare function removeAfterLastAt(str: string): string;
/**
 * Returns a string representation of the given ContextFile for use in UI labels.
 * Includes the file path and an optional range or symbol specifier.
 */
export declare function getLabelForContextFile(file: ContextFile): string;
/**
 * Returns a string representation of the given range, formatted as "{startLine}:{endLine}".
 * If startLine and endLine are the same, returns just the line number.
 */
export declare function getTitleRange(range: vscode.Range): string;
/**
 * Returns the label for the given QuickPickItem, stripping any
 * prefixes used internally to track state.
 */
export declare function getItemLabel(item: vscode.QuickPickItem): string;
export declare function fetchDocumentSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]>;
//# sourceMappingURL=utils.d.ts.map