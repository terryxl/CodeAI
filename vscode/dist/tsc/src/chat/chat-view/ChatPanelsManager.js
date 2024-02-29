"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanelsManager = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../../log");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const TreeViewProvider_1 = require("../../services/TreeViewProvider");
const ChatHistoryManager_1 = require("./ChatHistoryManager");
const ChatManager_1 = require("./ChatManager");
const SimpleChatPanelProvider_1 = require("./SimpleChatPanelProvider");
const types_1 = require("@sourcegraph/cody-shared/src/models/types");
class ChatPanelsManager {
    chatClient;
    localEmbeddings;
    symf;
    enterpriseContext;
    guardrails;
    // Chat views in editor panels
    activePanelProvider = undefined;
    panelProviders = [];
    options;
    // Tree view for chat history
    treeViewProvider = new TreeViewProvider_1.TreeViewProvider('chat', cody_shared_1.featureFlagProvider);
    treeView;
    supportTreeViewProvider = new TreeViewProvider_1.TreeViewProvider('support', cody_shared_1.featureFlagProvider);
    commandTreeViewProvider = new TreeViewProvider_1.TreeViewProvider('command', cody_shared_1.featureFlagProvider);
    // We keep track of the currently authenticated account and dispose open chats when it changes
    currentAuthAccount;
    disposables = [];
    constructor({ extensionUri, ...options }, chatClient, localEmbeddings, symf, enterpriseContext, guardrails) {
        this.chatClient = chatClient;
        this.localEmbeddings = localEmbeddings;
        this.symf = symf;
        this.enterpriseContext = enterpriseContext;
        this.guardrails = guardrails;
        (0, log_1.logDebug)('ChatPanelsManager:constructor', 'init');
        this.options = {
            treeView: this.treeViewProvider,
            extensionUri,
            featureFlagProvider: cody_shared_1.featureFlagProvider,
            ...options,
        };
        // Create treeview
        this.treeView = vscode.window.createTreeView('cody.chat.tree.view', {
            treeDataProvider: this.treeViewProvider,
        });
        this.disposables.push(this.treeViewProvider);
        this.disposables.push(this.treeView);
        // Register Tree View
        this.disposables.push(vscode.window.registerTreeDataProvider('cody.chat.tree.view', this.treeViewProvider), vscode.window.registerTreeDataProvider('cody.support.tree.view', this.supportTreeViewProvider), vscode.window.registerTreeDataProvider('cody.commands.tree.view', this.commandTreeViewProvider), vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (event.affectsConfiguration('cody')) {
                await this.commandTreeViewProvider.refresh();
            }
        }));
    }
    async syncAuthStatus(authStatus) {
        const hasLoggedOut = !authStatus.isLoggedIn;
        const hasSwitchedAccount = this.currentAuthAccount && this.currentAuthAccount.endpoint !== authStatus.endpoint;
        if (hasLoggedOut || hasSwitchedAccount) {
            this.disposePanels();
        }
        this.currentAuthAccount = {
            endpoint: authStatus.endpoint ?? '',
            primaryEmail: authStatus.primaryEmail,
            username: authStatus.username,
        };
        await vscode.commands.executeCommand('setContext', ChatManager_1.CodyChatPanelViewType, authStatus.isLoggedIn);
        await this.updateTreeViewHistory();
        this.supportTreeViewProvider.syncAuthStatus(authStatus);
    }
    async getChatPanel() {
        const provider = await this.createWebviewPanel();
        if (this.options.config.isRunningInsideAgent) {
            // Never reuse webviews when running inside the agent.
            return provider;
        }
        // Check if any existing panel is available
        return this.activePanelProvider || provider;
    }
    /**
     * Creates a new webview panel for chat.
     */
    async createWebviewPanel(chatID, chatQuestion, panel) {
        if (chatID && this.panelProviders.map(p => p.sessionID).includes(chatID)) {
            const provider = this.panelProviders.find(p => p.sessionID === chatID);
            if (provider?.webviewPanel) {
                provider.webviewPanel?.reveal();
                this.activePanelProvider = provider;
                void this.selectTreeItem(chatID);
                return provider;
            }
        }
        // Reuse existing "New Chat" panel if there is an empty one
        const emptyNewChatProvider = this.panelProviders.find(p => p.webviewPanel?.title === 'New Chat');
        if (!this.options.config.isRunningInsideAgent && // Don't reuse panels in the agent
            !chatID &&
            !panel &&
            this.panelProviders.length &&
            emptyNewChatProvider) {
            emptyNewChatProvider.webviewPanel?.reveal();
            this.activePanelProvider = emptyNewChatProvider;
            this.options.contextProvider.webview = emptyNewChatProvider.webview;
            void this.selectTreeItem(emptyNewChatProvider.sessionID);
            return emptyNewChatProvider;
        }
        (0, log_1.logDebug)('ChatPanelsManager:createWebviewPanel', this.panelProviders.length.toString());
        // Get the view column of the current active chat panel so that we can open a new one on top of it
        const activePanelViewColumn = this.activePanelProvider?.webviewPanel?.viewColumn;
        const provider = this.createProvider();
        if (chatID) {
            await provider.restoreSession(chatID);
        }
        else {
            await provider.newSession();
        }
        // Revives a chat panel provider for a given webview panel and session ID.
        // Restores any existing session data. Registers handlers for view state changes and dispose events.
        if (panel) {
            await provider.revive(panel);
        }
        else {
            await provider.createWebviewPanel(activePanelViewColumn, chatID, chatQuestion);
        }
        const sessionID = chatID || provider.sessionID;
        provider.webviewPanel?.onDidChangeViewState(e => {
            if (e.webviewPanel.visible && e.webviewPanel.active) {
                this.activePanelProvider = provider;
                this.options.contextProvider.webview = provider.webview;
                void this.selectTreeItem(provider.sessionID);
            }
        });
        provider.webviewPanel?.onDidDispose(() => {
            this.disposeProvider(sessionID);
        });
        this.activePanelProvider = provider;
        this.panelProviders.push(provider);
        // Selects the corresponding tree view item.
        this.selectTreeItem(sessionID);
        return provider;
    }
    /**
     * Creates a provider for the chat panel.
     */
    createProvider() {
        const authProvider = this.options.authProvider;
        const authStatus = authProvider.getAuthStatus();
        if (authStatus?.configOverwrites?.chatModel) {
            cody_shared_1.ModelProvider.add(new cody_shared_1.ModelProvider(authStatus.configOverwrites.chatModel, [
                types_1.ModelUsage.Chat,
                // TODO: Add configOverwrites.editModel for separate edit support
                types_1.ModelUsage.Edit,
            ]));
        }
        const models = cody_shared_1.ModelProvider.get(types_1.ModelUsage.Chat, authStatus.endpoint);
        const isConsumer = authProvider.getAuthStatus().isDotCom;
        return new SimpleChatPanelProvider_1.SimpleChatPanelProvider({
            ...this.options,
            config: this.options.contextProvider.config,
            chatClient: this.chatClient,
            localEmbeddings: isConsumer ? this.localEmbeddings : null,
            symf: isConsumer ? this.symf : null,
            enterpriseContext: isConsumer ? null : this.enterpriseContext,
            models,
            guardrails: this.guardrails,
        });
    }
    selectTreeItem(chatID) {
        // no op if tree view is not visible
        if (!this.treeView.visible) {
            return;
        }
        // Highlights the chat item in tree view
        // This will also open the tree view (sidebar)
        const chat = this.treeViewProvider.getTreeItemByID(chatID);
        if (chat) {
            void this.treeView?.reveal(chat, { select: true, focus: false });
        }
    }
    async updateTreeViewHistory() {
        await this.treeViewProvider.updateTree(this.options.authProvider.getAuthStatus());
    }
    async editChatHistory(chatID, label) {
        await vscode.window
            .showInputBox({
            prompt: 'Enter new chat name',
            value: label,
        })
            .then(async (title) => {
            const authProvider = this.options.authProvider;
            const authStatus = authProvider.getAuthStatus();
            const history = ChatHistoryManager_1.chatHistory.getChat(authStatus, chatID);
            if (title && history) {
                history.chatTitle = title;
                await ChatHistoryManager_1.chatHistory.saveChat(authStatus, history);
                await this.updateTreeViewHistory();
                const chatIDUTC = new Date(chatID).toUTCString();
                const provider = this.panelProviders.find(p => p.sessionID === chatID) ||
                    this.panelProviders.find(p => p.sessionID === chatIDUTC);
                provider?.setChatTitle(title);
            }
        });
    }
    async clearHistory(chatID) {
        const authProvider = this.options.authProvider;
        const authStatus = authProvider.getAuthStatus();
        // delete single chat
        if (chatID) {
            await ChatHistoryManager_1.chatHistory.deleteChat(authStatus, chatID);
            this.disposeProvider(chatID);
            await this.updateTreeViewHistory();
            return;
        }
        // delete all chats
        await ChatHistoryManager_1.chatHistory.clear(authStatus);
        this.disposePanels();
        this.treeViewProvider.reset();
    }
    /**
     * Clear the current chat view and start a new chat session in the active panel
     */
    async resetPanel() {
        (0, log_1.logDebug)('ChatPanelsManager', 'resetPanel');
        telemetry_1.telemetryService.log('CodyVSCodeExtension:chatTitleButton:clicked', { name: 'clear' }, { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.interactive.clear', 'clicked', {
            privateMetadata: { name: 'clear' },
        });
        if (this.activePanelProvider) {
            return this.activePanelProvider.clearAndRestartSession();
        }
    }
    async restorePanel(chatID, chatQuestion) {
        try {
            (0, log_1.logDebug)('ChatPanelsManager', 'restorePanel');
            // Panel already exists, just reveal it
            const provider = this.panelProviders.find(p => p.sessionID === chatID);
            if (provider?.sessionID === chatID) {
                provider.webviewPanel?.reveal();
                return provider;
            }
            return await this.createWebviewPanel(chatID, chatQuestion);
        }
        catch (error) {
            console.error(error, 'errored restoring panel');
            return undefined;
        }
    }
    disposeProvider(chatID) {
        if (chatID === this.activePanelProvider?.sessionID) {
            this.activePanelProvider = undefined;
        }
        const providerIndex = this.panelProviders.findIndex(p => p.sessionID === chatID);
        if (providerIndex !== -1) {
            const removedProvider = this.panelProviders.splice(providerIndex, 1)[0];
            removedProvider.webviewPanel?.dispose();
            removedProvider.dispose();
        }
    }
    // Dispose all open panels
    disposePanels() {
        // dispose activePanelProvider if exists
        const activePanelID = this.activePanelProvider?.sessionID;
        if (activePanelID) {
            this.disposeProvider(activePanelID);
        }
        // loop through the panel provider map
        const oldPanelProviders = this.panelProviders;
        this.panelProviders = [];
        for (const provider of oldPanelProviders) {
            provider.webviewPanel?.dispose();
            provider.dispose();
        }
        void this.updateTreeViewHistory();
    }
    dispose() {
        this.disposePanels();
        vscode.Disposable.from(...this.disposables).dispose();
    }
}
exports.ChatPanelsManager = ChatPanelsManager;
