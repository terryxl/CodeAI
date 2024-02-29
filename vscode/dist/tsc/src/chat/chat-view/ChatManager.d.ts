/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ChatClient, type Guardrails } from '@sourcegraph/cody-shared';
import type { View } from '../../../webviews/NavBar';
import type { LocalEmbeddingsController } from '../../local-context/local-embeddings';
import type { SymfRunner } from '../../local-context/symf';
import type { AuthStatus } from '../protocol';
import { SidebarViewController, type SidebarViewOptions } from './SidebarViewController';
import type { ChatSession } from './SimpleChatPanelProvider';
import type { ExecuteChatArguments } from '../../commands/execute/ask';
import type { EnterpriseContextFactory } from '../../context/enterprise-context-factory';
export declare const CodyChatPanelViewType = "cody.chatPanel";
/**
 * Manages the sidebar webview for auth/onboarding.
 *
 * TODO(sqs): rename from its legacy name ChatManager
 */
export declare class ChatManager implements vscode.Disposable {
    private chatClient;
    private enterpriseContext;
    private localEmbeddings;
    private symf;
    private guardrails;
    sidebarViewController: SidebarViewController;
    private chatPanelsManager;
    private options;
    private disposables;
    constructor({ extensionUri, ...options }: SidebarViewOptions, chatClient: ChatClient, enterpriseContext: EnterpriseContextFactory | null, localEmbeddings: LocalEmbeddingsController | null, symf: SymfRunner | null, guardrails: Guardrails);
    private getChatProvider;
    syncAuthStatus(authStatus: AuthStatus): Promise<void>;
    setWebviewView(view: View): Promise<void>;
    /**
     * Execute a chat request in a new chat panel
     */
    executeChat(args: ExecuteChatArguments): Promise<ChatSession | undefined>;
    private editChatHistory;
    private clearHistory;
    /**
     * Export chat history to file system
     */
    private exportHistory;
    revive(panel: vscode.WebviewPanel, chatID: string): Promise<void>;
    triggerNotice(notice: {
        key: string;
    }): Promise<void>;
    /**
     * See docstring for {@link CODY_PASSTHROUGH_VSCODE_OPEN_COMMAND_ID}.
     */
    private passthroughVsCodeOpen;
    private disposeChatPanelsManager;
    private createNewWebviewPanel;
    private restorePanel;
    dispose(): void;
}
/**
 * Set HTML for webview (panel) & webview view (sidebar)
 */
export declare function addWebviewViewHTML(extensionUri: vscode.Uri, view: vscode.WebviewView | vscode.WebviewPanel): Promise<void>;
//# sourceMappingURL=ChatManager.d.ts.map