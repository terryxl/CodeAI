/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type CompletionIntent } from '../tree-sitter/query-sdk';
import type { DocumentContext } from './get-current-doc-context';
export declare function getCurrentLinePrefixWithoutInjectedPrefix(docContext: DocumentContext): string;
interface GetContextRangeParams {
    prefix: string;
    suffix: string;
    position: vscode.Position;
}
/**
 * @returns the range that overlaps the included prefix and suffix.
 */
export declare function getContextRange(document: vscode.TextDocument, params: GetContextRangeParams): vscode.Range;
interface GetCompletionIntentParams {
    document: vscode.TextDocument;
    position: vscode.Position;
    prefix: string;
}
export declare function getCompletionIntent(params: GetCompletionIntentParams): CompletionIntent | undefined;
export {};
//# sourceMappingURL=doc-context-getters.d.ts.map