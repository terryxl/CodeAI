/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ConfigurationWithAccessToken, type ContextGroup, type ContextStatusProvider, type EmbeddingsSearchResult, type LocalEmbeddingsFetcher } from '@sourcegraph/cody-shared';
export declare function createLocalEmbeddingsController(context: vscode.ExtensionContext, config: LocalEmbeddingsConfig): LocalEmbeddingsController;
export type LocalEmbeddingsConfig = Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'accessToken'> & {
    testingLocalEmbeddingsModel: string | undefined;
    testingLocalEmbeddingsEndpoint: string | undefined;
    testingLocalEmbeddingsIndexLibraryPath: string | undefined;
};
export declare class LocalEmbeddingsController implements LocalEmbeddingsFetcher, ContextStatusProvider, vscode.Disposable {
    private readonly context;
    private disposables;
    private readonly model;
    private readonly endpoint;
    private readonly indexLibraryPath;
    private service;
    private serviceStarted;
    private accessToken;
    private endpointIsDotcom;
    private lastRepo;
    private lastHealth;
    private lastError;
    private repoState;
    private dirBeingIndexed;
    private statusBar;
    private readonly changeEmitter;
    constructor(context: vscode.ExtensionContext, config: LocalEmbeddingsConfig);
    dispose(): void;
    get onChange(): vscode.Event<LocalEmbeddingsController>;
    start(): Promise<void>;
    setAccessToken(serverEndpoint: string, token: string | null): Promise<void>;
    private getService;
    private spawnAndBindService;
    private loadAfterIndexing;
    private statusEmitter;
    onDidChangeStatus(callback: (provider: ContextStatusProvider) => void): vscode.Disposable;
    get status(): ContextGroup[];
    index(): Promise<void>;
    indexRetry(): Promise<void>;
    private indexRequest;
    load(repoDir: vscode.Uri | undefined): Promise<boolean>;
    private eagerlyLoad;
    private onHealthReport;
    private getNeedsEmbeddingText;
    private updateIssueStatusBar;
    private resolveIssueCommand;
    /** {@link LocalEmbeddingsFetcher.getContext} */
    getContext(query: string, _numResults: number): Promise<EmbeddingsSearchResult[]>;
}
//# sourceMappingURL=local-embeddings.d.ts.map