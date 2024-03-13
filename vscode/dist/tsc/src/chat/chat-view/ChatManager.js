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
exports.addWebviewViewHTML = exports.ChatManager = exports.CodyChatPanelViewType = void 0;
const lodash_1 = require("lodash");
const uuid = __importStar(require("uuid"));
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const display_text_1 = require("../../commands/utils/display-text");
const isRunningInsideAgent_1 = require("../../jsonrpc/isRunningInsideAgent");
const log_1 = require("../../log");
const LocalStorageProvider_1 = require("../../services/LocalStorageProvider");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const ChatPanelsManager_1 = require("./ChatPanelsManager");
const SidebarViewController_1 = require("./SidebarViewController");
const types_1 = require("@sourcegraph/cody-shared/src/models/types");
exports.CodyChatPanelViewType = 'cody.chatPanel';
/**
 * Manages the sidebar webview for auth/onboarding.
 *
 * TODO(sqs): rename from its legacy name ChatManager
 */
class ChatManager {
    chatClient;
    enterpriseContext;
    localEmbeddings;
    symf;
    guardrails;
    // SidebarView is used for auth view and running tasks that do not require a chat view
    // We will always keep an instance of this around (even when not visible) to handle states when no panels are open
    sidebarViewController;
    chatPanelsManager;
    options;
    disposables = [];
    constructor({ extensionUri, ...options }, chatClient, enterpriseContext, localEmbeddings, symf, guardrails) {
        this.chatClient = chatClient;
        this.enterpriseContext = enterpriseContext;
        this.localEmbeddings = localEmbeddings;
        this.symf = symf;
        this.guardrails = guardrails;
        (0, log_1.logDebug)('ChatManager:constructor', 'init', localEmbeddings ? 'has local embeddings controller' : 'no local embeddings');
        this.options = { extensionUri, ...options };
        this.sidebarViewController = new SidebarViewController_1.SidebarViewController(this.options);
        this.chatPanelsManager = new ChatPanelsManager_1.ChatPanelsManager(this.options, this.chatClient, this.localEmbeddings, this.symf, this.enterpriseContext, this.guardrails);
        // Register Commands
        this.disposables.push(vscode.commands.registerCommand('cody.action.chat', args => this.executeChat(args)), vscode.commands.registerCommand('cody.chat.history.export', () => this.exportHistory()), vscode.commands.registerCommand('cody.chat.history.clear', () => this.clearHistory()), vscode.commands.registerCommand('cody.chat.history.delete', item => this.clearHistory(item)), vscode.commands.registerCommand('cody.chat.history.edit', item => this.editChatHistory(item)), vscode.commands.registerCommand('cody.chat.panel.new', () => this.createNewWebviewPanel()), vscode.commands.registerCommand('cody.chat.panel.restore', (id, chat) => this.restorePanel(id, chat)), vscode.commands.registerCommand('cody.chat.panel.reset', () => this.chatPanelsManager.resetPanel()), vscode.commands.registerCommand(display_text_1.CODY_PASSTHROUGH_VSCODE_OPEN_COMMAND_ID, (...args) => this.passthroughVsCodeOpen(...args)));
    }
    async getChatProvider(source) {
        const provider = await this.chatPanelsManager.getChatPanel(source);
        return provider;
    }
    async syncAuthStatus(authStatus) {
        if (authStatus?.configOverwrites?.chatModel) {
            cody_shared_1.ModelProvider.add(new cody_shared_1.ModelProvider(authStatus.configOverwrites.chatModel, [
                types_1.ModelUsage.Chat,
                // TODO: Add configOverwrites.editModel for separate edit support
                types_1.ModelUsage.Edit,
            ]));
        }
        await this.chatPanelsManager.syncAuthStatus(authStatus);
    }
    async setWebviewView(view) {
        // Chat panel is only used for chat view
        // Request to open chat panel for login view/unAuth users, will be sent to sidebar view
        if (!this.options.authProvider.getAuthStatus()?.isLoggedIn || view !== 'chat') {
            return vscode.commands.executeCommand('cody.focus');
        }
        const chatProvider = await this.getChatProvider();
        await chatProvider?.setWebviewView(view);
    }
    /**
     * Execute a chat request in a new chat panel
     */
    async executeChat(args) {
        const provider = await this.getChatProvider(args?.source);
        await provider?.handleUserMessageFn(uuid.v4(), args.text, args?.submitType, args?.contextFiles ?? [], args?.addEnhancedContext ?? true, args?.source);
        return provider;
    }
    async editChatHistory(treeItem) {
        const chatID = treeItem?.id;
        const chatLabel = treeItem?.label;
        if (chatID) {
            await this.chatPanelsManager.editChatHistory(chatID, chatLabel.label);
        }
    }
    async clearHistory(treeItem) {
        const chatID = treeItem?.id;
        if (chatID) {
            await this.chatPanelsManager.clearHistory(chatID);
            return;
        }
        if (!treeItem) {
            (0, log_1.logDebug)('ChatManager:clearHistory', 'userConfirmation');
            // Show warning to users and get confirmation if they want to clear all history
            const userConfirmation = await vscode.window.showWarningMessage('Are you sure you want to delete all of your chats?', { modal: true }, 'Delete All Chats');
            if (!userConfirmation) {
                return;
            }
            await this.chatPanelsManager.clearHistory();
        }
    }
    /**
     * Export chat history to file system
     */
    async exportHistory() {
        telemetry_1.telemetryService.log('CodyVSCodeExtension:exportChatHistoryButton:clicked', undefined, {
            hasV2Event: true,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.exportChatHistoryButton', 'clicked');
        const historyJson = LocalStorageProvider_1.localStorage.getChatHistory(this.options.authProvider.getAuthStatus())?.chat;
        const exportPath = await vscode.window.showSaveDialog({
            filters: { 'Chat History': ['json'] },
        });
        if (!exportPath || !historyJson) {
            return;
        }
        try {
            const logContent = new TextEncoder().encode(JSON.stringify(historyJson));
            await vscode.workspace.fs.writeFile(exportPath, logContent);
            // Display message and ask if user wants to open file
            void vscode.window
                .showInformationMessage('Chat history exported successfully.', 'Open')
                .then(choice => {
                if (choice === 'Open') {
                    void vscode.commands.executeCommand('vscode.open', exportPath);
                }
            });
        }
        catch (error) {
            (0, log_1.logError)('ChatManager:exportHistory', 'Failed to export chat history', error);
        }
    }
    async revive(panel, chatID) {
        try {
            await this.chatPanelsManager.createWebviewPanel(chatID, panel.title, panel);
        }
        catch (error) {
            console.error('revive failed', error);
            (0, log_1.logDebug)('ChatManager:revive', 'failed', { verbose: error });
            // When failed, create a new panel with restored session and dispose the old panel
            await this.restorePanel(chatID, panel.title);
            panel.dispose();
        }
    }
    async triggerNotice(notice) {
        const provider = await this.getChatProvider();
        provider.webviewPanel?.onDidChangeViewState(e => {
            if (e.webviewPanel.visible) {
                void provider?.webview?.postMessage({
                    type: 'notice',
                    notice,
                });
            }
        });
    }
    /**
     * See docstring for {@link CODY_PASSTHROUGH_VSCODE_OPEN_COMMAND_ID}.
     */
    async passthroughVsCodeOpen(...args) {
        if (args[1] && args[1].viewColumn === vscode.ViewColumn.Beside) {
            // Make vscode.ViewColumn.Beside work as expected from a webview: open it to the side,
            // instead of always opening a new editor to the right.
            //
            // If the active editor is undefined, that means the chat panel is the active editor, so
            // we will open the file in the first visible editor instead.
            const textEditor = vscode.window.activeTextEditor || vscode.window.visibleTextEditors[0];
            args[1].viewColumn = textEditor ? textEditor.viewColumn : vscode.ViewColumn.Beside;
        }
        if (args[1] && Array.isArray(args[1].selection)) {
            // Fix a weird issue where the selection was getting encoded as a JSON array, not an
            // object.
            ;
            args[1].selection = new vscode.Selection(args[1].selection[0], args[1].selection[1]);
        }
        await vscode.commands.executeCommand('vscode.open', ...args);
    }
    disposeChatPanelsManager() {
        void vscode.commands.executeCommand('setContext', exports.CodyChatPanelViewType, false);
        this.options.contextProvider.webview = this.sidebarViewController.webview;
        this.chatPanelsManager.dispose();
    }
    // For registering the commands for chat panels in advance
    async createNewWebviewPanel() {
        const debounceCreatePanel = (0, lodash_1.debounce)(() => this.chatPanelsManager.createWebviewPanel(), 250, {
            leading: true,
            trailing: true,
        });
        if (this.chatPanelsManager) {
            return debounceCreatePanel();
        }
        return undefined;
    }
    async restorePanel(chatID, chatQuestion) {
        const debounceRestore = (0, lodash_1.debounce)(async (chatID, chatQuestion) => this.chatPanelsManager.restorePanel(chatID, chatQuestion), 250, { leading: true, trailing: true });
        if (this.chatPanelsManager) {
            return debounceRestore(chatID, chatQuestion);
        }
        return undefined;
    }
    dispose() {
        this.disposeChatPanelsManager();
        vscode.Disposable.from(...this.disposables).dispose();
    }
}
exports.ChatManager = ChatManager;
/**
 * Set HTML for webview (panel) & webview view (sidebar)
 */
async function addWebviewViewHTML(extensionUri, view) {
    if ((0, isRunningInsideAgent_1.isRunningInsideAgent)()) {
        return;
    }
    const webviewPath = vscode.Uri.joinPath(extensionUri, 'dist', 'webviews');
    // Create Webview using vscode/index.html
    const root = vscode.Uri.joinPath(webviewPath, 'index.html');
    const bytes = await vscode.workspace.fs.readFile(root);
    const decoded = new TextDecoder('utf-8').decode(bytes);
    const resources = view.webview.asWebviewUri(webviewPath);
    // This replace variables from the vscode/dist/index.html with webview info
    // 1. Update URIs to load styles and scripts into webview (eg. path that starts with ./)
    // 2. Update URIs for content security policy to only allow specific scripts to be run
    view.webview.html = decoded
        .replaceAll('./', `${resources.toString()}/`)
        .replaceAll('{cspSource}', view.webview.cspSource);
}
exports.addWebviewViewHTML = addWebviewViewHTML;
