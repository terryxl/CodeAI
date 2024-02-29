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
exports.SidebarViewController = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../../log");
const AuthProviderSimplified_1 = require("../../services/AuthProviderSimplified");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const workspace_action_1 = require("../../services/utils/workspace-action");
const ChatManager_1 = require("./ChatManager");
class SidebarViewController {
    extensionUri;
    webview;
    disposables = [];
    authProvider;
    contextProvider;
    constructor({ extensionUri, ...options }) {
        this.authProvider = options.authProvider;
        this.contextProvider = options.contextProvider;
        this.extensionUri = extensionUri;
    }
    async onDidReceiveMessage(message) {
        switch (message.command) {
            case 'ready':
                await this.contextProvider.syncAuthStatus();
                break;
            case 'initialized':
                (0, log_1.logDebug)('SidebarViewController:onDidReceiveMessage', 'initialized');
                await this.setWebviewView('chat');
                await this.contextProvider.init();
                break;
            case 'auth':
                if (message.authKind === 'callback' && message.endpoint) {
                    this.authProvider.redirectToEndpointLogin(message.endpoint);
                    break;
                }
                if (message.authKind === 'simplified-onboarding') {
                    const authProviderSimplified = new AuthProviderSimplified_1.AuthProviderSimplified();
                    const authMethod = message.authMethod || 'dotcom';
                    void authProviderSimplified.openExternalAuthUrl(this.authProvider, authMethod);
                    break;
                }
                // cody.auth.signin or cody.auth.signout
                await vscode.commands.executeCommand(`cody.auth.${message.authKind}`);
                break;
            case 'reload':
                await this.authProvider.reloadAuthStatus();
                telemetry_1.telemetryService.log('CodyVSCodeExtension:authReloadButton:clicked', undefined, {
                    hasV2Event: true,
                });
                telemetry_v2_1.telemetryRecorder.recordEvent('cody.authReloadButton', 'clicked');
                break;
            case 'event':
                telemetry_1.telemetryService.log(message.eventName, message.properties);
                break;
            case 'links':
                void (0, workspace_action_1.openExternalLinks)(message.value);
                break;
            case 'simplified-onboarding':
                if (message.onboardingKind === 'web-sign-in-token') {
                    void vscode.window
                        .showInputBox({ prompt: 'Enter web sign-in token' })
                        .then(async (token) => {
                        if (!token) {
                            return;
                        }
                        const authStatus = await this.authProvider.auth(cody_shared_1.DOTCOM_URL.href, token);
                        if (!authStatus?.isLoggedIn) {
                            void vscode.window.showErrorMessage('Authentication failed. Please check your token and try again.');
                        }
                    });
                    break;
                }
                break;
            case 'show-page':
                await vscode.commands.executeCommand('show-page', message.page);
                break;
            default:
                this.handleError(new Error('Invalid request type from Webview'), 'system');
        }
    }
    async simplifiedOnboardingReloadEmbeddingsState() {
        await this.contextProvider.forceUpdateCodebaseContext();
    }
    /**
     * Display error message in webview as a banner alongside the chat.
     */
    handleError(error, type) {
        if (type === 'transcript') {
            // not required for non-chat view
            return;
        }
        void this.webview?.postMessage({ type: 'errors', errors: error.toString() });
    }
    /**
     * Set webview view
     */
    async setWebviewView(view) {
        await vscode.commands.executeCommand('cody.chat.focus');
        await this.webview?.postMessage({
            type: 'view',
            view: view,
        });
    }
    /**
     * create webview resources for Auth page
     */
    async resolveWebviewView(webviewView, _context, _token) {
        this.webview = webviewView.webview;
        this.contextProvider.webview = webviewView.webview;
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webviews');
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [webviewPath],
            enableCommandUris: true,
        };
        await (0, ChatManager_1.addWebviewViewHTML)(this.extensionUri, webviewView);
        // Register to receive messages from webview
        this.disposables.push(webviewView.webview.onDidReceiveMessage(message => this.onDidReceiveMessage(message)));
    }
}
exports.SidebarViewController = SidebarViewController;
