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
exports.contextFilesToContextItems = exports.SimpleChatPanelProvider = void 0;
const uuid = __importStar(require("uuid"));
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const display_text_1 = require("../../commands/utils/display-text");
const configuration_1 = require("../../configuration");
const remote_search_1 = require("../../context/remote-search");
const editor_context_1 = require("../../editor/utils/editor-context");
const enhanced_context_status_1 = require("../../local-context/enhanced-context-status");
const log_1 = require("../../log");
const LocalAppDetector_1 = require("../../services/LocalAppDetector");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const codeblock_action_tracker_1 = require("../../services/utils/codeblock-action-tracker");
const workspace_action_1 = require("../../services/utils/workspace-action");
const test_support_1 = require("../../test-support");
const utils_1 = require("../utils");
const chat_helpers_1 = require("./chat-helpers");
const ChatHistoryManager_1 = require("./ChatHistoryManager");
const ChatManager_1 = require("./ChatManager");
const CodebaseStatusProvider_1 = require("./CodebaseStatusProvider");
const context_1 = require("./context");
const InitDoer_1 = require("./InitDoer");
const prompt_1 = require("./prompt");
const SimpleChatModel_1 = require("./SimpleChatModel");
const types_1 = require("@sourcegraph/cody-shared/src/models/types");
const models_1 = require("../../models");
const utilts_1 = require("../../models/utilts");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
const utils_2 = require("../../services/open-telemetry/utils");
const PromptAzure_1 = require("./PromptAzure");
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
class SimpleChatPanelProvider {
    chatModel;
    model;
    config;
    authProvider;
    chatClient;
    codebaseStatusProvider;
    localEmbeddings;
    symf;
    contextStatusAggregator = new enhanced_context_status_1.ContextStatusAggregator();
    editor;
    treeView;
    guardrails;
    source;
    remoteSearch;
    repoPicker;
    handleUserMessageFn;
    history = new ChatHistoryManager_1.ChatHistoryManager();
    contextFilesQueryCancellation;
    disposables = [];
    dispose() {
        vscode.Disposable.from(...this.disposables).dispose();
        this.disposables = [];
    }
    constructor({ config, extensionUri, authProvider, chatClient, localEmbeddings, symf, editor, treeView, models, guardrails, enterpriseContext, source, }) {
        this.config = config;
        this.extensionUri = extensionUri;
        this.authProvider = authProvider;
        this.chatClient = chatClient;
        this.localEmbeddings = localEmbeddings;
        this.symf = symf;
        this.repoPicker = enterpriseContext?.repoPicker || null;
        this.remoteSearch = enterpriseContext?.createRemoteSearch() || null;
        this.editor = editor;
        this.treeView = treeView;
        this.source = source;
        this.model = models_1.chatModel.getModel(authProvider, models);
        this.chatModel = new SimpleChatModel_1.SimpleChatModel(this.model.model);
        this.guardrails = guardrails;
        this.handleUserMessageFn =
            this.config.modelsVendor === "Azure"
                ? this.handleUserMessageSubmissionForAzure
                : this.handleUserMessageSubmission;
        if (test_support_1.TestSupport.instance) {
            test_support_1.TestSupport.instance.chatPanelProvider.set(this);
        }
        // Advise local embeddings to start up if necessary.
        void this.localEmbeddings?.start();
        // Push context status to the webview when it changes.
        this.disposables.push(this.contextStatusAggregator.onDidChangeStatus(() => this.postContextStatus()));
        this.disposables.push(this.contextStatusAggregator);
        if (this.localEmbeddings) {
            this.disposables.push(this.contextStatusAggregator.addProvider(this.localEmbeddings));
        }
        this.codebaseStatusProvider = new CodebaseStatusProvider_1.CodebaseStatusProvider(this.editor, this.config.experimentalSymfContext ? this.symf : null, enterpriseContext
            ? enterpriseContext.getCodebaseRepoIdMapper()
            : null);
        this.disposables.push(this.contextStatusAggregator.addProvider(this.codebaseStatusProvider));
        if (this.remoteSearch) {
            this.disposables.push(
            // Display enhanced context status from the remote search provider
            this.contextStatusAggregator.addProvider(this.remoteSearch), 
            // When the codebase has a remote ID, include it automatically
            this.codebaseStatusProvider.onDidChangeStatus(async () => {
                const codebase = await this.codebaseStatusProvider.currentCodebase();
                if (codebase?.remote && codebase.remoteRepoId) {
                    this.remoteSearch?.setRepos([
                        {
                            name: codebase.remote,
                            id: codebase.remoteRepoId,
                        },
                    ], remote_search_1.RepoInclusion.Automatic);
                }
            }));
        }
    }
    /**
     * onDidReceiveMessage handles all user actions sent from the chat panel view.
     * @param message is the message from the view.
     */
    async onDidReceiveMessage(message) {
        switch (message.command) {
            case "ready":
                await this.handleReady();
                break;
            case "initialized":
                await this.handleInitialized();
                break;
            case "submit": {
                await this.handleUserMessageFn(uuid.v4(), message.text, message.submitType, message.contextFiles ?? [], message.addEnhancedContext ?? false, "chat");
                break;
            }
            case "edit": {
                await this.handleEdit(uuid.v4(), message.text, message.index, message.contextFiles ?? [], message.addEnhancedContext || false);
                break;
            }
            case "abort":
                this.handleAbort();
                break;
            case "chatModel":
                this.handleSetChatModel(message.model);
                break;
            case "get-chat-models":
                this.postChatModels();
                break;
            case "getUserContext":
                await this.handleGetUserContextFilesCandidates(message.query);
                break;
            case "insert":
                await (0, codeblock_action_tracker_1.handleCodeFromInsertAtCursor)(message.text, message.metadata);
                break;
            case "copy":
                await (0, codeblock_action_tracker_1.handleCopiedCode)(message.text, message.eventType === "Button", message.metadata);
                break;
            case "links":
                void (0, workspace_action_1.openExternalLinks)(message.value);
                break;
            case "openFile":
                await (0, chat_helpers_1.openFile)(message.uri, message.range, this.webviewPanel?.viewColumn);
                break;
            case "openLocalFileWithRange":
                await (0, workspace_action_1.openLocalFileWithRange)(message.filePath, message.range);
                break;
            case "newFile":
                (0, codeblock_action_tracker_1.handleCodeFromSaveToNewFile)(message.text, message.metadata);
                await this.editor.createWorkspaceFile(message.text);
                break;
            case "context/get-remote-search-repos": {
                await this.postMessage({
                    type: "context/remote-repos",
                    repos: this.chatModel.getSelectedRepos() ?? [],
                });
                break;
            }
            case "context/choose-remote-search-repo": {
                await this.handleChooseRemoteSearchRepo(message.explicitRepos);
                break;
            }
            case "context/remove-remote-search-repo":
                void this.handleRemoveRemoteSearchRepo(message.repoId);
                break;
            case "embeddings/index":
                void this.localEmbeddings?.index();
                break;
            case "symf/index": {
                void this.handleSymfIndex();
                break;
            }
            case "show-page":
                await vscode.commands.executeCommand("cody.show-page", message.page);
                break;
            case "attribution-search":
                await this.handleAttributionSearch(message.snippet);
                break;
            case "restoreHistory":
                await this.restoreSession(message.chatID);
                break;
            case "reset":
                await this.clearAndRestartSession();
                break;
            case "event":
                telemetry_1.telemetryService.log(message.eventName, message.properties);
                break;
            default:
                this.postError(new Error(`Invalid request type from Webview Panel: ${message.command}`));
        }
    }
    // =======================================================================
    // #region top-level view action handlers
    // =======================================================================
    // When the webview sends the 'ready' message, respond by posting the view config
    async handleReady() {
        const config = await (0, configuration_1.getFullConfig)();
        const authStatus = this.authProvider.getAuthStatus();
        const localProcess = (0, LocalAppDetector_1.getProcessInfo)();
        const configForWebview = {
            ...localProcess,
            debugEnable: config.debugEnable,
            serverEndpoint: config.serverEndpoint,
            experimentalGuardrails: config.experimentalGuardrails,
        };
        const workspaceFolderUris = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.toString()) ?? [];
        await this.postMessage({
            type: "config",
            config: configForWebview,
            authStatus,
            workspaceFolderUris,
        });
        (0, log_1.logDebug)("SimpleChatPanelProvider", "updateViewConfig", {
            verbose: configForWebview,
        });
    }
    initDoer = new InitDoer_1.InitDoer();
    async handleInitialized() {
        (0, log_1.logDebug)("SimpleChatPanelProvider", "handleInitialized");
        // HACK: this call is necessary to get the webview to set the chatID state,
        // which is necessary on deserialization. It should be invoked before the
        // other initializers run (otherwise, it might interfere with other view
        // state)
        await this.webview?.postMessage({
            type: "transcript",
            messages: [],
            isMessageInProgress: false,
            chatID: this.chatModel.sessionID,
        });
        this.postChatModels();
        await this.saveSession();
        this.initDoer.signalInitialized();
    }
    /**
     * Handles user input text for both new and edit submissions
     */
    async handleUserMessageSubmission(requestID, inputText, submitType, userContextFiles, addEnhancedContext, source) {
        return tracing_1.tracer.startActiveSpan("chat.submit", async (span) => {
            const useFusedContextPromise = cody_shared_1.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyChatFusedContext);
            const authStatus = this.authProvider.getAuthStatus();
            const sharedProperties = {
                requestID,
                chatModel: this.chatModel.modelID,
                source,
                traceId: span.spanContext().traceId,
            };
            telemetry_1.telemetryService.log("CodyVSCodeExtension:chat-question:submitted", sharedProperties);
            telemetry_v2_1.telemetryRecorder.recordEvent("cody.chat-question", "submitted", {
                metadata: {
                    // Flag indicating this is a transcript event to go through ML data pipeline. Only for DotCom users
                    // See https://github.com/sourcegraph/sourcegraph/pull/59524
                    recordsPrivateMetadataTranscript: authStatus.endpoint &&
                        (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                        ? 1
                        : 0,
                },
                privateMetadata: {
                    ...sharedProperties,
                    // 🚨 SECURITY: chat transcripts are to be included only for DotCom users AND for V2 telemetry
                    // V2 telemetry exports privateMetadata only for DotCom users
                    // the condition below is an additional safeguard measure
                    promptText: authStatus.endpoint &&
                        (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                        ? inputText
                        : undefined,
                },
            });
            tracing_1.tracer.startActiveSpan("chat.submit.firstToken", async (firstTokenSpan) => {
                span.setAttribute("sampled", true);
                if (inputText.match(/^\/reset$/)) {
                    span.addEvent("clearAndRestartSession");
                    span.end();
                    return this.clearAndRestartSession();
                }
                if (submitType === "user-newchat" &&
                    !this.chatModel.isEmpty()) {
                    span.addEvent("clearAndRestartSession");
                    await this.clearAndRestartSession();
                }
                const displayText = userContextFiles?.length
                    ? (0, display_text_1.createDisplayTextWithFileLinks)(inputText, userContextFiles)
                    : inputText;
                const promptText = inputText;
                this.chatModel.addHumanMessage({ text: promptText }, displayText);
                await this.saveSession({
                    inputText,
                    inputContextFiles: userContextFiles,
                });
                this.postEmptyMessageInProgress();
                const userContextItems = await contextFilesToContextItems(this.editor, userContextFiles || [], true);
                span.setAttribute("strategy", this.config.useContext);
                const prompter = new prompt_1.DefaultPrompter(userContextItems, addEnhancedContext
                    ? async (text, maxChars) => (0, context_1.getEnhancedContext)({
                        strategy: this.config.useContext,
                        editor: this.editor,
                        text,
                        providers: {
                            localEmbeddings: this.localEmbeddings,
                            symf: this.config
                                .experimentalSymfContext
                                ? this.symf
                                : null,
                            remoteSearch: this.remoteSearch,
                        },
                        featureFlags: {
                            fusedContext: this.config
                                .internalUnstable ||
                                (await useFusedContextPromise),
                        },
                        hints: { maxChars },
                    })
                    : undefined);
                const sendTelemetry = (contextSummary) => {
                    const properties = {
                        ...sharedProperties,
                        contextSummary,
                        traceId: span.spanContext().traceId,
                    };
                    span.setAttributes(properties);
                    telemetry_1.telemetryService.log("CodyVSCodeExtension:chat-question:executed", properties, {
                        hasV2Event: true,
                    });
                    telemetry_v2_1.telemetryRecorder.recordEvent("cody.chat-question", "executed", {
                        metadata: {
                            ...contextSummary,
                            // Flag indicating this is a transcript event to go through ML data pipeline. Only for DotCom users
                            // See https://github.com/sourcegraph/sourcegraph/pull/59524
                            recordsPrivateMetadataTranscript: authStatus.endpoint &&
                                (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                                ? 1
                                : 0,
                        },
                        privateMetadata: {
                            properties,
                            // 🚨 SECURITY: chat transcripts are to be included only for DotCom users AND for V2 telemetry
                            // V2 telemetry exports privateMetadata only for DotCom users
                            // the condition below is an additional safeguard measure
                            promptText: authStatus.endpoint &&
                                (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                                ? promptText
                                : undefined,
                        },
                    });
                };
                try {
                    const prompt = await this.buildPrompt(prompter, sendTelemetry);
                    this.streamAssistantResponse(requestID, prompt, span, firstTokenSpan);
                }
                catch (error) {
                    if ((0, cody_shared_1.isRateLimitError)(error)) {
                        this.postError(error, "transcript");
                    }
                    else {
                        this.postError((0, cody_shared_1.isError)(error)
                            ? error
                            : new Error(`Error generating assistant response: ${error}`));
                    }
                    (0, tracing_1.recordErrorToSpan)(span, error);
                }
            });
        });
    }
    async handleUserMessageSubmissionForAzure(requestID, inputText, submitType, userContextFiles, addEnhancedContext, source) {
        return tracing_1.tracer.startActiveSpan("chat.submit", async (span) => {
            const authStatus = this.authProvider.getAuthStatus();
            const sharedProperties = {
                requestID,
                chatModel: this.chatModel.modelID,
                source: this.source,
                traceId: span.spanContext().traceId,
            };
            telemetry_1.telemetryService.log("CodyVSCodeExtension:chat-question:submitted", sharedProperties);
            telemetry_v2_1.telemetryRecorder.recordEvent("cody.chat-question", "submitted", {
                metadata: {
                    // Flag indicating this is a transcript event to go through ML data pipeline. Only for DotCom users
                    // See https://github.com/sourcegraph/sourcegraph/pull/59524
                    recordsPrivateMetadataTranscript: authStatus.endpoint &&
                        (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                        ? 1
                        : 0,
                },
                privateMetadata: {
                    ...sharedProperties,
                    // 🚨 SECURITY: chat transcripts are to be included only for DotCom users AND for V2 telemetry
                    // V2 telemetry exports privateMetadata only for DotCom users
                    // the condition below is an additional safeguard measure
                    promptText: authStatus.endpoint &&
                        (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                        ? inputText
                        : undefined,
                },
            });
            tracing_1.tracer.startActiveSpan("chat.submit.firstToken", async (firstTokenSpan) => {
                span.setAttribute("sampled", true);
                if (inputText.match(/^\/reset$/)) {
                    span.addEvent("clearAndRestartSession");
                    span.end();
                    return this.clearAndRestartSession();
                }
                if (submitType === "user-newchat" &&
                    !this.chatModel.isEmpty()) {
                    span.addEvent("clearAndRestartSession");
                    await this.clearAndRestartSession();
                }
                const promptText = inputText;
                this.chatModel.addHumanMessage({ text: promptText }, inputText);
                const userContextItems = await contextFilesToContextItems(this.editor, userContextFiles || [], true);
                span.setAttribute("strategy", this.config.useContext);
                const prompter = new PromptAzure_1.AzuerPrompter(userContextItems, submitType);
                try {
                    const prompt = await this.buildPrompt(prompter);
                    this.streamAssistantResponse(requestID, prompt, span, firstTokenSpan);
                }
                catch (error) {
                    if ((0, cody_shared_1.isRateLimitError)(error)) {
                        this.postError(error, "transcript");
                    }
                    else {
                        this.postError((0, cody_shared_1.isError)(error)
                            ? error
                            : new Error(`Error generating assistant response: ${error}`));
                    }
                    (0, tracing_1.recordErrorToSpan)(span, error);
                }
            });
        });
    }
    /**
     * Handles editing a human chat message in current chat session.
     *
     * Removes any existing messages from the provided index,
     * before submitting the replacement text as a new question.
     * When no index is provided, default to the last human message.
     */
    async handleEdit(requestID, text, index, contextFiles = [], addEnhancedContext = true) {
        telemetry_1.telemetryService.log("CodyVSCodeExtension:editChatButton:clicked", undefined, {
            hasV2Event: true,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent("cody.editChatButton", "clicked");
        try {
            const humanMessage = index ?? this.chatModel.getLastSpeakerMessageIndex("human");
            if (humanMessage === undefined) {
                return;
            }
            this.chatModel.removeMessagesFromIndex(humanMessage, "human");
            return await this.handleUserMessageFn(requestID, text, "user", contextFiles, addEnhancedContext);
        }
        catch {
            this.postError(new Error("Failed to edit prompt"), "transcript");
        }
    }
    handleAbort() {
        this.cancelInProgressCompletion();
        telemetry_1.telemetryService.log("CodyVSCodeExtension:abortButton:clicked", { source: "sidebar" }, { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent("cody.sidebar.abortButton", "clicked");
    }
    async handleSetChatModel(modelID) {
        this.chatModel.modelID = modelID;
        await models_1.chatModel.set(modelID);
    }
    async handleGetUserContextFilesCandidates(query) {
        const source = "chat";
        if (!query.length) {
            telemetry_1.telemetryService.log("CodyVSCodeExtension:at-mention:executed", {
                source,
            });
            telemetry_v2_1.telemetryRecorder.recordEvent("cody.at-mention", "executed", {
                privateMetadata: { source },
            });
            const tabs = (0, editor_context_1.getOpenTabsContextFile)();
            void this.postMessage({
                type: "userContextFiles",
                userContextFiles: tabs,
            });
            return;
        }
        // Log when query only has 1 char to avoid logging the same query repeatedly
        if (query.length === 1) {
            const type = query.startsWith("#") ? "symbol" : "file";
            telemetry_1.telemetryService.log(`CodyVSCodeExtension:at-mention:${type}:executed`, { source });
            telemetry_v2_1.telemetryRecorder.recordEvent(`cody.at-mention.${type}`, "executed", {
                privateMetadata: { source },
            });
        }
        const cancellation = new vscode.CancellationTokenSource();
        try {
            const MAX_RESULTS = 20;
            if (query.startsWith("#")) {
                // It would be nice if the VS Code symbols API supports
                // cancellation, but it doesn't
                const symbolResults = await (0, editor_context_1.getSymbolContextFiles)(query.slice(1), MAX_RESULTS);
                // Check if cancellation was requested while getFileContextFiles
                // was executing, which means a new request has already begun
                // (i.e. prevent race conditions where slow old requests get
                // processed after later faster requests)
                if (!cancellation.token.isCancellationRequested) {
                    await this.postMessage({
                        type: "userContextFiles",
                        userContextFiles: symbolResults,
                    });
                }
            }
            else {
                const fileResults = await (0, editor_context_1.getFileContextFiles)(query, MAX_RESULTS, cancellation.token);
                // Check if cancellation was requested while getFileContextFiles
                // was executing, which means a new request has already begun
                // (i.e. prevent race conditions where slow old requests get
                // processed after later faster requests)
                if (!cancellation.token.isCancellationRequested) {
                    await this.postMessage({
                        type: "userContextFiles",
                        userContextFiles: fileResults,
                    });
                }
            }
        }
        catch (error) {
            this.postError(new Error(`Error retrieving context files: ${error}`));
        }
        finally {
            // Cancel any previous search request after we update the UI
            // to avoid a flash of empty results as you type
            this.contextFilesQueryCancellation?.cancel();
            this.contextFilesQueryCancellation = cancellation;
        }
    }
    async handleSymfIndex() {
        const codebase = await this.codebaseStatusProvider.currentCodebase();
        if (codebase && (0, cody_shared_1.isFileURI)(codebase.localFolder)) {
            await this.symf?.ensureIndex(codebase.localFolder, { hard: true });
        }
    }
    async handleAttributionSearch(snippet) {
        try {
            const attribution = await this.guardrails.searchAttribution(snippet);
            if ((0, cody_shared_1.isError)(attribution)) {
                await this.postMessage({
                    type: "attribution",
                    snippet,
                    error: attribution.message,
                });
                return;
            }
            await this.postMessage({
                type: "attribution",
                snippet,
                attribution: {
                    repositoryNames: attribution.repositories.map((r) => r.name),
                    limitHit: attribution.limitHit,
                },
            });
        }
        catch (error) {
            await this.postMessage({
                type: "attribution",
                snippet,
                error: `${error}`,
            });
        }
    }
    async handleChooseRemoteSearchRepo(explicitRepos) {
        if (!this.remoteSearch) {
            return;
        }
        const repos = explicitRepos ??
            (await this.repoPicker?.show(this.remoteSearch.getRepos(remote_search_1.RepoInclusion.Manual)));
        if (repos) {
            this.chatModel.setSelectedRepos(repos);
            this.remoteSearch.setRepos(repos, remote_search_1.RepoInclusion.Manual);
        }
    }
    handleRemoveRemoteSearchRepo(repoId) {
        this.remoteSearch?.removeRepo(repoId);
    }
    // #endregion
    // =======================================================================
    // #region view updaters
    // =======================================================================
    postEmptyMessageInProgress() {
        this.postViewTranscript({ speaker: "assistant" });
    }
    postViewTranscript(messageInProgress) {
        const messages = this.chatModel
            .getMessagesWithContext()
            .map((m) => (0, SimpleChatModel_1.toViewMessage)(m));
        if (messageInProgress) {
            messages.push(messageInProgress);
        }
        // We never await on postMessage, because it can sometimes hang indefinitely:
        // https://github.com/microsoft/vscode/issues/159431
        void this.postMessage({
            type: "transcript",
            messages,
            isMessageInProgress: !!messageInProgress,
            chatID: this.chatModel.sessionID,
        });
        // Update webview panel title
        this.postChatTitle();
    }
    /**
     * Display error message in webview as part of the chat transcript, or as a system banner alongside the chat.
     */
    postError(error, type) {
        (0, log_1.logDebug)("SimpleChatPanelProvider: postError", error.message);
        // Add error to transcript
        if (type === "transcript") {
            this.chatModel.addErrorAsBotMessage(error);
            this.postViewTranscript();
            void this.postMessage({
                type: "transcript-errors",
                isTranscriptError: true,
            });
            return;
        }
        void this.postMessage({ type: "errors", errors: error.message });
    }
    postChatModels() {
        const authStatus = this.authProvider.getAuthStatus();
        if (!authStatus?.isLoggedIn) {
            return;
        }
        if (authStatus?.configOverwrites?.chatModel) {
            cody_shared_1.ModelProvider.add(new cody_shared_1.ModelProvider(authStatus.configOverwrites.chatModel, [
                types_1.ModelUsage.Chat,
                // TODO: Add configOverwrites.editModel for separate edit support
                types_1.ModelUsage.Edit,
            ]));
        }
        const models = cody_shared_1.ModelProvider.get(types_1.ModelUsage.Chat, authStatus.endpoint, this.chatModel.modelID);
        void this.postMessage({
            type: "chatModels",
            models,
        });
    }
    postContextStatus() {
        (0, log_1.logDebug)("SimpleChatPanelProvider", "postContextStatusToWebView", JSON.stringify(this.contextStatusAggregator.status));
        void this.postMessage({
            type: "enhanced-context",
            enhancedContextStatus: {
                groups: this.contextStatusAggregator.status,
            },
        });
    }
    /**
     * Low-level utility to post a message to the webview, pending initialization.
     *
     * cody-invariant: this.webview?.postMessage should never be invoked directly
     * except within this method.
     */
    postMessage(message) {
        return this.initDoer.do(() => this.webview?.postMessage(message));
    }
    postChatTitle() {
        if (this.webviewPanel) {
            this.webviewPanel.title = this.chatModel.getChatTitle();
        }
    }
    // #endregion
    // =======================================================================
    // #region chat request lifecycle methods
    // =======================================================================
    /**
     * Constructs the prompt and updates the UI with the context used in the prompt.
     */
    async buildPrompt(prompter, sendTelemetry) {
        const maxChars = (0, utilts_1.getContextWindowForModel)(this.authProvider.getAuthStatus(), this.chatModel.modelID);
        const { prompt, newContextUsed } = await prompter.makePrompt(this.chatModel, maxChars);
        // Update UI based on prompt construction
        newContextUsed && this.chatModel.setNewContextUsed(newContextUsed);
        if (sendTelemetry) {
            // Create a summary of how many code snippets of each context source are being
            // included in the prompt
            const contextSummary = {};
            for (const { source } of newContextUsed) {
                if (!source) {
                    continue;
                }
                if (contextSummary[source]) {
                    contextSummary[source] += 1;
                }
                else {
                    contextSummary[source] = 1;
                }
            }
            sendTelemetry(contextSummary);
        }
        return prompt;
    }
    streamAssistantResponse(requestID, prompt, span, firstTokenSpan) {
        let firstTokenMeasured = false;
        function measureFirstToken() {
            if (firstTokenMeasured) {
                return;
            }
            firstTokenMeasured = true;
            span.addEvent("firstToken");
            firstTokenSpan.end();
        }
        this.postEmptyMessageInProgress();
        this.sendLLMRequest(prompt, {
            update: (content) => {
                measureFirstToken();
                span.addEvent("update");
                this.postViewTranscript((0, SimpleChatModel_1.toViewMessage)({
                    message: {
                        speaker: "assistant",
                        text: content,
                    },
                }));
            },
            close: (content) => {
                measureFirstToken();
                (0, utils_2.recordExposedExperimentsToSpan)(span);
                span.end();
                this.addBotMessage(requestID, content);
            },
            error: (partialResponse, error) => {
                if (!isAbortError(error)) {
                    this.postError(error, "transcript");
                }
                try {
                    // We should still add the partial response if there was an error
                    // This'd throw an error if one has already been added
                    this.addBotMessage(requestID, partialResponse);
                }
                catch {
                    console.error("Streaming Error", error);
                }
                (0, tracing_1.recordErrorToSpan)(span, error);
            },
        });
    }
    /**
     * Issue the chat request and stream the results back, updating the model and view
     * with the response.
     */
    async sendLLMRequest(prompt, callbacks) {
        let lastContent = "";
        const typewriter = new cody_shared_1.Typewriter({
            update: (content) => {
                lastContent = content;
                callbacks.update(content);
            },
            close: () => {
                callbacks.close(lastContent);
            },
            error: (error) => {
                callbacks.error(lastContent, error);
            },
        });
        this.cancelInProgressCompletion();
        const abortController = new AbortController();
        this.completionCanceller = () => abortController.abort();
        const stream = this.chatClient.chat(prompt, { model: this.chatModel.modelID }, abortController.signal, this.config.modelsVendor);
        for await (const message of stream) {
            switch (message.type) {
                case "change": {
                    typewriter.update(message.text);
                    break;
                }
                case "complete": {
                    this.completionCanceller = undefined;
                    typewriter.close();
                    typewriter.stop();
                    break;
                }
                case "error": {
                    this.cancelInProgressCompletion();
                    typewriter.close();
                    typewriter.stop(message.error);
                }
            }
        }
    }
    completionCanceller;
    cancelInProgressCompletion() {
        if (this.completionCanceller) {
            this.completionCanceller();
            this.completionCanceller = undefined;
        }
    }
    /**
     * Finalizes adding a bot message to the chat model and triggers an update to the view.
     */
    addBotMessage(requestID, rawResponse) {
        const displayText = (0, cody_shared_1.reformatBotMessageForChat)(rawResponse, "");
        this.chatModel.addBotMessage({ text: rawResponse }, displayText);
        void this.saveSession();
        this.postViewTranscript();
        const authStatus = this.authProvider.getAuthStatus();
        // Count code generated from response
        const codeCount = (0, utils_1.countGeneratedCode)(rawResponse);
        if (codeCount?.charCount) {
            // const metadata = lastInteraction?.getHumanMessage().metadata
            telemetry_1.telemetryService.log("CodyVSCodeExtension:chatResponse:hasCode", { ...codeCount, requestID }, { hasV2Event: true });
            telemetry_v2_1.telemetryRecorder.recordEvent("cody.chatResponse.new", "hasCode", {
                metadata: {
                    ...codeCount,
                    // Flag indicating this is a transcript event to go through ML data pipeline. Only for dotcom users
                    // See https://github.com/sourcegraph/sourcegraph/pull/59524
                    recordsPrivateMetadataTranscript: authStatus.endpoint && (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                        ? 1
                        : 0,
                },
                privateMetadata: {
                    requestID,
                    // 🚨 SECURITY: chat transcripts are to be included only for DotCom users AND for V2 telemetry
                    // V2 telemetry exports privateMetadata only for DotCom users
                    // the condition below is an aditional safegaurd measure
                    responseText: authStatus.endpoint && (0, cody_shared_1.isDotCom)(authStatus.endpoint)
                        ? rawResponse
                        : undefined,
                },
            });
        }
    }
    // #endregion
    // =======================================================================
    // #region session management
    // =======================================================================
    // A unique identifier for this SimpleChatPanelProvider instance used to identify
    // it when a handle to this specific panel provider is needed.
    get sessionID() {
        return this.chatModel.sessionID;
    }
    // Sets the provider up for a new chat that is not being restored from a
    // saved session.
    async newSession() {
        // Set the remote search's selected repos to the workspace repo list
        // by default.
        this.remoteSearch?.setRepos((await this.repoPicker?.getDefaultRepos()) || [], remote_search_1.RepoInclusion.Manual);
    }
    // Attempts to restore the chat to the given sessionID, if it exists in
    // history. If it does, then saves the current session and cancels the
    // current in-progress completion. If the chat does not exist, then this
    // is a no-op.
    async restoreSession(sessionID) {
        const oldTranscript = this.history.getChat(this.authProvider.getAuthStatus(), sessionID);
        if (!oldTranscript) {
            return this.newSession();
        }
        this.cancelInProgressCompletion();
        const newModel = await newChatModelfromTranscriptJSON(oldTranscript, this.chatModel.modelID);
        this.chatModel = newModel;
        // Restore per-chat enhanced context settings
        if (this.remoteSearch) {
            const repos = this.chatModel.getSelectedRepos() ||
                (await this.repoPicker?.getDefaultRepos()) ||
                [];
            this.remoteSearch.setRepos(repos, remote_search_1.RepoInclusion.Manual);
        }
        this.postViewTranscript();
    }
    async saveSession(humanInput) {
        const allHistory = await this.history.saveChat(this.authProvider.getAuthStatus(), this.chatModel.toTranscriptJSON(), humanInput);
        if (allHistory) {
            void this.postMessage({
                type: "history",
                localHistory: allHistory,
            });
        }
        await this.treeView.updateTree(this.authProvider.getAuthStatus());
    }
    async clearAndRestartSession() {
        if (this.chatModel.isEmpty()) {
            return;
        }
        this.cancelInProgressCompletion();
        await this.saveSession();
        this.chatModel = new SimpleChatModel_1.SimpleChatModel(this.chatModel.modelID);
        this.postViewTranscript();
    }
    // #endregion
    // =======================================================================
    // #region webview container management
    // =======================================================================
    extensionUri;
    _webviewPanel;
    get webviewPanel() {
        return this._webviewPanel;
    }
    _webview;
    get webview() {
        return this._webview;
    }
    /**
     * Creates the webview panel for the Cody chat interface if it doesn't already exist.
     */
    async createWebviewPanel(activePanelViewColumn, _chatId, lastQuestion) {
        // Checks if the webview panel already exists and is visible.
        // If so, returns early to avoid creating a duplicate.
        if (this.webviewPanel) {
            return this.webviewPanel;
        }
        const viewType = ChatManager_1.CodyChatPanelViewType;
        const panelTitle = this.history.getChat(this.authProvider.getAuthStatus(), this.chatModel.sessionID)?.chatTitle || (0, chat_helpers_1.getChatPanelTitle)(lastQuestion);
        const viewColumn = activePanelViewColumn || vscode.ViewColumn.Beside;
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, "dist", "webviews");
        const panel = vscode.window.createWebviewPanel(viewType, panelTitle, { viewColumn, preserveFocus: true }, {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableFindWidget: true,
            localResourceRoots: [webviewPath],
            enableCommandUris: true,
        });
        return this.registerWebviewPanel(panel);
    }
    /**
     * Revives the chat panel when the extension is reactivated.
     */
    async revive(webviewPanel) {
        (0, log_1.logDebug)("SimpleChatPanelProvider:revive", "registering webview panel");
        await this.registerWebviewPanel(webviewPanel);
    }
    /**
     * Registers the given webview panel by setting up its options, icon, and handlers.
     * Also stores the panel reference and disposes it when closed.
     */
    async registerWebviewPanel(panel) {
        (0, log_1.logDebug)("SimpleChatPanelProvider:registerWebviewPanel", "registering webview panel");
        if (this.webviewPanel || this.webview) {
            throw new Error("Webview or webview panel already registered");
        }
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, "dist", "webviews");
        panel.iconPath = vscode.Uri.joinPath(this.extensionUri, "resources", "active-chat-icon.svg");
        // Reset the webview options to ensure localResourceRoots is up-to-date
        panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [webviewPath],
            enableCommandUris: true,
        };
        await (0, ChatManager_1.addWebviewViewHTML)(this.extensionUri, panel);
        // Register webview
        this._webviewPanel = panel;
        this._webview = panel.webview;
        this.postContextStatus();
        // Dispose panel when the panel is closed
        panel.onDidDispose(() => {
            this.cancelInProgressCompletion();
            this._webviewPanel = undefined;
            this._webview = undefined;
            panel.dispose();
        });
        // Let the webview know if it is active
        panel.onDidChangeViewState((event) => this.postMessage({
            type: "webview-state",
            isActive: event.webviewPanel.active,
        }));
        this.disposables.push(panel.webview.onDidReceiveMessage((message) => this.onDidReceiveMessage((0, cody_shared_1.hydrateAfterPostMessage)(message, (uri) => vscode.Uri.from(uri)))));
        // Used for keeping sidebar chat view closed when webview panel is enabled
        await vscode.commands.executeCommand("setContext", ChatManager_1.CodyChatPanelViewType, true);
        const configFeatures = await cody_shared_1.ConfigFeaturesSingleton.getInstance().getConfigFeatures();
        void this.postMessage({
            type: "setConfigFeatures",
            configFeatures: {
                chat: configFeatures.chat,
                attribution: configFeatures.attribution,
            },
        });
        return panel;
    }
    async setWebviewView(view) {
        if (view !== "chat") {
            // Only chat view is supported in the webview panel.
            // When a different view is requested,
            // Set context to notifiy the webview panel to close.
            // This should close the webview panel and open the login view in the sidebar.
            await vscode.commands.executeCommand("setContext", ChatManager_1.CodyChatPanelViewType, false);
            await vscode.commands.executeCommand("setContext", "cody.activated", false);
            return;
        }
        if (!this.webviewPanel) {
            await this.createWebviewPanel();
        }
        this.webviewPanel?.reveal();
        await this.postMessage({
            type: "view",
            view: view,
        });
    }
    // #endregion
    // =======================================================================
    // #region other public accessors and mutators
    // =======================================================================
    setChatTitle(title) {
        // Skip storing default chat title
        if (title !== "New Chat") {
            this.chatModel.setCustomChatTitle(title);
        }
        this.postChatTitle();
    }
    // Convenience function for tests
    getViewTranscript() {
        return this.chatModel
            .getMessagesWithContext()
            .map((m) => (0, SimpleChatModel_1.toViewMessage)(m));
    }
}
exports.SimpleChatPanelProvider = SimpleChatPanelProvider;
async function newChatModelfromTranscriptJSON(json, modelID) {
    const messages = json.interactions.map((interaction) => {
        return [
            {
                message: {
                    speaker: "human",
                    text: interaction.humanMessage.text,
                },
                displayText: interaction.humanMessage.displayText,
                newContextUsed: deserializedContextFilesToContextItems(interaction.usedContextFiles, interaction.fullContext),
            },
            {
                message: {
                    speaker: "assistant",
                    text: interaction.assistantMessage.text,
                },
                displayText: interaction.assistantMessage.displayText,
            },
        ];
    });
    return new SimpleChatModel_1.SimpleChatModel(json.chatModel || modelID, (await Promise.all(messages)).flat(), json.id, json.chatTitle, json.enhancedContext?.selectedRepos);
}
async function contextFilesToContextItems(editor, files, fetchContent) {
    return (await Promise.all(files.map(async (file) => {
        const range = (0, chat_helpers_1.viewRangeToRange)(file.range);
        let text = file.content;
        if (!text && fetchContent) {
            try {
                text = await editor.getTextEditorContentForFile(file.uri, range);
            }
            catch (error) {
                void vscode.window.showErrorMessage(`Cody could not include context from ${file.uri}. (Reason: ${error})`);
                return null;
            }
        }
        return {
            uri: file.uri,
            range,
            text: text || "",
            source: file.source,
        };
    }))).filter(cody_shared_1.isDefined);
}
exports.contextFilesToContextItems = contextFilesToContextItems;
function deserializedContextFilesToContextItems(files, contextMessages) {
    const contextByFile = new Map();
    for (const contextMessage of contextMessages) {
        if (!contextMessage.file) {
            continue;
        }
        contextByFile.set(contextMessage.file.uri.toString(), contextMessage);
    }
    return files.map((file) => {
        const range = (0, chat_helpers_1.viewRangeToRange)(file.range);
        let text = file.content;
        if (!text) {
            const contextMessage = contextByFile.get(file.uri.toString());
            if (contextMessage) {
                text = (0, chat_helpers_1.stripContextWrapper)(contextMessage.text || "");
            }
        }
        return {
            uri: file.uri,
            range,
            text: text || "",
            source: file.source,
            repoName: file.repoName,
            revision: file.revision,
            title: file.title,
        };
    });
}
function isAbortError(error) {
    return error.message === "aborted" || error.message === "socket hang up";
}
