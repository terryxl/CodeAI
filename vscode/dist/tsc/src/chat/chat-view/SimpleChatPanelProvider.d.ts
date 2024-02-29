/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { ModelProvider, type ChatClient, type ChatMessage, type ContextFile, type Editor, type FeatureFlagProvider, type Guardrails, type ChatEventSource } from '@sourcegraph/cody-shared';
import type { View } from '../../../webviews/NavBar';
import type { VSCodeEditor } from '../../editor/vscode-editor';
import type { LocalEmbeddingsController } from '../../local-context/local-embeddings';
import type { SymfRunner } from '../../local-context/symf';
import type { AuthProvider } from '../../services/AuthProvider';
import type { TreeViewProvider } from '../../services/TreeViewProvider';
import type { ChatSubmitType } from '../protocol';
import type { ChatPanelConfig, ChatViewProviderWebview } from './ChatPanelsManager';
import type { EnterpriseContextFactory } from '../../context/enterprise-context-factory';
import type { ContextItem } from '../../prompt-builder/types';
interface SimpleChatPanelProviderOptions {
    config: ChatPanelConfig;
    extensionUri: vscode.Uri;
    authProvider: AuthProvider;
    chatClient: ChatClient;
    localEmbeddings: LocalEmbeddingsController | null;
    symf: SymfRunner | null;
    enterpriseContext: EnterpriseContextFactory | null;
    editor: VSCodeEditor;
    treeView: TreeViewProvider;
    featureFlagProvider: FeatureFlagProvider;
    models: ModelProvider[];
    guardrails: Guardrails;
}
export interface ChatSession {
    webviewPanel?: vscode.WebviewPanel;
    sessionID: string;
}
/**
 * SimpleChatPanelProvider is the view controller class for the chat panel.
 * It handles all events sent from the view, keeps track of the underlying chat model,
 * and interacts with the rest of the extension.
 *
 * Its methods are grouped into the following sections, each of which is demarcated
 * by a comment block (search for "// #region "):
 *
 * 1. top-level view action handlers
 * 2. view updaters
 * 3. chat request lifecycle methods
 * 4. session management
 * 5. webview container management
 * 6. other public accessors and mutators
 *
 * The following invariants should be maintained:
 * 1. top-level view action handlers
 *    a. should all follow the handle$ACTION naming convention
 *    b. should be private (with the existing exceptions)
 * 2. view updaters
 *    a. should all follow the post$ACTION naming convention
 *    b. should NOT mutate model state
 * 3. Keep the public interface of this class small in order to
 *    avoid tight coupling with other classes. If communication
 *    with other components outside the model and view is needed,
 *    use a broadcast/subscription design.
 */
export declare class SimpleChatPanelProvider implements vscode.Disposable, ChatSession {
    private chatModel;
    private config;
    private readonly authProvider;
    private readonly chatClient;
    private readonly codebaseStatusProvider;
    private readonly localEmbeddings;
    private readonly symf;
    private readonly contextStatusAggregator;
    private readonly editor;
    private readonly treeView;
    private readonly guardrails;
    private readonly remoteSearch;
    private readonly repoPicker;
    private history;
    private contextFilesQueryCancellation?;
    private disposables;
    dispose(): void;
    constructor({ config, extensionUri, authProvider, chatClient, localEmbeddings, symf, editor, treeView, models, guardrails, enterpriseContext, }: SimpleChatPanelProviderOptions);
    /**
     * onDidReceiveMessage handles all user actions sent from the chat panel view.
     * @param message is the message from the view.
     */
    private onDidReceiveMessage;
    private handleReady;
    private initDoer;
    private handleInitialized;
    /**
     * Handles user input text for both new and edit submissions
     */
    handleUserMessageSubmission(requestID: string, inputText: string, submitType: ChatSubmitType, userContextFiles: ContextFile[], addEnhancedContext: boolean, source?: ChatEventSource): Promise<void>;
    /**
     * Handles editing a human chat message in current chat session.
     *
     * Removes any existing messages from the provided index,
     * before submitting the replacement text as a new question.
     * When no index is provided, default to the last human message.
     */
    private handleEdit;
    private handleAbort;
    private handleSetChatModel;
    private handleGetUserContextFilesCandidates;
    private handleSymfIndex;
    private handleAttributionSearch;
    private handleChooseRemoteSearchRepo;
    private handleRemoveRemoteSearchRepo;
    private postEmptyMessageInProgress;
    private postViewTranscript;
    /**
     * Display error message in webview as part of the chat transcript, or as a system banner alongside the chat.
     */
    private postError;
    private postChatModels;
    private postContextStatus;
    /**
     * Low-level utility to post a message to the webview, pending initialization.
     *
     * cody-invariant: this.webview?.postMessage should never be invoked directly
     * except within this method.
     */
    private postMessage;
    private postChatTitle;
    /**
     * Constructs the prompt and updates the UI with the context used in the prompt.
     */
    private buildPrompt;
    private streamAssistantResponse;
    /**
     * Issue the chat request and stream the results back, updating the model and view
     * with the response.
     */
    private sendLLMRequest;
    private completionCanceller?;
    private cancelInProgressCompletion;
    /**
     * Finalizes adding a bot message to the chat model and triggers an update to the view.
     */
    private addBotMessage;
    get sessionID(): string;
    newSession(): Promise<void>;
    restoreSession(sessionID: string): Promise<void>;
    private saveSession;
    clearAndRestartSession(): Promise<void>;
    private extensionUri;
    private _webviewPanel?;
    get webviewPanel(): vscode.WebviewPanel | undefined;
    private _webview?;
    get webview(): ChatViewProviderWebview | undefined;
    /**
     * Creates the webview panel for the Cody chat interface if it doesn't already exist.
     */
    createWebviewPanel(activePanelViewColumn?: vscode.ViewColumn, _chatId?: string, lastQuestion?: string): Promise<vscode.WebviewPanel>;
    /**
     * Revives the chat panel when the extension is reactivated.
     */
    revive(webviewPanel: vscode.WebviewPanel): Promise<void>;
    /**
     * Registers the given webview panel by setting up its options, icon, and handlers.
     * Also stores the panel reference and disposes it when closed.
     */
    private registerWebviewPanel;
    setWebviewView(view: View): Promise<void>;
    setChatTitle(title: string): void;
    getViewTranscript(): ChatMessage[];
}
export declare function contextFilesToContextItems(editor: Editor, files: ContextFile[], fetchContent?: boolean): Promise<ContextItem[]>;
export {};
//# sourceMappingURL=SimpleChatPanelProvider.d.ts.map