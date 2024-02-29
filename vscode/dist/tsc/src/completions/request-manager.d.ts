/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { DocumentContext } from './get-current-doc-context';
import { InlineCompletionsResultSource } from './get-inline-completions';
import type { CompletionProviderTracer, Provider } from './providers/provider';
import { type InlineCompletionItemWithAnalytics } from './text-processing/process-inline-completions';
import type { ContextSnippet } from './types';
export interface RequestParams {
    /** The request's document */
    document: vscode.TextDocument;
    /** The request's document context */
    docContext: DocumentContext;
    /** The state of the completion info box */
    selectedCompletionInfo: vscode.SelectedCompletionInfo | undefined;
    /** The cursor position in the source file where the completion request was triggered. */
    position: vscode.Position;
    /** The abort signal for the request. */
    abortSignal?: AbortSignal;
}
export interface RequestManagerResult {
    completions: InlineCompletionItemWithAnalytics[];
    source: InlineCompletionsResultSource;
}
interface RequestsManagerParams {
    requestParams: RequestParams;
    provider: Provider;
    context: ContextSnippet[];
    isCacheEnabled: boolean;
    tracer?: CompletionProviderTracer;
}
/**
 * This class can handle concurrent requests for code completions. The idea is
 * that requests are not cancelled even when the user continues typing in the
 * document. This allows us to cache the results of expensive completions and
 * return them when the user triggers a completion again.
 *
 * It also retests the request against the completion result of an inflight
 * request that just resolved and uses the last candidate logic to synthesize
 * completions if possible.
 */
export declare class RequestManager {
    private cache;
    private readonly inflightRequests;
    private latestRequestParams;
    checkCache(params: Pick<RequestsManagerParams, 'requestParams' | 'isCacheEnabled'>): RequestManagerResult | null;
    request(params: RequestsManagerParams): Promise<RequestManagerResult>;
    removeFromCache(params: RequestParams): void;
    /**
     * Test if the result can be used for inflight requests. This only works
     * if a completion is a forward-typed version of a previous completion.
     */
    private testIfResultCanBeRecycledForInflightRequests;
    private cancelIrrelevantRequests;
}
export declare function computeIfRequestStillRelevant(currentRequest: Pick<RequestParams, 'docContext'> & {
    document: {
        uri: vscode.Uri;
    };
}, previousRequest: Pick<RequestParams, 'docContext'> & {
    document: {
        uri: vscode.Uri;
    };
}, completions: InlineCompletionItemWithAnalytics[] | null): boolean;
export {};
//# sourceMappingURL=request-manager.d.ts.map