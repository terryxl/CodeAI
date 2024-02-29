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
exports.start = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const ChatManager_1 = require("./chat/chat-view/ChatManager");
const ContextProvider_1 = require("./chat/ContextProvider");
const protocol_1 = require("./chat/protocol");
const CodeActionProvider_1 = require("./code-actions/CodeActionProvider");
const GhostHintDecorator_1 = require("./commands/GhostHintDecorator");
const create_inline_completion_item_provider_1 = require("./completions/create-inline-completion-item-provider");
const configuration_1 = require("./configuration");
const manager_1 = require("./edit/manager");
const displayPathEnvInfo_1 = require("./editor/displayPathEnvInfo");
const vscode_editor_1 = require("./editor/vscode-editor");
const external_services_1 = require("./external-services");
const log_1 = require("./log");
const setup_notification_1 = require("./notifications/setup-notification");
const repositoryHelpers_1 = require("./repository/repositoryHelpers");
const SearchViewProvider_1 = require("./search/SearchViewProvider");
const AuthProvider_1 = require("./services/AuthProvider");
const FeedbackOptions_1 = require("./services/FeedbackOptions");
const GuardrailsProvider_1 = require("./services/GuardrailsProvider");
const HistoryChat_1 = require("./services/HistoryChat");
const LocalStorageProvider_1 = require("./services/LocalStorageProvider");
const SecretStorageProvider_1 = require("./services/SecretStorageProvider");
const StatusBar_1 = require("./services/StatusBar");
const telemetry_1 = require("./services/telemetry");
const telemetry_v2_1 = require("./services/telemetry-v2");
const codeblock_action_tracker_1 = require("./services/utils/codeblock-action-tracker");
const parse_tree_cache_1 = require("./tree-sitter/parse-tree-cache");
const CommandsController_1 = require("./commands/CommandsController");
const get_commands_1 = require("./commands/utils/get-commands");
const enterprise_context_factory_1 = require("./context/enterprise-context-factory");
const cody_pro_expiration_1 = require("./notifications/cody-pro-expiration");
const execute_1 = require("./commands/execute");
const SidebarCommands_1 = require("./services/SidebarCommands");
/**
 * Start the extension, watching all relevant configuration and secrets for changes.
 */
async function start(context, platform) {
    // Set internal storage fields for storage provider singletons
    LocalStorageProvider_1.localStorage.setStorage(context.globalState);
    if (SecretStorageProvider_1.secretStorage instanceof SecretStorageProvider_1.VSCodeSecretStorage) {
        SecretStorageProvider_1.secretStorage.setStorage(context.secrets);
    }
    (0, cody_shared_1.setLogger)({ logDebug: log_1.logDebug, logError: log_1.logError });
    const disposables = [];
    const { disposable, onConfigurationChange } = await register(context, await (0, configuration_1.getFullConfig)(), platform);
    disposables.push(disposable);
    // Re-initialize when configuration
    disposables.push(vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (event.affectsConfiguration('cody')) {
            const config = await (0, configuration_1.getFullConfig)();
            await onConfigurationChange(config);
            platform.onConfigurationChange?.(config);
            if (config.chatPreInstruction) {
                cody_shared_1.PromptMixin.addCustom((0, cody_shared_1.newPromptMixin)(config.chatPreInstruction));
            }
        }
    }));
    return vscode.Disposable.from(...disposables);
}
exports.start = start;
// Registers commands and webview given the config.
const register = async (context, initialConfig, platform) => {
    const disposables = [];
    // Initialize `displayPath` first because it might be used to display paths in error messages
    // from the subsequent initialization.
    disposables.push((0, displayPathEnvInfo_1.manageDisplayPathEnvInfoForExtension)());
    // Set codyignore list on git extension startup
    const gitAPI = await (0, repositoryHelpers_1.gitAPIinit)();
    if (gitAPI) {
        disposables.push(gitAPI);
    }
    const isExtensionModeDevOrTest = context.extensionMode === vscode.ExtensionMode.Development ||
        context.extensionMode === vscode.ExtensionMode.Test;
    await configureEventsInfra(initialConfig, isExtensionModeDevOrTest);
    const editor = new vscode_editor_1.VSCodeEditor();
    // Could we use the `initialConfig` instead?
    const workspaceConfig = vscode.workspace.getConfiguration();
    const config = (0, configuration_1.getConfiguration)(workspaceConfig);
    if (config.chatPreInstruction) {
        cody_shared_1.PromptMixin.addCustom((0, cody_shared_1.newPromptMixin)(config.chatPreInstruction));
    }
    (0, parse_tree_cache_1.parseAllVisibleDocuments)();
    disposables.push(vscode.window.onDidChangeVisibleTextEditors(parse_tree_cache_1.parseAllVisibleDocuments));
    disposables.push(vscode.workspace.onDidChangeTextDocument(parse_tree_cache_1.updateParseTreeOnEdit));
    // Enable tracking for pasting chat responses into editor text
    disposables.push(vscode.workspace.onDidChangeTextDocument(async (e) => {
        const changedText = e.contentChanges[0]?.text;
        // Skip if the document is not a file or if the copied text is from insert
        if (!changedText || e.document.uri.scheme !== 'file') {
            return;
        }
        await (0, codeblock_action_tracker_1.onTextDocumentChange)(changedText);
    }));
    const authProvider = new AuthProvider_1.AuthProvider(initialConfig);
    await authProvider.init();
    cody_shared_1.graphqlClient.onConfigurationChange(initialConfig);
    void cody_shared_1.featureFlagProvider.syncAuthStatus();
    const { intentDetector, chatClient, codeCompletionsClient, guardrails, localEmbeddings, onConfigurationChange: externalServicesOnDidConfigurationChange, symfRunner, } = await (0, external_services_1.configureExternalServices)(context, initialConfig, platform);
    if (symfRunner) {
        disposables.push(symfRunner);
    }
    const enterpriseContextFactory = new enterprise_context_factory_1.EnterpriseContextFactory();
    disposables.push(enterpriseContextFactory);
    const contextProvider = new ContextProvider_1.ContextProvider(initialConfig, editor, symfRunner, authProvider, localEmbeddings, enterpriseContextFactory.createRemoteSearch());
    disposables.push(contextProvider);
    await contextProvider.init();
    // Shared configuration that is required for chat views to send and receive messages
    const messageProviderOptions = {
        chat: chatClient,
        intentDetector,
        guardrails,
        editor,
        authProvider,
        contextProvider,
    };
    // Evaluate a mock feature flag for the purpose of an A/A test. No functionality is affected by this flag.
    await cody_shared_1.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyChatMockTest);
    const chatManager = new ChatManager_1.ChatManager({
        ...messageProviderOptions,
        extensionUri: context.extensionUri,
        config,
    }, chatClient, enterpriseContextFactory, localEmbeddings || null, symfRunner || null, guardrails);
    const ghostHintDecorator = new GhostHintDecorator_1.GhostHintDecorator(authProvider);
    const editorManager = new manager_1.EditManager({
        chat: chatClient,
        editor,
        contextProvider,
        ghostHintDecorator,
        authProvider,
    });
    disposables.push(ghostHintDecorator, editorManager, new CodeActionProvider_1.CodeActionProvider({ contextProvider }));
    let oldConfig = JSON.stringify(initialConfig);
    async function onConfigurationChange(newConfig) {
        if (oldConfig === JSON.stringify(newConfig)) {
            return Promise.resolve();
        }
        const promises = [];
        oldConfig = JSON.stringify(newConfig);
        promises.push(cody_shared_1.featureFlagProvider.syncAuthStatus());
        cody_shared_1.graphqlClient.onConfigurationChange(newConfig);
        promises.push(contextProvider.onConfigurationChange(newConfig));
        externalServicesOnDidConfigurationChange(newConfig);
        promises.push(configureEventsInfra(newConfig, isExtensionModeDevOrTest));
        platform.onConfigurationChange?.(newConfig);
        symfRunner?.setSourcegraphAuth(newConfig.serverEndpoint, newConfig.accessToken);
        enterpriseContextFactory.clientConfigurationDidChange();
        promises.push(localEmbeddings?.setAccessToken(newConfig.serverEndpoint, newConfig.accessToken) ??
            Promise.resolve());
        promises.push(setupAutocomplete());
        await Promise.all(promises);
    }
    // Register tree views
    disposables.push(chatManager, vscode.window.registerWebviewViewProvider('cody.chat', chatManager.sidebarViewController, {
        webviewOptions: { retainContextWhenHidden: true },
    }), 
    // Update external services when configurationChangeEvent is fired by chatProvider
    contextProvider.configurationChangeEvent.event(async () => {
        const newConfig = await (0, configuration_1.getFullConfig)();
        await onConfigurationChange(newConfig);
    }));
    // Important to respect `config.experimentalSymfContext`. The agent
    // currently crashes with a cryptic error when running with symf enabled so
    // we need a way to reliably disable symf until we fix the root problem.
    if (symfRunner && config.experimentalSymfContext) {
        const searchViewProvider = new SearchViewProvider_1.SearchViewProvider(context.extensionUri, symfRunner);
        disposables.push(searchViewProvider);
        searchViewProvider.initialize();
        disposables.push(vscode.window.registerWebviewViewProvider('cody.search', searchViewProvider, {
            webviewOptions: { retainContextWhenHidden: true },
        }));
    }
    // Adds a change listener to the auth provider that syncs the auth status
    authProvider.addChangeListener(async (authStatus) => {
        // Chat Manager uses Simple Context Provider
        await chatManager.syncAuthStatus(authStatus);
        editorManager.syncAuthStatus(authStatus);
        // Update context provider first it will also update the configuration
        await contextProvider.syncAuthStatus();
        const parallelPromises = [];
        parallelPromises.push(cody_shared_1.featureFlagProvider.syncAuthStatus());
        // feature flag provider
        // Symf
        if (symfRunner && authStatus.isLoggedIn) {
            parallelPromises.push((0, SecretStorageProvider_1.getAccessToken)()
                .then(token => symfRunner.setSourcegraphAuth(authStatus.endpoint, token))
                .catch(() => { }));
        }
        else {
            symfRunner?.setSourcegraphAuth(null, null);
        }
        parallelPromises.push(setupAutocomplete());
        await Promise.all(parallelPromises);
    });
    // Sync initial auth status
    await chatManager.syncAuthStatus(authProvider.getAuthStatus());
    const commandsManager = platform.createCommandsProvider?.();
    (0, CommandsController_1.setCommandController)(commandsManager);
    // Execute Cody Commands and Cody Custom Commands
    const executeCommand = (commandKey, args) => {
        return executeCommandUnsafe(commandKey, args).catch(error => {
            if (error instanceof Error) {
                console.log(error.stack);
            }
            (0, log_1.logError)('executeCommand', commandKey, args, error);
            return undefined;
        });
    };
    const executeCommandUnsafe = async (id, args) => {
        const { commands } = await cody_shared_1.ConfigFeaturesSingleton.getInstance().getConfigFeatures();
        if (!commands) {
            void vscode.window.showErrorMessage('This feature has been disabled by your Sourcegraph site admin.');
            return undefined;
        }
        // Process command with the commands controller
        return await (0, CommandsController_1.executeCodyCommand)(id, (0, get_commands_1.newCodyCommandArgs)(args));
    };
    // Register Cody Commands
    disposables.push(vscode.commands.registerCommand('cody.action.command', (id, a) => executeCommand(id, a)), vscode.commands.registerCommand('cody.command.explain-code', a => (0, execute_1.executeExplainCommand)(a)), vscode.commands.registerCommand('cody.command.smell-code', a => (0, execute_1.executeSmellCommand)(a)), vscode.commands.registerCommand('cody.command.document-code', a => (0, execute_1.executeDocCommand)(a)), vscode.commands.registerCommand('cody.command.generate-tests', a => (0, execute_1.executeTestChatCommand)(a)), vscode.commands.registerCommand('cody.command.unit-tests', a => (0, execute_1.executeTestEditCommand)(a)), vscode.commands.registerCommand('cody.command.tests-cases', a => (0, execute_1.executeTestCaseEditCommand)(a)), vscode.commands.registerCommand('cody.command.explain-output', a => (0, execute_1.executeExplainOutput)(a)));
    const statusBar = (0, StatusBar_1.createStatusBar)();
    disposables.push(
    // Tests
    // Access token - this is only used in configuration tests
    vscode.commands.registerCommand('cody.test.token', async (url, token) => authProvider.auth(url, token)), 
    // Auth
    vscode.commands.registerCommand('cody.auth.signin', () => authProvider.signinMenu()), vscode.commands.registerCommand('cody.auth.signout', () => authProvider.signoutMenu()), vscode.commands.registerCommand('cody.auth.account', () => authProvider.accountMenu()), vscode.commands.registerCommand('cody.auth.support', () => (0, FeedbackOptions_1.showFeedbackSupportQuickPick)()), vscode.commands.registerCommand('cody.auth.status', () => authProvider.getAuthStatus()), // Used by the agent
    vscode.commands.registerCommand('cody.agent.auth.authenticate', async ({ serverEndpoint, accessToken, customHeaders }) => {
        if (typeof serverEndpoint !== 'string') {
            throw new TypeError('serverEndpoint is required');
        }
        if (typeof accessToken !== 'string') {
            throw new TypeError('accessToken is required');
        }
        return (await authProvider.auth(serverEndpoint, accessToken, customHeaders)).authStatus;
    }), 
    // Chat
    vscode.commands.registerCommand('cody.focus', () => vscode.commands.executeCommand('cody.chat.focus')), vscode.commands.registerCommand('cody.settings.extension', () => vscode.commands.executeCommand('workbench.action.openSettings', {
        query: '@ext:sourcegraph.cody-ai',
    })), vscode.commands.registerCommand('cody.chat.history.panel', async () => {
        await (0, HistoryChat_1.displayHistoryQuickPick)(authProvider.getAuthStatus());
    }), vscode.commands.registerCommand('cody.settings.extension.chat', () => vscode.commands.executeCommand('workbench.action.openSettings', {
        query: '@ext:sourcegraph.cody-ai chat',
    })), 
    // Account links
    ...(0, SidebarCommands_1.registerSidebarCommands)(), 
    // Account links
    vscode.commands.registerCommand('cody.show-rate-limit-modal', async (userMessage, retryMessage, upgradeAvailable) => {
        if (upgradeAvailable) {
            const option = await vscode.window.showInformationMessage('Upgrade to Cody Pro', {
                modal: true,
                detail: `${userMessage}\n\nUpgrade to Cody Pro for unlimited autocomplete suggestions, chat messages and commands.\n\n${retryMessage}`,
            }, 'Upgrade', 'See Plans');
            // Both options go to the same URL
            if (option) {
                void vscode.env.openExternal(vscode.Uri.parse(protocol_1.ACCOUNT_UPGRADE_URL.toString()));
            }
        }
        else {
            const option = await vscode.window.showInformationMessage('Rate Limit Exceeded', {
                modal: true,
                detail: `${userMessage}\n\n${retryMessage}`,
            }, 'Learn More');
            if (option) {
                void vscode.env.openExternal(vscode.Uri.parse(protocol_1.ACCOUNT_LIMITS_INFO_URL.toString()));
            }
        }
    }), 
    // Register URI Handler (e.g. vscode://sourcegraph.cody-ai)
    vscode.window.registerUriHandler({
        handleUri: async (uri) => {
            if (uri.path === '/app-done') {
                // This is an old re-entrypoint from App that is a no-op now.
            }
            else {
                await authProvider.tokenCallbackHandler(uri, config.customHeaders);
            }
        },
    }), statusBar, 
    // Walkthrough / Support
    vscode.commands.registerCommand('cody.feedback', () => vscode.env.openExternal(vscode.Uri.parse(protocol_1.CODY_FEEDBACK_URL.href))), vscode.commands.registerCommand('cody.welcome', async () => {
        telemetry_1.telemetryService.log('CodyVSCodeExtension:walkthrough:clicked', { page: 'welcome' }, { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.walkthrough', 'clicked');
        // Hack: We have to run this twice to force VS Code to register the walkthrough
        // Open issue: https://github.com/microsoft/vscode/issues/186165
        await vscode.commands.executeCommand('workbench.action.openWalkthrough');
        return vscode.commands.executeCommand('workbench.action.openWalkthrough', 'sourcegraph.cody-ai#welcome', false);
    }), vscode.commands.registerCommand('cody.welcome-mock', () => vscode.commands.executeCommand('workbench.action.openWalkthrough', 'sourcegraph.cody-ai#welcome', false)), vscode.commands.registerCommand('cody.walkthrough.showLogin', () => vscode.commands.executeCommand('workbench.view.extension.cody')), vscode.commands.registerCommand('cody.walkthrough.showChat', () => chatManager.setWebviewView('chat')), vscode.commands.registerCommand('cody.walkthrough.showFixup', () => chatManager.setWebviewView('chat')), vscode.commands.registerCommand('cody.walkthrough.showExplain', async () => {
        telemetry_1.telemetryService.log('CodyVSCodeExtension:walkthrough:clicked', { page: 'showExplain' }, { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.walkthrough.showExplain', 'clicked');
        await chatManager.setWebviewView('chat');
    }), 
    // Check if user has just moved back from a browser window to upgrade cody pro
    vscode.window.onDidChangeWindowState(async (ws) => {
        const authStatus = authProvider.getAuthStatus();
        const endpoint = authStatus.endpoint;
        if (ws.focused && endpoint && (0, cody_shared_1.isDotCom)(endpoint) && authStatus.isLoggedIn) {
            const res = await cody_shared_1.graphqlClient.getCurrentUserCodyProEnabled();
            if (res instanceof Error) {
                console.error(res);
                return;
            }
            authStatus.userCanUpgrade = !res.codyProEnabled;
            void chatManager.syncAuthStatus(authStatus);
        }
    }), new cody_pro_expiration_1.CodyProExpirationNotifications(cody_shared_1.graphqlClient, authProvider, cody_shared_1.featureFlagProvider, vscode.window.showInformationMessage, vscode.env.openExternal), 
    // For register sidebar clicks
    vscode.commands.registerCommand('cody.sidebar.click', (name, command) => {
        const source = 'sidebar';
        telemetry_1.telemetryService.log(`CodyVSCodeExtension:command:${name}:clicked`, { source });
        telemetry_v2_1.telemetryRecorder.recordEvent(`cody.command.${name}`, 'clicked', {
            privateMetadata: { source },
        });
        void vscode.commands.executeCommand(command, [source]);
    }));
    /**
     * Signed out status bar indicator
     */
    let removeAuthStatusBarError;
    function updateAuthStatusBarIndicator() {
        if (removeAuthStatusBarError) {
            removeAuthStatusBarError();
            removeAuthStatusBarError = undefined;
        }
        if (!authProvider.getAuthStatus().isLoggedIn) {
            removeAuthStatusBarError = statusBar.addError({
                title: 'Sign In to Use Cody',
                errorType: 'auth',
                description: 'You need to sign in to use Cody.',
                onSelect: () => {
                    // Bring up the sidebar view
                    void vscode.commands.executeCommand('cody.focus');
                },
            });
        }
    }
    authProvider.addChangeListener(() => updateAuthStatusBarIndicator());
    updateAuthStatusBarIndicator();
    let setupAutocompleteQueue = Promise.resolve(); // Create a promise chain to avoid parallel execution
    let autocompleteDisposables = [];
    function disposeAutocomplete() {
        if (autocompleteDisposables) {
            for (const d of autocompleteDisposables) {
                d.dispose();
            }
            autocompleteDisposables = [];
        }
    }
    disposables.push({
        dispose: disposeAutocomplete,
    });
    function setupAutocomplete() {
        setupAutocompleteQueue = setupAutocompleteQueue
            .then(async () => {
            const config = await (0, configuration_1.getFullConfig)();
            if (!config.autocomplete) {
                disposeAutocomplete();
                if (config.isRunningInsideAgent) {
                    throw new Error('The setting `config.autocomplete` evaluated to `false`. It must be true when running inside the agent. ' +
                        'To fix this problem, make sure that the setting cody.autocomplete.enabled has the value true.');
                }
                return;
            }
            // If completions are already initialized and still enabled, we need to reset the
            // completion provider.
            disposeAutocomplete();
            const autocompleteFeatureFlagChangeSubscriber = cody_shared_1.featureFlagProvider.onFeatureFlagChanged('cody-autocomplete', setupAutocomplete);
            autocompleteDisposables.push({ dispose: autocompleteFeatureFlagChangeSubscriber });
            autocompleteDisposables.push(await (0, create_inline_completion_item_provider_1.createInlineCompletionItemProvider)({
                config,
                client: codeCompletionsClient,
                statusBar,
                authProvider,
                triggerNotice: notice => {
                    void chatManager.triggerNotice(notice);
                },
                createBfgRetriever: platform.createBfgRetriever,
            }));
        })
            .catch(error => {
            console.error('Error creating inline completion item provider:', error);
        });
        return setupAutocompleteQueue;
    }
    const autocompleteSetup = setupAutocomplete().catch(() => { });
    if (initialConfig.experimentalGuardrails) {
        const guardrailsProvider = new GuardrailsProvider_1.GuardrailsProvider(guardrails, editor);
        disposables.push(vscode.commands.registerCommand('cody.guardrails.debug', async () => {
            await guardrailsProvider.debugEditorSelection();
        }));
    }
    // INC-267 do NOT await on this promise. This promise triggers
    // `vscode.window.showInformationMessage()`, which only resolves after the
    // user has clicked on "Setup". Awaiting on this promise will make the Cody
    // extension timeout during activation.
    void (0, setup_notification_1.showSetupNotification)(initialConfig);
    // Register a serializer for reviving the chat panel on reload
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(ChatManager_1.CodyChatPanelViewType, {
            async deserializeWebviewPanel(webviewPanel, chatID) {
                if (chatID && webviewPanel.title) {
                    (0, log_1.logDebug)('main:deserializeWebviewPanel', 'reviving last unclosed chat panel');
                    await chatManager.revive(webviewPanel, chatID);
                }
            },
        });
    }
    await autocompleteSetup;
    return {
        disposable: vscode.Disposable.from(...disposables),
        onConfigurationChange,
    };
};
/**
 * Create or update events infrastructure, both legacy (telemetryService) and
 * new (telemetryRecorder)
 */
async function configureEventsInfra(config, isExtensionModeDevOrTest) {
    await (0, telemetry_1.createOrUpdateEventLogger)(config, isExtensionModeDevOrTest);
    await (0, telemetry_v2_1.createOrUpdateTelemetryRecorderProvider)(config, isExtensionModeDevOrTest);
}
