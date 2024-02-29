/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { CodebaseContext, type ConfigurationWithAccessToken, type ContextGroup, type ContextStatusProvider, type IndexedKeywordContextFetcher } from '@sourcegraph/cody-shared';
import type { VSCodeEditor } from '../editor/vscode-editor';
import type { LocalEmbeddingsController } from '../local-context/local-embeddings';
import type { AuthProvider } from '../services/AuthProvider';
import type { SidebarChatWebview } from './chat-view/SidebarViewController';
import type { RemoteSearch } from '../context/remote-search';
export type Config = Pick<ConfigurationWithAccessToken, 'codebase' | 'serverEndpoint' | 'debugEnable' | 'debugFilter' | 'debugVerbose' | 'customHeaders' | 'accessToken' | 'useContext' | 'codeActions' | 'experimentalGuardrails' | 'commandCodeLenses' | 'experimentalSimpleChatContext' | 'experimentalSymfContext' | 'editorTitleCommandIcon' | 'internalUnstable'>;
export declare class ContextProvider implements vscode.Disposable, ContextStatusProvider {
    config: Omit<Config, 'codebase'>;
    private editor;
    private symf;
    private authProvider;
    readonly localEmbeddings: LocalEmbeddingsController | undefined;
    private readonly remoteSearch;
    webview?: SidebarChatWebview;
    configurationChangeEvent: vscode.EventEmitter<void>;
    currentWorkspaceRoot: vscode.Uri | undefined;
    protected disposables: vscode.Disposable[];
    private statusAggregator;
    private statusEmbeddings;
    private codebaseContext;
    constructor(config: Omit<Config, 'codebase'>, // should use codebaseContext.getCodebase() rather than config.codebase
    editor: VSCodeEditor, symf: IndexedKeywordContextFetcher | undefined, authProvider: AuthProvider, localEmbeddings: LocalEmbeddingsController | undefined, remoteSearch: RemoteSearch | undefined);
    get context(): CodebaseContext;
    init(): Promise<void>;
    onConfigurationChange(newConfig: Config): Promise<void>;
    forceUpdateCodebaseContext(): Promise<void>;
    private updateCodebaseContext;
    /**
     * Save, verify, and sync authStatus between extension host and webview
     * activate extension when user has valid login
     */
    syncAuthStatus(): Promise<void>;
    /**
     * Publish the config to the webview.
     */
    private publishConfig;
    dispose(): void;
    private contextStatusChangeEmitter;
    get status(): ContextGroup[];
    onDidChangeStatus(callback: (provider: ContextStatusProvider) => void): vscode.Disposable;
}
//# sourceMappingURL=ContextProvider.d.ts.map