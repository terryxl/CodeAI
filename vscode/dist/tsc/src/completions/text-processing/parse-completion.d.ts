/// <reference path="../../../../../src/fileUri.d.ts" />
import { type TextDocument } from 'vscode';
import type { Point, Tree } from 'web-tree-sitter';
import type { DocumentContext } from '../get-current-doc-context';
import type { InlineCompletionItem } from '../types';
import { type InlineCompletionItemWithAnalytics } from './process-inline-completions';
interface CompletionContext {
    completion: InlineCompletionItem;
    document: TextDocument;
    docContext: DocumentContext;
}
export interface ParsedCompletion extends InlineCompletionItemWithAnalytics {
    tree?: Tree;
    parseErrorCount?: number;
    points?: {
        start: Point;
        end: Point;
        trigger?: Point;
    };
}
/**
 * Parses an inline code completion item using Tree-sitter and determines if the completion
 * would introduce any syntactic errors.
 */
export declare function parseCompletion(context: CompletionContext): ParsedCompletion;
export declare function dropParserFields(completion: ParsedCompletion): InlineCompletionItemWithAnalytics;
export {};
//# sourceMappingURL=parse-completion.d.ts.map