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
exports.ContextProvider = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const configuration_1 = require("../configuration");
const active_editor_1 = require("../editor/active-editor");
const enhanced_context_status_1 = require("../local-context/enhanced-context-status");
const log_1 = require("../log");
const repositoryHelpers_1 = require("../repository/repositoryHelpers");
const LocalAppDetector_1 = require("../services/LocalAppDetector");
const telemetry_1 = require("../services/telemetry");
const telemetry_v2_1 = require("../services/telemetry-v2");
const AgentEventEmitter_1 = require("../testutils/AgentEventEmitter");
var ContextEvent;
(function (ContextEvent) {
    ContextEvent["Auth"] = "auth";
})(ContextEvent || (ContextEvent = {}));
class ContextProvider {
    config;
    editor;
    symf;
    authProvider;
    localEmbeddings;
    remoteSearch;
    // We fire messages from ContextProvider to the sidebar webview.
    // TODO(umpox): Should we add support for showing context in other places (i.e. within inline chat)?
    webview;
    // Fire event to let subscribers know that the configuration has changed
    configurationChangeEvent = new vscode.EventEmitter();
    // Codebase-context-related state
    currentWorkspaceRoot;
    disposables = [];
    statusAggregator = new enhanced_context_status_1.ContextStatusAggregator();
    statusEmbeddings = undefined;
    codebaseContext;
    constructor(config, // should use codebaseContext.getCodebase() rather than config.codebase
    editor, symf, authProvider, localEmbeddings, remoteSearch) {
        this.config = config;
        this.editor = editor;
        this.symf = symf;
        this.authProvider = authProvider;
        this.localEmbeddings = localEmbeddings;
        this.remoteSearch = remoteSearch;
        this.disposables.push(this.configurationChangeEvent);
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor(async () => {
            await this.updateCodebaseContext();
        }), vscode.workspace.onDidChangeWorkspaceFolders(async () => {
            await this.updateCodebaseContext();
        }), this.statusAggregator, this.statusAggregator.onDidChangeStatus(() => {
            this.contextStatusChangeEmitter.fire(this);
        }), this.contextStatusChangeEmitter);
        if (this.localEmbeddings) {
            this.disposables.push(this.localEmbeddings.onChange(() => {
                void this.forceUpdateCodebaseContext();
            }));
        }
        if (this.remoteSearch) {
            this.disposables.push(this.remoteSearch);
        }
    }
    get context() {
        if (!this.codebaseContext) {
            throw new Error('retrieved codebase context before initialization');
        }
        return this.codebaseContext;
    }
    // Initializes context provider state. This blocks extension activation and
    // chat startup. Despite being called 'init', this is called multiple times:
    // - Once on extension activation.
    // - With every MessageProvider, including ChatPanelProvider.
    async init() {
        await this.updateCodebaseContext();
    }
    onConfigurationChange(newConfig) {
        (0, log_1.logDebug)('ContextProvider:onConfigurationChange', 'using codebase', newConfig.codebase);
        this.config = newConfig;
        const authStatus = this.authProvider.getAuthStatus();
        if (authStatus.endpoint) {
            this.config.serverEndpoint = authStatus.endpoint;
        }
        if (this.configurationChangeEvent instanceof AgentEventEmitter_1.AgentEventEmitter) {
            // NOTE: we must return a promise here from the event handlers to
            // allow the agent to await on changes to authentication
            // credentials.
            return this.configurationChangeEvent.cody_fireAsync(null);
        }
        this.configurationChangeEvent.fire();
        return Promise.resolve();
    }
    async forceUpdateCodebaseContext() {
        this.currentWorkspaceRoot = undefined;
        return this.syncAuthStatus();
    }
    async updateCodebaseContext() {
        if (!this.editor.getActiveTextEditor() && vscode.window.visibleTextEditors.length !== 0) {
            // these are ephemeral
            return;
        }
        const workspaceRoot = this.editor.getWorkspaceRootUri();
        if (!workspaceRoot || workspaceRoot.toString() === this.currentWorkspaceRoot?.toString()) {
            return;
        }
        this.currentWorkspaceRoot = workspaceRoot;
        const codebaseContext = await getCodebaseContext(this.config, this.authProvider.getAuthStatus(), this.symf, this.editor, this.localEmbeddings, this.remoteSearch);
        if (!codebaseContext) {
            return;
        }
        // After await, check we're still hitting the same workspace root.
        if (this.currentWorkspaceRoot &&
            this.currentWorkspaceRoot.toString() !== workspaceRoot.toString()) {
            return;
        }
        this.codebaseContext = codebaseContext;
        this.statusEmbeddings?.dispose();
        if (this.localEmbeddings) {
            this.statusEmbeddings = this.statusAggregator.addProvider(this.localEmbeddings);
        }
    }
    /**
     * Save, verify, and sync authStatus between extension host and webview
     * activate extension when user has valid login
     */
    async syncAuthStatus() {
        const authStatus = this.authProvider.getAuthStatus();
        // Update config to the latest one and fire configure change event to update external services
        const newConfig = await (0, configuration_1.getFullConfig)();
        if (authStatus.siteVersion) {
            // Update codebase context
            const codebaseContext = await getCodebaseContext(newConfig, this.authProvider.getAuthStatus(), this.symf, this.editor, this.localEmbeddings, this.remoteSearch);
            if (codebaseContext) {
                this.codebaseContext = codebaseContext;
            }
        }
        await this.publishConfig();
        await this.onConfigurationChange(newConfig);
        // When logged out, user's endpoint will be set to null
        const isLoggedOut = !authStatus.isLoggedIn && !authStatus.endpoint;
        const eventValue = isLoggedOut ? 'disconnected' : authStatus.isLoggedIn ? 'connected' : 'failed';
        switch (ContextEvent.Auth) {
            case 'auth':
                telemetry_1.telemetryService.log(`${(0, telemetry_1.logPrefix)(newConfig.agentIDE)}:Auth:${eventValue}`, undefined, {
                    agent: true,
                });
                telemetry_v2_1.telemetryRecorder.recordEvent('cody.auth', eventValue);
                break;
        }
    }
    /**
     * Publish the config to the webview.
     */
    async publishConfig() {
        const send = async () => {
            this.config = await (0, configuration_1.getFullConfig)();
            // check if the new configuration change is valid or not
            const authStatus = this.authProvider.getAuthStatus();
            const localProcess = (0, LocalAppDetector_1.getProcessInfo)();
            const configForWebview = {
                ...localProcess,
                debugEnable: this.config.debugEnable,
                serverEndpoint: this.config.serverEndpoint,
                experimentalGuardrails: this.config.experimentalGuardrails,
            };
            const workspaceFolderUris = vscode.workspace.workspaceFolders?.map(folder => folder.uri.toString()) ?? [];
            // update codebase context on configuration change
            await this.updateCodebaseContext();
            await this.webview?.postMessage({
                type: 'config',
                config: configForWebview,
                authStatus,
                workspaceFolderUris,
            });
            (0, log_1.logDebug)('Cody:publishConfig', 'configForWebview', { verbose: configForWebview });
        };
        await send();
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
    // ContextStatusProvider implementation
    contextStatusChangeEmitter = new vscode.EventEmitter();
    get status() {
        return this.statusAggregator.status;
    }
    onDidChangeStatus(callback) {
        return this.contextStatusChangeEmitter.event(callback);
    }
}
exports.ContextProvider = ContextProvider;
/**
 * Gets codebase context for the current workspace.
 * @returns CodebaseContext if a codebase can be determined, else null
 */
async function getCodebaseContext(config, authStatus, symf, editor, localEmbeddings, remoteSearch) {
    const workspaceRoot = editor.getWorkspaceRootUri();
    if (!workspaceRoot) {
        return null;
    }
    const currentFile = (0, active_editor_1.getEditor)()?.active?.document?.uri;
    // Get codebase from config or fallback to getting codebase name from current file URL
    // Always use the codebase from config as this is manually set by the user
    const codebase = config.codebase || (currentFile ? (0, repositoryHelpers_1.getCodebaseFromWorkspaceUri)(currentFile) : config.codebase);
    if (!codebase) {
        return null;
    }
    const isConsumer = authStatus.isDotCom;
    // TODO(dpc): Support multiple workspace roots when
    // https://github.com/sourcegraph/bfg-private/issues/145 is fixed and
    // cody-engine local embeddings can consume them.
    const repoDirUri = (0, repositoryHelpers_1.gitDirectoryUri)(workspaceRoot);
    const hasLocalEmbeddings = repoDirUri ? localEmbeddings?.load(repoDirUri) : false;
    return new cody_shared_1.CodebaseContext(config, codebase, 
    // Use local embeddings if we have them.
    isConsumer && (await hasLocalEmbeddings) ? localEmbeddings : undefined, 
    // TODO(dpc): This should query index availability before passing symf.
    isConsumer ? symf : undefined, isConsumer ? undefined : remoteSearch);
}
