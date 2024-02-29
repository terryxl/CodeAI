/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ContextRetriever } from '../types';
import type { BfgRetriever } from './retrievers/bfg/bfg-retriever';
export type ContextStrategy = 'bfg' | 'jaccard-similarity' | 'new-jaccard-similarity' | 'bfg-mixed' | 'local-mixed' | 'none';
export interface ContextStrategyFactory extends vscode.Disposable {
    getStrategy(document: vscode.TextDocument): {
        name: ContextStrategy;
        retrievers: ContextRetriever[];
    };
}
export declare class DefaultContextStrategyFactory implements ContextStrategyFactory {
    private contextStrategy;
    private disposables;
    private localRetriever;
    private graphRetriever;
    constructor(contextStrategy: ContextStrategy, createBfgRetriever?: () => BfgRetriever);
    getStrategy(document: vscode.TextDocument): {
        name: ContextStrategy;
        retrievers: ContextRetriever[];
    };
    dispose(): void;
}
//# sourceMappingURL=context-strategy.d.ts.map