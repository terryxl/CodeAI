/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { DocumentContext } from './get-current-doc-context';
import type { CompletionItemID, CompletionLogID } from './logger';
import type { RequestParams } from './request-manager';
import type { InlineCompletionItemWithAnalytics } from './text-processing/process-inline-completions';
import type { Span } from '@opentelemetry/api';
interface AutocompleteItemParams {
    insertText: string | vscode.SnippetString;
    logId: CompletionLogID;
    range: vscode.Range;
    trackedRange: vscode.Range;
    requestParams: RequestParams;
    completionItem: InlineCompletionItemWithAnalytics;
    command?: vscode.Command;
    span?: Span;
}
export declare class AutocompleteItem extends vscode.InlineCompletionItem {
    /**
     * An ID used to track this particular completion item. This is used mainly for the Agent which,
     * given it's JSON RPC interface, needs to be able to identify the completion item and can not
     * rely on the object reference like the VS Code API can. This allows us to simplify external
     * API's that require the completion item to only have an ID.
     */
    id: CompletionItemID;
    /**
     * An ID used to track the completion request lifecycle. This is used for completion analytics
     * bookkeeping.
     */
    logId: CompletionLogID;
    /**
     * The range needed for tracking the completion after inserting. This is needed because the
     * actual insert range might overlap with content that is already in the document since we set
     * it to always start with the current line beginning in VS Code.
     *
     * TODO: Remove the need for making having this typed as undefined.
     */
    trackedRange: vscode.Range | undefined;
    /**
     * The request params used to fetch the completion item.
     */
    requestParams: RequestParams;
    /**
     * The completion item used for analytics perspectives. This one is the raw completion without
     * the VS Code specific changes applied via processInlineCompletionsForVSCode.
     */
    analyticsItem: InlineCompletionItemWithAnalytics;
    /**
     * Eventual Open Telemetry span associated with the completion request
     */
    span: Span | undefined;
    constructor(params: AutocompleteItemParams);
}
export interface AutocompleteInlineAcceptedCommandArgs {
    codyCompletion: AutocompleteItem;
}
declare class SuggestedAutocompleteItemsCache {
    private cache;
    get<T extends object>(completionOrItemId: CompletionItemID | T): AutocompleteItem | T | undefined;
    add(item: AutocompleteItem): void;
}
export declare const suggestedAutocompleteItemsCache: SuggestedAutocompleteItemsCache;
/**
 * Convert `InlineCompletionItemWithAnalytics` to `AutocompleteItem` suitable for bookkeeping
 * in completion provider callbacks like `show` and `accept`.
 */
export declare function analyticsItemToAutocompleteItem(logId: CompletionLogID, document: vscode.TextDocument, docContext: DocumentContext, position: vscode.Position, items: InlineCompletionItemWithAnalytics[], context: vscode.InlineCompletionContext, span: Span): AutocompleteItem[];
/**
 * Adjust the completion insert text and range to start from beginning of the current line
 * (instead of starting at the given position). This avoids UI jitter in VS Code; when
 * typing or deleting individual characters, VS Code reuses the existing completion
 * while it waits for the new one to come in.
 */
export declare function updateInsertRangeForVSCode(items: AutocompleteItem[]): AutocompleteItem[];
export {};
//# sourceMappingURL=suggested-autocomplete-items-cache.d.ts.map