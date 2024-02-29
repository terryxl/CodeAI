/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ChatClient, type ConfigurationWithAccessToken, type Guardrails } from '@sourcegraph/cody-shared';
import type { LocalEmbeddingsController } from '../../local-context/local-embeddings';
import type { SymfRunner } from '../../local-context/symf';
import { TreeViewProvider } from '../../services/TreeViewProvider';
import type { AuthStatus, ExtensionMessage } from '../protocol';
import type { SidebarViewOptions } from './SidebarViewController';
import { SimpleChatPanelProvider } from './SimpleChatPanelProvider';
import type { EnterpriseContextFactory } from '../../context/enterprise-context-factory';
export type ChatPanelConfig = Pick<ConfigurationWithAccessToken, 'experimentalGuardrails' | 'experimentalSymfContext' | 'internalUnstable' | 'useContext'>;
export interface ChatViewProviderWebview extends Omit<vscode.Webview, 'postMessage'> {
    postMessage(message: ExtensionMessage): Thenable<boolean>;
}
export declare class ChatPanelsManager implements vscode.Disposable {
    private chatClient;
    private readonly localEmbeddings;
    private readonly symf;
    private readonly enterpriseContext;
    private readonly guardrails;
    private activePanelProvider;
    private panelProviders;
    private options;
    treeViewProvider: TreeViewProvider;
    treeView: any;
    supportTreeViewProvider: TreeViewProvider;
    commandTreeViewProvider: TreeViewProvider;
    private currentAuthAccount;
    protected disposables: vscode.Disposable[];
    constructor({ extensionUri, ...options }: SidebarViewOptions, chatClient: ChatClient, localEmbeddings: LocalEmbeddingsController | null, symf: SymfRunner | null, enterpriseContext: EnterpriseContextFactory | null, guardrails: Guardrails);
    syncAuthStatus(authStatus: AuthStatus): Promise<void>;
    getChatPanel(): Promise<SimpleChatPanelProvider>;
    /**
     * Creates a new webview panel for chat.
     */
    createWebviewPanel(chatID?: string, chatQuestion?: string, panel?: vscode.WebviewPanel): Promise<SimpleChatPanelProvider>;
    /**
     * Creates a provider for the chat panel.
     */
    private createProvider;
    private selectTreeItem;
    private updateTreeViewHistory;
    editChatHistory(chatID: string, label: string): Promise<void>;
    clearHistory(chatID?: string): Promise<void>;
    /**
     * Clear the current chat view and start a new chat session in the active panel
     */
    resetPanel(): Promise<void>;
    restorePanel(chatID: string, chatQuestion?: string): Promise<SimpleChatPanelProvider | undefined>;
    private disposeProvider;
    private disposePanels;
    dispose(): void;
}
//# sourceMappingURL=ChatPanelsManager.d.ts.map