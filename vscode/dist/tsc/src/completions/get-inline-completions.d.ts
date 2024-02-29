/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { URI } from 'vscode-uri';
import type { CompletionIntent } from '../tree-sitter/query-sdk';
import type { ContextMixer } from './context/context-mixer';
import { type DocumentContext } from './get-current-doc-context';
import type { CompletionLogID } from './logger';
import type { ProviderConfig } from './providers/provider';
import type { RequestManager } from './request-manager';
import type { AutocompleteItem } from './suggested-autocomplete-items-cache';
import type { InlineCompletionItemWithAnalytics } from './text-processing/process-inline-completions';
import type { ProvideInlineCompletionsItemTraceData } from './tracer';
import type { SmartThrottleService } from './smart-throttle';
export interface InlineCompletionsParams {
    document: vscode.TextDocument;
    position: vscode.Position;
    triggerKind: TriggerKind;
    selectedCompletionInfo: vscode.SelectedCompletionInfo | undefined;
    docContext: DocumentContext;
    completionIntent?: CompletionIntent;
    lastAcceptedCompletionItem?: Pick<AutocompleteItem, 'requestParams' | 'analyticsItem'>;
    providerConfig: ProviderConfig;
    requestManager: RequestManager;
    contextMixer: ContextMixer;
    smartThrottleService: SmartThrottleService | null;
    isDotComUser: boolean;
    lastCandidate?: LastInlineCompletionCandidate;
    debounceInterval?: {
        singleLine: number;
        multiLine: number;
    };
    setIsLoading?: (isLoading: boolean) => void;
    abortSignal?: AbortSignal;
    tracer?: (data: Partial<ProvideInlineCompletionsItemTraceData>) => void;
    artificialDelay?: number;
    completeSuggestWidgetSelection?: boolean;
    handleDidAcceptCompletionItem?: (completion: Pick<AutocompleteItem, 'requestParams' | 'logId' | 'analyticsItem' | 'trackedRange'>) => void;
    handleDidPartiallyAcceptCompletionItem?: (completion: Pick<AutocompleteItem, 'logId' | 'analyticsItem'>, acceptedLength: number) => void;
}
/**
 * The last-suggested ghost text result, which can be reused if it is still valid.
 */
export interface LastInlineCompletionCandidate {
    /** The document URI for which this candidate was generated. */
    uri: URI;
    /** The doc context item */
    lastTriggerDocContext: DocumentContext;
    /** The position at which this candidate was generated. */
    lastTriggerPosition: vscode.Position;
    /** The selected info item. */
    lastTriggerSelectedCompletionInfo: vscode.SelectedCompletionInfo | undefined;
    /** The previously suggested result. */
    result: InlineCompletionsResult;
}
/**
 * The result of a call to {@link getInlineCompletions}.
 */
export interface InlineCompletionsResult {
    /** The unique identifier for logging this result. */
    logId: CompletionLogID;
    /** Where this result was generated from. */
    source: InlineCompletionsResultSource;
    /** The completions. */
    items: InlineCompletionItemWithAnalytics[];
}
/**
 * The source of the inline completions result.
 */
export declare enum InlineCompletionsResultSource {
    Network = "Network",
    Cache = "Cache",
    HotStreak = "HotStreak",
    CacheAfterRequestStart = "CacheAfterRequestStart",
    /**
     * The user is typing as suggested by the currently visible ghost text. For example, if the
     * user's editor shows ghost text `abc` ahead of the cursor, and the user types `ab`, the
     * original completion should be reused because it is still relevant.
     *
     * The last suggestion is passed in {@link InlineCompletionsParams.lastCandidate}.
     */
    LastCandidate = "LastCandidate"
}
/**
 * Extends the default VS Code trigger kind to distinguish between manually invoking a completion
 * via the keyboard shortcut and invoking a completion via hovering over ghost text.
 */
export declare enum TriggerKind {
    /** Completion was triggered explicitly by a user hovering over ghost text. */
    Hover = "Hover",
    /** Completion was triggered automatically while editing. */
    Automatic = "Automatic",
    /** Completion was triggered manually by the user invoking the keyboard shortcut. */
    Manual = "Manual",
    /** When the user uses the suggest widget to cycle through different completions. */
    SuggestWidget = "SuggestWidget"
}
export declare function getInlineCompletions(params: InlineCompletionsParams): Promise<InlineCompletionsResult | null>;
//# sourceMappingURL=get-inline-completions.d.ts.map