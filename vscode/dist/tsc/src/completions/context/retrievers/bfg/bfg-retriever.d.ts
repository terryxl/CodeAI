/// <reference path="../../../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ContextRetriever, ContextRetrieverOptions, ContextSnippet } from '../../../types';
export declare class BfgRetriever implements ContextRetriever {
    private context;
    identifier: string;
    private loadedBFG;
    private bfgIndexingPromise;
    private awaitIndexing;
    private didFailLoading;
    private indexedRepositoryRevisions;
    constructor(context: vscode.ExtensionContext);
    private indexWorkspace;
    private isWorkspaceIndexed;
    private indexRemainingWorkspaceFolders;
    private indexGitRepositories;
    private shouldInferGitRepositories;
    private indexInferredGitRepositories;
    private didChangeGitExtensionRepository;
    private didChangeSimpleRepository;
    private indexEntry;
    retrieve({ document, position, docContext, hints, }: ContextRetrieverOptions): Promise<ContextSnippet[]>;
    isSupportedForLanguageId(languageId: string): boolean;
    dispose(): void;
    private loadBFG;
    private doLoadBFG;
}
//# sourceMappingURL=bfg-retriever.d.ts.map