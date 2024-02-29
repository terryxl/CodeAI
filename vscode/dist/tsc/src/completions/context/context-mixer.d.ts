/// <reference path="../../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { DocumentContext } from '../get-current-doc-context';
import type { ContextSnippet } from '../types';
import type { ContextStrategy, ContextStrategyFactory } from './context-strategy';
interface GetContextOptions {
    document: vscode.TextDocument;
    position: vscode.Position;
    docContext: DocumentContext;
    abortSignal?: AbortSignal;
    maxChars: number;
}
export interface ContextSummary {
    /** Name of the strategy being used */
    strategy: ContextStrategy;
    /** Total duration of the context retrieval phase */
    duration: number;
    /** Total characters of combined context snippets */
    totalChars: number;
    /** Detailed information for each retriever that has run */
    retrieverStats: {
        [identifier: string]: {
            /** Number of items that are ended up being suggested to be used by the context mixer */
            suggestedItems: number;
            /** Number of total snippets */
            retrievedItems: number;
            /** Duration of the individual retriever */
            duration: number;
            /**
             * A bitmap that indicates at which position in the result set an entry from the given
             * retriever is included. It only includes information about the first 32 entries.
             *
             * The lowest bit indicates if the first entry is included, the second lowest bit
             * indicates if the second entry is included, and so on.
             */
            positionBitmap: number;
        };
    };
}
export interface GetContextResult {
    context: ContextSnippet[];
    logSummary: ContextSummary;
}
/**
 * The context mixer is responsible for combining multiple context retrieval strategies into a
 * single proposed context list.
 *
 * This is done by ranking the order of documents using reciprocal rank fusion and then combining
 * the snippets from each retriever into a single list using top-k (so we will pick all returned
 * ranged for the top ranked document from all retrieval sources before we move on to the second
 * document).
 */
export declare class ContextMixer implements vscode.Disposable {
    private strategyFactory;
    constructor(strategyFactory: ContextStrategyFactory);
    getContext(options: GetContextOptions): Promise<GetContextResult>;
    dispose(): void;
}
export {};
//# sourceMappingURL=context-mixer.d.ts.map