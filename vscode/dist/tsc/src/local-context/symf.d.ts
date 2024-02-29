/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type FileURI, type IndexedKeywordContextFetcher, type Result, type SourcegraphCompletionsClient } from '@sourcegraph/cody-shared';
export declare class SymfRunner implements IndexedKeywordContextFetcher, vscode.Disposable {
    private context;
    private sourcegraphServerEndpoint;
    private authToken;
    private completionsClient;
    private indexRoot;
    private indexLocks;
    private status;
    constructor(context: vscode.ExtensionContext, sourcegraphServerEndpoint: string | null, authToken: string | null, completionsClient: SourcegraphCompletionsClient);
    dispose(): void;
    onIndexStart(cb: (e: IndexStartEvent) => void): vscode.Disposable;
    onIndexEnd(cb: (e: IndexEndEvent) => void): vscode.Disposable;
    setSourcegraphAuth(endpoint: string | null, authToken: string | null): void;
    private getSymfInfo;
    getResults(userQuery: string, scopeDirs: vscode.Uri[]): Promise<Promise<Result[]>[]>;
    /**
     * Returns the list of results from symf for a single directory scope.
     * @param keywordQuery is a promise, because query expansion might be an expensive
     * operation that is best done concurrently with querying and (re)building the index.
     */
    private getResultsForScopeDir;
    deleteIndex(scopeDir: FileURI): Promise<void>;
    getIndexStatus(scopeDir: FileURI): Promise<'unindexed' | 'indexing' | 'ready' | 'failed'>;
    ensureIndex(scopeDir: FileURI, options?: {
        hard: boolean;
    }): Promise<void>;
    private getIndexLock;
    private unsafeRunQuery;
    private unsafeDeleteIndex;
    private unsafeIndexExists;
    private unsafeEnsureIndex;
    private getIndexDir;
    private unsafeUpsertIndex;
    private _unsafeUpsertIndex;
    /**
     * Helpers for tracking index failure
     */
    private markIndexFailed;
    private didIndexFail;
    private clearIndexFailure;
}
export interface IndexStartEvent {
    scopeDir: FileURI;
    cancel: () => void;
    done: Promise<void>;
}
interface IndexEndEvent {
    scopeDir: FileURI;
}
export {};
//# sourceMappingURL=symf.d.ts.map