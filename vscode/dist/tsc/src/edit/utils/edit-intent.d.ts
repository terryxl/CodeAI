/// <reference path="../../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { EditIntent } from '../types';
/**
 * Checks if the current selection and editor represent a generate intent.
 * A generate intent means the user has an empty selection on an empty line.
 */
export declare function isGenerateIntent(document: vscode.TextDocument, selection: vscode.Selection | vscode.Range): boolean;
export declare function getEditIntent(document: vscode.TextDocument, selection: vscode.Selection | vscode.Range, proposedIntent?: EditIntent): EditIntent;
//# sourceMappingURL=edit-intent.d.ts.map