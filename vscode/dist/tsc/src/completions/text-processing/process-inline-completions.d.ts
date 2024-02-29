/// <reference path="../../../../../src/fileUri.d.ts" />
import { type Position, type TextDocument } from 'vscode';
import type { DocumentContext } from '../get-current-doc-context';
import type { ItemPostProcessingInfo } from '../logger';
import type { InlineCompletionItem } from '../types';
import { type ParsedCompletion } from './parse-completion';
interface ProcessInlineCompletionsParams {
    document: TextDocument;
    position: Position;
    docContext: DocumentContext;
}
export interface InlineCompletionItemWithAnalytics extends ItemPostProcessingInfo, InlineCompletionItem {
    stopReason?: string;
}
/**
 * This function implements post-processing logic that is applied regardless of
 * which provider is chosen.
 */
export declare function processInlineCompletions(items: ParsedCompletion[], params: ProcessInlineCompletionsParams): InlineCompletionItemWithAnalytics[];
interface ProcessItemParams {
    document: TextDocument;
    position: Position;
    docContext: DocumentContext;
}
export declare function processCompletion(completion: ParsedCompletion, params: ProcessItemParams): ParsedCompletion;
interface AdjustRangeToOverwriteOverlappingCharactersParams {
    position: Position;
    currentLineSuffix: string;
}
/**
 * Return a copy of item with an adjusted range to overwrite duplicative characters after the
 * completion on the first line.
 *
 * For example, with position `function sort(█)` and completion `array) {`, the range should be
 * adjusted to span the `)` so it is overwritten by the `insertText` (so that we don't end up with
 * the invalid `function sort(array) {)`).
 */
export declare function getRangeAdjustedForOverlappingCharacters(item: InlineCompletionItem, { position, currentLineSuffix }: AdjustRangeToOverwriteOverlappingCharactersParams): InlineCompletionItem['range'];
export declare function getMatchingSuffixLength(insertText: string, currentLineSuffix: string): number;
export {};
//# sourceMappingURL=process-inline-completions.d.ts.map