/// <reference path="../../../../../src/fileUri.d.ts" />
import type { TextDocument } from 'vscode';
import type { Point, SyntaxNode } from 'web-tree-sitter';
import type { DocumentContext } from '../get-current-doc-context';
import { type ParsedCompletion } from './parse-completion';
interface CompletionContext {
    completion: ParsedCompletion;
    document: TextDocument;
    docContext: DocumentContext;
}
/**
 * Inserts missing closing brackets in the completion text.
 * This handles cases where a missing bracket breaks the incomplete parse-tree.
 */
export declare function insertMissingBrackets(text: string): string;
interface TruncateParsedCompletionResult {
    insertText: string;
    nodeToInsert?: SyntaxNode;
}
/**
 * Truncates the insert text of a parsed completion based on context.
 * Uses tree-sitter to walk the parse-tree with the inserted completion and truncate it.
 */
export declare function truncateParsedCompletion(context: CompletionContext): TruncateParsedCompletionResult;
export declare function findLastAncestorOnTheSameRow(root: SyntaxNode, position: Point): SyntaxNode | null;
export {};
//# sourceMappingURL=truncate-parsed-completion.d.ts.map