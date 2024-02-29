/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export interface DocumentContext extends DocumentDependentContext, LinesContext {
    position: vscode.Position;
    multilineTrigger: string | null;
    multilineTriggerPosition: vscode.Position | null;
    /**
     * A temporary workaround for the fact that we cannot modify `TextDocument` text.
     * Having these fields set on a `DocumentContext` means we can still get the full
     * document text in the `parse-completion` function with the "virtually" inserted
     * completion text.
     *
     * TODO(valery): we need a better abstraction that would allow us to mutate
     * the `TextDocument` text in memory without actually pasting it into the `TextDocument`
     * and that would not require copy-pasting and modifying the whole document text
     * on every completion update or new virtual completion creation.
     */
    injectedCompletionText?: string;
    positionWithoutInjectedCompletionText?: vscode.Position;
}
export interface DocumentDependentContext {
    prefix: string;
    suffix: string;
    /**
     * This is set when the document context is looking at the selected item in the
     * suggestion widget and injects the item into the prefix.
     */
    injectedPrefix: string | null;
}
interface GetCurrentDocContextParams {
    document: vscode.TextDocument;
    position: vscode.Position;
    maxPrefixLength: number;
    maxSuffixLength: number;
    context?: vscode.InlineCompletionContext;
    dynamicMultilineCompletions: boolean;
}
/**
 * Get the current document context based on the cursor position in the current document.
 */
export declare function getCurrentDocContext(params: GetCurrentDocContextParams): DocumentContext;
interface GetDerivedDocContextParams {
    languageId: string;
    position: vscode.Position;
    documentDependentContext: DocumentDependentContext;
    dynamicMultilineCompletions: boolean;
}
/**
 * Calculates `DocumentContext` based on the existing prefix and suffix.
 * Used if the document context needs to be calculated for the updated text but there's no `document` instance for that.
 */
export declare function getDerivedDocContext(params: GetDerivedDocContextParams): DocumentContext;
/**
 * Inserts a completion into a specific document context and computes the updated cursor position.
 *
 * This will insert the completion at the `position` outlined in the document context and will
 * replace the whole rest of the line with the completion. This means that if you have content in
 * the sameLineSuffix, it will be an empty string afterwards.
 *
 *
 * NOTE: This will always move the position to the _end_ of the line that the text was inserted at,
 *       regardless of whether the text was inserted before the sameLineSuffix.
 *
 *       When inserting `2` into: `f(1, █);`, the document context will look like this `f(1, 2);█`
 */
interface InsertIntoDocContextParams {
    docContext: DocumentContext;
    insertText: string;
    languageId: string;
    dynamicMultilineCompletions: boolean;
}
export declare function insertIntoDocContext(params: InsertIntoDocContextParams): DocumentContext;
export interface LinesContext {
    /** Text before the cursor on the same line. */
    currentLinePrefix: string;
    /** Text after the cursor on the same line. */
    currentLineSuffix: string;
    prevNonEmptyLine: string;
    nextNonEmptyLine: string;
}
export {};
//# sourceMappingURL=get-current-doc-context.d.ts.map