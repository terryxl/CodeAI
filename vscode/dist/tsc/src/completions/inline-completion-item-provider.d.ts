/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { AuthStatus } from '../chat/protocol';
import type { CodyStatusBar } from '../services/StatusBar';
import type { BfgRetriever } from './context/retrievers/bfg/bfg-retriever';
import { getInlineCompletions, type LastInlineCompletionCandidate } from './get-inline-completions';
import type { CompletionBookkeepingEvent, CompletionItemID, CompletionLogID } from './logger';
import type { ProviderConfig } from './providers/provider';
import { type AutocompleteItem } from './suggested-autocomplete-items-cache';
import type { ProvideInlineCompletionItemsTracer } from './tracer';
interface AutocompleteResult extends vscode.InlineCompletionList {
    logId: CompletionLogID;
    items: AutocompleteItem[];
    /** @deprecated */
    completionEvent?: CompletionBookkeepingEvent;
}
export interface CodyCompletionItemProviderConfig {
    providerConfig: ProviderConfig;
    statusBar: CodyStatusBar;
    tracer?: ProvideInlineCompletionItemsTracer | null;
    triggerNotice: ((notice: {
        key: string;
    }) => void) | null;
    isRunningInsideAgent?: boolean;
    authStatus: AuthStatus;
    isDotComUser?: boolean;
    createBfgRetriever?: () => BfgRetriever;
    formatOnAccept?: boolean;
    disableInsideComments?: boolean;
    completeSuggestWidgetSelection?: boolean;
}
export declare class InlineCompletionItemProvider implements vscode.InlineCompletionItemProvider, vscode.Disposable {
    private lastCompletionRequest;
    private lastManualCompletionTimestamp;
    private readonly config;
    private requestManager;
    private contextMixer;
    private smartThrottleService;
    /** Mockable (for testing only). */
    protected getInlineCompletions: typeof getInlineCompletions;
    /** Accessible for testing only. */
    protected lastCandidate: LastInlineCompletionCandidate | undefined;
    private lastAcceptedCompletionItem;
    private disposables;
    private isProbablyNewInstall;
    private firstCompletionDecoration;
    constructor({ completeSuggestWidgetSelection, formatOnAccept, disableInsideComments, tracer, createBfgRetriever, ...config }: CodyCompletionItemProviderConfig);
    /** Set the tracer (or unset it with `null`). */
    setTracer(value: ProvideInlineCompletionItemsTracer | null): void;
    private lastCompletionRequestTimestamp;
    provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token?: vscode.CancellationToken): Promise<AutocompleteResult | null>;
    /**
     * Callback to be called when the user accepts a completion. For VS Code, this is part of the
     * action inside the `AutocompleteItem`. Agent needs to call this callback manually.
     */
    handleDidAcceptCompletionItem(completionOrItemId: Pick<AutocompleteItem, 'range' | 'requestParams' | 'logId' | 'analyticsItem' | 'trackedRange'> | CompletionItemID): Promise<void>;
    /**
     * Handles showing a notification on the first completion acceptance.
     */
    private handleFirstCompletionOnboardingNotices;
    /**
     * Called when a suggestion is shown. This API is inspired by the proposed VS Code API of the
     * same name, it's prefixed with `unstable_` to avoid a clash when the new API goes GA.
     */
    unstable_handleDidShowCompletionItem(completionOrItemId: Pick<AutocompleteItem, 'logId' | 'analyticsItem' | 'span'> | CompletionItemID): void;
    /**
     * Called when the user partially accepts a completion. This API is inspired by the proposed VS
     * Code API of the same name, it's prefixed with `unstable_` to avoid a clash when the new API
     * goes GA.
     */
    private unstable_handleDidPartiallyAcceptCompletionItem;
    manuallyTriggerCompletion(): Promise<void>;
    /**
     * Handles when a completion item was rejected by the user.
     *
     * A completion item is marked as rejected/unwanted when:
     * - pressing backspace on a visible suggestion
     */
    private handleUnwantedCompletionItem;
    /**
     * The user no longer wishes to see the last candidate and requests a new completion. Note this
     * is reset by heuristics when new completion requests are triggered and completions are
     * rejected as a result of that.
     */
    clearLastCandidate(): void;
    /**
     * A callback that is called whenever an error happens. We do not want to flood a users UI with
     * error messages so every unexpected error is deduplicated by its message and rate limit errors
     * are only shown once during the rate limit period.
     */
    private onError;
    dispose(): void;
}
export {};
//# sourceMappingURL=inline-completion-item-provider.d.ts.map