/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { CompletionIntent } from '../tree-sitter/query-sdk';
import type { ContextSummary } from './context/context-mixer';
import type { InlineCompletionsResultSource, TriggerKind } from './get-inline-completions';
import type { RequestParams } from './request-manager';
import type { InlineCompletionItemWithAnalytics } from './text-processing/process-inline-completions';
import type { Span } from '@opentelemetry/api';
export type CompletionAnalyticsID = string & {
    _opaque: typeof CompletionAnalyticsID;
};
declare const CompletionAnalyticsID: unique symbol;
export type CompletionLogID = string & {
    _opaque: typeof CompletionLogID;
};
declare const CompletionLogID: unique symbol;
export type CompletionItemID = string & {
    _opaque: typeof CompletionItemID;
};
declare const CompletionItemID: unique symbol;
interface InteractionIDPayload {
    /**
     * An ID to uniquely identify a suggest completion. Note: It is possible for this ID to be part
     * of two suggested events. This happens when the exact same completion text is shown again at
     * the exact same location. We count this as the same completion and thus use the same ID.
     */
    id: CompletionAnalyticsID | null;
}
interface SharedEventPayload extends InteractionIDPayload {
    /** Eventual Sourcegraph instance OpenTelemetry trace id */
    traceId?: string;
    /** Wether the completion is a singleline or multiline one. */
    multiline: boolean;
    /**
     * `null` means singleline, `block` means multiline.
     * @deprecated Use `multiline` instead.
     */
    multilineMode: null | 'block';
    /** Describes how the autocomplete request was triggered by the user. */
    triggerKind: TriggerKind;
    /** Information about what provider is used. e.g. `anthropic` or `fireworks`. */
    providerIdentifier: string;
    /** Information about which model was used. e.g. `starcoder-7b` or `claude-instant`. */
    providerModel: string;
    /** Language of the document being completed. */
    languageId: string;
    /** If we're inside a test file */
    testFile: boolean;
    /**
     * Information about the context retrieval process that lead to this autocomplete request. Refer
     * to the documentation of {@link ContextSummary}
     */
    contextSummary?: ContextSummary;
    /**
     * Information about the source of the completion (i.e wether it was fetched from network or
     * from a cache).
     */
    source?: InlineCompletionsResultSource;
    /** Eventual artificial delay that was used to throttle unwanted completions. */
    artificialDelay?: number;
    /**
     * Mapping the completion intent to a higher level abstractions of syntax nodes (e.g. function
     * declaration body)
     */
    completionIntent?: CompletionIntent;
    /** Information about the suggested items returned as part of this completions */
    items: CompletionItemInfo[];
    /** If true, another completion provider extension is enabled and the result might be poised */
    otherCompletionProviderEnabled: boolean;
    /** A list of known completion providers that are also enabled with this user. */
    otherCompletionProviders: string[];
}
/** Emitted when a completion is still present at a specific time interval after insertion */
interface PersistencePresentEventPayload {
    /** An ID to uniquely identify an accepted completion. */
    id: CompletionAnalyticsID;
    /** How many seconds after the acceptance was the check performed */
    afterSec: number;
    /** Levenshtein distance between the current document state and the accepted completion */
    difference: number;
    /** Number of lines still in the document */
    lineCount: number;
    /** Number of characters still in the document */
    charCount: number;
}
/** Emitted when a completion is no longer present at a specific time interval after insertion */
interface PersistenceRemovedEventPayload {
    /** An ID to uniquely identify an accepted completion. */
    id: CompletionAnalyticsID;
}
/** Emitted when a completion is formatted on accept */
interface FormatEventPayload {
    duration: number;
    languageId: string;
    formatter?: string;
}
export declare function logCompletionPersistencePresentEvent(params: PersistencePresentEventPayload): void;
export declare function logCompletionPersistenceRemovedEvent(params: PersistenceRemovedEventPayload): void;
export declare function logCompletionFormatEvent(params: FormatEventPayload): void;
/**
 * The following events are added to ensure the logging bookkeeping works as expected in production
 * and should not happen under normal circumstances.
 */
export declare function logCompletionBookkeepingEvent(name: 'acceptedUntrackedCompletion' | 'unexpectedNotLoaded' | 'unexpectedNotStarted' | 'unexpectedNotSuggested' | 'unexpectedAlreadySuggested' | 'containsOpeningTag' | 'synthesizedFromParallelRequest'): void;
export interface CompletionBookkeepingEvent {
    id: CompletionLogID;
    params: Omit<SharedEventPayload, 'items' | 'otherCompletionProviderEnabled' | 'otherCompletionProviders'>;
    startedAt: number;
    networkRequestStartedAt: number | null;
    startLoggedAt: number | null;
    loadedAt: number | null;
    suggestedAt: number | null;
    suggestionLoggedAt: number | null;
    suggestionAnalyticsLoggedAt: number | null;
    acceptedAt: number | null;
    items: CompletionItemInfo[];
    loggedPartialAcceptedLength: number;
}
export interface ItemPostProcessingInfo {
    parseErrorCount?: number;
    lineTruncatedCount?: number;
    truncatedWith?: 'tree-sitter' | 'indentation';
    nodeTypes?: {
        atCursor?: string;
        parent?: string;
        grandparent?: string;
        greatGrandparent?: string;
        lastAncestorOnTheSameLine?: string;
    };
    nodeTypesWithCompletion?: {
        atCursor?: string;
        parent?: string;
        grandparent?: string;
        greatGrandparent?: string;
        lastAncestorOnTheSameLine?: string;
    };
}
export interface CompletionItemInfo extends ItemPostProcessingInfo {
    lineCount: number;
    charCount: number;
    insertText?: string;
    stopReason?: string;
}
export declare function create(inputParams: Omit<CompletionBookkeepingEvent['params'], 'multilineMode' | 'type' | 'id'>): CompletionLogID;
export declare function start(id: CompletionLogID): void;
export declare function networkRequestStarted(id: CompletionLogID, contextSummary: ContextSummary | undefined): void;
export declare function loaded(id: CompletionLogID, params: RequestParams, items: InlineCompletionItemWithAnalytics[], source: InlineCompletionsResultSource, isDotComUser: boolean): void;
export declare function suggested(id: CompletionLogID, span?: Span): void;
export declare function accepted(id: CompletionLogID, document: vscode.TextDocument, completion: InlineCompletionItemWithAnalytics, trackedRange: vscode.Range | undefined, isDotComUser: boolean): void;
export declare function partiallyAccept(id: CompletionLogID, completion: InlineCompletionItemWithAnalytics, acceptedLength: number, isDotComUser: boolean): void;
/** @deprecated */
export declare function getCompletionEvent(id: CompletionLogID): CompletionBookkeepingEvent | undefined;
export declare function noResponse(id: CompletionLogID): void;
/**
 * This callback should be triggered whenever VS Code tries to highlight a new completion and it's
 * used to measure how long previous completions were visible.
 */
export declare function flushActiveSuggestionRequests(): void;
export declare function reset_testOnly(): void;
export declare function logError(error: Error): void;
export {};
//# sourceMappingURL=logger.d.ts.map