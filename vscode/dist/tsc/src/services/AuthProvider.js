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
exports.isNetworkError = exports.AuthProvider = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const ChatManager_1 = require("../chat/chat-view/ChatManager");
const protocol_1 = require("../chat/protocol");
const utils_1 = require("../chat/utils");
const configuration_1 = require("../configuration");
const log_1 = require("../log");
const AuthMenus_1 = require("./AuthMenus");
const LocalStorageProvider_1 = require("./LocalStorageProvider");
const SecretStorageProvider_1 = require("./SecretStorageProvider");
const telemetry_1 = require("./telemetry");
const telemetry_v2_1 = require("./telemetry-v2");
class AuthProvider {
    config;
    endpointHistory = [];
    appScheme = vscode.env.uriScheme;
    client = null;
    authStatus = protocol_1.defaultAuthStatus;
    listeners = new Set();
    constructor(config) {
        this.config = config;
        this.authStatus.endpoint = 'init';
        this.loadEndpointHistory();
    }
    // Sign into the last endpoint the user was signed into, if any
    async init() {
        let lastEndpoint = LocalStorageProvider_1.localStorage?.getEndpoint() || this.config.serverEndpoint;
        let token = (await SecretStorageProvider_1.secretStorage.get(lastEndpoint || '')) || this.config.accessToken;
        if (lastEndpoint === cody_shared_1.LOCAL_APP_URL.toString()) {
            // If the user last signed in to app, which talks to dotcom, try
            // signing them in to dotcom.
            (0, log_1.logDebug)('AuthProvider:init', 'redirecting App-signed in user to dotcom');
            lastEndpoint = cody_shared_1.DOTCOM_URL.toString();
            token = (await SecretStorageProvider_1.secretStorage.get(lastEndpoint)) || null;
        }
        (0, log_1.logDebug)('AuthProvider:init:lastEndpoint', lastEndpoint);
        await this.auth(lastEndpoint, token || null);
    }
    addChangeListener(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    // Display quickpick to select endpoint to sign in to
    async signinMenu(type, uri) {
        const mode = this.authStatus.isLoggedIn ? 'switch' : 'signin';
        (0, log_1.logDebug)('AuthProvider:signinMenu', mode);
        telemetry_1.telemetryService.log('CodyVSCodeExtension:login:clicked', { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.auth.login', 'clicked');
        const item = await (0, AuthMenus_1.AuthMenu)(mode, this.endpointHistory);
        if (!item) {
            return;
        }
        const menuID = type || item?.id;
        telemetry_1.telemetryService.log('CodyVSCodeExtension:auth:selectSigninMenu', { menuID, hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.auth.signin.menu', 'clicked', {
            privateMetadata: { menuID },
        });
        switch (menuID) {
            case 'enterprise': {
                const instanceUrl = await (0, AuthMenus_1.showInstanceURLInputBox)(item.uri);
                if (!instanceUrl) {
                    return;
                }
                this.authStatus.endpoint = instanceUrl;
                this.redirectToEndpointLogin(instanceUrl);
                break;
            }
            case 'dotcom':
                this.redirectToEndpointLogin(cody_shared_1.DOTCOM_URL.href);
                break;
            case 'token': {
                const instanceUrl = await (0, AuthMenus_1.showInstanceURLInputBox)(uri || item.uri);
                if (!instanceUrl) {
                    return;
                }
                await this.signinMenuForInstanceUrl(instanceUrl);
                break;
            }
            default: {
                // Auto log user if token for the selected instance was found in secret
                const selectedEndpoint = item.uri;
                const token = await SecretStorageProvider_1.secretStorage.get(selectedEndpoint);
                let authStatus = await this.auth(selectedEndpoint, token || null);
                if (!authStatus?.isLoggedIn) {
                    const newToken = await (0, AuthMenus_1.showAccessTokenInputBox)(item.uri);
                    if (!newToken) {
                        return;
                    }
                    authStatus = await this.auth(selectedEndpoint, newToken || null);
                }
                await showAuthResultMessage(selectedEndpoint, authStatus?.authStatus);
                (0, log_1.logDebug)('AuthProvider:signinMenu', mode, selectedEndpoint);
            }
        }
    }
    async signinMenuForInstanceUrl(instanceUrl) {
        const accessToken = await (0, AuthMenus_1.showAccessTokenInputBox)(instanceUrl);
        if (!accessToken) {
            return;
        }
        const authState = await this.auth(instanceUrl, accessToken);
        telemetry_1.telemetryService.log('CodyVSCodeExtension:auth:fromToken', {
            success: Boolean(authState?.isLoggedIn),
            hasV2Event: true,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.auth.signin.token', 'clicked', {
            metadata: {
                success: authState?.isLoggedIn ? 1 : 0,
            },
        });
        await showAuthResultMessage(instanceUrl, authState?.authStatus);
    }
    async signoutMenu() {
        telemetry_1.telemetryService.log('CodyVSCodeExtension:logout:clicked', { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.auth.logout', 'clicked');
        const { endpoint } = this.getAuthStatus();
        if (endpoint) {
            await this.signout(endpoint);
            (0, log_1.logDebug)('AuthProvider:signoutMenu', endpoint);
        }
    }
    async accountMenu() {
        if (!this.authStatus.authenticated || !this.authStatus.endpoint) {
            return;
        }
        if (!(0, cody_shared_1.isDotCom)(this.authStatus.endpoint)) {
            const username = this.authStatus.username || this.authStatus.displayName;
            const option = await vscode.window.showInformationMessage(`Signed in as @${username}`, {
                modal: true,
                detail: `Enterprise Instance:\n${this.authStatus.endpoint}`,
            }, 'Switch Account...', 'Sign Out');
            switch (option) {
                case 'Switch Account...':
                    await this.signinMenu();
                    break;
                case 'Sign Out':
                    await this.signoutMenu();
                    break;
            }
            return;
        }
        const detail = `Plan: ${this.authStatus.userCanUpgrade ? 'Cody Free' : 'Cody Pro'}`;
        const options = ['Manage Account', 'Switch Account...', 'Sign Out'];
        const displayName = this.authStatus.displayName || this.authStatus.username;
        const email = this.authStatus.primaryEmail || 'No Email';
        const option = await vscode.window.showInformationMessage(`Signed in as ${displayName} (${email})`, { modal: true, detail }, ...options);
        switch (option) {
            case 'Manage Account':
                void vscode.env.openExternal(vscode.Uri.parse(protocol_1.ACCOUNT_USAGE_URL.toString()));
                break;
            case 'Switch Account...':
                await this.signinMenu();
                break;
            case 'Sign Out':
                await this.signoutMenu();
                break;
        }
    }
    // Log user out of the selected endpoint (remove token from secret)
    async signout(endpoint) {
        await SecretStorageProvider_1.secretStorage.deleteToken(endpoint);
        await LocalStorageProvider_1.localStorage.deleteEndpoint();
        await this.auth(endpoint, null);
        this.authStatus.endpoint = '';
        await vscode.commands.executeCommand('setContext', ChatManager_1.CodyChatPanelViewType, false);
        await vscode.commands.executeCommand('setContext', 'cody.activated', false);
    }
    // Create Auth Status
    async makeAuthStatus(config) {
        const endpoint = config.serverEndpoint;
        const token = config.accessToken;
        if (!token || !endpoint) {
            return { ...protocol_1.defaultAuthStatus, endpoint };
        }
        // Cache the config and the GraphQL client
        if (this.config !== config || !this.client) {
            this.config = config;
            this.client = new cody_shared_1.SourcegraphGraphQLAPIClient(config);
        }
        // Version is for frontend to check if Cody is not enabled due to unsupported version when siteHasCodyEnabled is false
        const [{ enabled, version }, codyLLMConfiguration] = await Promise.all([
            this.client.isCodyEnabled(),
            this.client.getCodyLLMConfiguration(),
        ]);
        const configOverwrites = (0, cody_shared_1.isError)(codyLLMConfiguration) ? undefined : codyLLMConfiguration;
        const isDotCom = this.client.isDotCom();
        const userInfo = await this.client.getCurrentUserInfo();
        if (!isDotCom) {
            // check first if it's a network error
            if ((0, cody_shared_1.isError)(userInfo)) {
                if (isNetworkError(userInfo)) {
                    return { ...protocol_1.networkErrorAuthStatus, endpoint };
                }
                return { ...protocol_1.unauthenticatedStatus, endpoint };
            }
            return (0, utils_1.newAuthStatus)(endpoint, isDotCom, !(0, cody_shared_1.isError)(userInfo) && !!token, userInfo.hasVerifiedEmail, enabled, 
            /* userCanUpgrade: */ false, version, userInfo.avatarURL, userInfo.username, userInfo.displayName, userInfo.primaryEmail?.email, configOverwrites);
        }
        const isCodyEnabled = true;
        const proStatus = await this.client.getCurrentUserCodyProEnabled();
        // check first if it's a network error
        if ((0, cody_shared_1.isError)(userInfo)) {
            if (isNetworkError(userInfo)) {
                return { ...protocol_1.networkErrorAuthStatus, endpoint };
            }
            return { ...protocol_1.unauthenticatedStatus, endpoint };
        }
        const userCanUpgrade = isDotCom &&
            'codyProEnabled' in proStatus &&
            typeof proStatus.codyProEnabled === 'boolean' &&
            !proStatus.codyProEnabled;
        return (0, utils_1.newAuthStatus)(endpoint, isDotCom, !!userInfo.id, userInfo.hasVerifiedEmail, isCodyEnabled, userCanUpgrade, version, userInfo.avatarURL, userInfo.username, userInfo.displayName, userInfo.primaryEmail?.email, configOverwrites);
    }
    getAuthStatus() {
        return this.authStatus;
    }
    // It processes the authentication steps and stores the login info before sharing the auth status with chatview
    async auth(uri, token, customHeaders) {
        const endpoint = this.config.serverEndpoint || formatURL(uri) || '';
        const config = {
            serverEndpoint: endpoint,
            accessToken: token,
            customHeaders: customHeaders || this.config.customHeaders,
            modelsVendor: this.config.modelsVendor
        };
        const authStatus = await this.makeAuthStatus(config);
        const isLoggedIn = (0, protocol_1.isLoggedIn)(authStatus);
        authStatus.isLoggedIn = isLoggedIn;
        await this.storeAuthInfo(endpoint, token);
        this.syncAuthStatus(authStatus);
        await vscode.commands.executeCommand('setContext', 'cody.activated', isLoggedIn);
        return { authStatus, isLoggedIn };
    }
    // Set auth status in case of reload
    async reloadAuthStatus() {
        this.config = await (0, configuration_1.getFullConfig)();
        await this.auth(this.config.serverEndpoint, this.config.accessToken, this.config.customHeaders);
    }
    // Set auth status and share it with chatview
    syncAuthStatus(authStatus) {
        if (this.authStatus === authStatus) {
            return;
        }
        this.authStatus = authStatus;
        this.announceNewAuthStatus();
    }
    announceNewAuthStatus() {
        if (this.authStatus.endpoint === 'init') {
            return;
        }
        const authStatus = this.getAuthStatus();
        for (const listener of this.listeners) {
            listener(authStatus);
        }
    }
    // Register URI Handler (vscode://sourcegraph.cody-ai) for resolving token
    // sending back from sourcegraph.com
    async tokenCallbackHandler(uri, customHeaders) {
        const params = new URLSearchParams(uri.query);
        const token = params.get('code');
        const endpoint = this.authStatus.endpoint;
        if (!token || !endpoint) {
            return;
        }
        const authState = await this.auth(endpoint, token, customHeaders);
        telemetry_1.telemetryService.log('CodyVSCodeExtension:auth:fromCallback', {
            type: 'callback',
            from: 'web',
            success: Boolean(authState?.isLoggedIn),
            hasV2Event: true,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.auth.fromCallback.web', 'succeeded', {
            metadata: {
                success: authState?.isLoggedIn ? 1 : 0,
            },
        });
        if (authState?.isLoggedIn) {
            await vscode.window.showInformationMessage(`Signed in to ${endpoint}`);
        }
        else {
            await showAuthFailureMessage(endpoint);
        }
    }
    /** Open callback URL in browser to get token from instance. */
    redirectToEndpointLogin(uri) {
        const endpoint = formatURL(uri);
        if (!endpoint) {
            return;
        }
        if (vscode.env.uiKind === vscode.UIKind.Web) {
            // VS Code Web needs a different kind of callback using asExternalUri and changes to our
            // UserSettingsCreateAccessTokenCallbackPage.tsx page in the Sourcegraph web app. So,
            // just require manual token entry for now.
            const newTokenNoCallbackUrl = new URL('/user/settings/tokens/new', endpoint);
            void vscode.env.openExternal(vscode.Uri.parse(newTokenNoCallbackUrl.href));
            void this.signinMenuForInstanceUrl(endpoint);
            return;
        }
        const newTokenCallbackUrl = new URL('/user/settings/tokens/new/callback', endpoint);
        newTokenCallbackUrl.searchParams.append('requestFrom', this.appScheme === 'vscode-insiders' ? 'CODY_INSIDERS' : 'CODY');
        this.authStatus.endpoint = endpoint;
        void vscode.env.openExternal(vscode.Uri.parse(newTokenCallbackUrl.href));
    }
    // Refresh current endpoint history with the one from local storage
    loadEndpointHistory() {
        this.endpointHistory = LocalStorageProvider_1.localStorage.getEndpointHistory() || [];
    }
    // Store endpoint in local storage, token in secret storage, and update endpoint history
    async storeAuthInfo(endpoint, token) {
        if (!endpoint) {
            return;
        }
        await LocalStorageProvider_1.localStorage.saveEndpoint(endpoint);
        if (token) {
            await SecretStorageProvider_1.secretStorage.storeToken(endpoint, token);
        }
        this.loadEndpointHistory();
    }
    // Notifies the AuthProvider that the simplified onboarding experiment is
    // kicking off an authorization flow. That flow ends when (if) this
    // AuthProvider gets a call to tokenCallbackHandler.
    authProviderSimplifiedWillAttemptAuth() {
        // FIXME: This is equivalent to what redirectToEndpointLogin does. But
        // the existing design is weak--it mixes other authStatus with this
        // endpoint and races with everything else this class does.
        // Simplified onboarding only supports dotcom.
        this.authStatus.endpoint = cody_shared_1.DOTCOM_URL.toString();
    }
}
exports.AuthProvider = AuthProvider;
function isNetworkError(error) {
    const message = error.message;
    return (message.includes('ENOTFOUND') ||
        message.includes('ECONNREFUSED') ||
        message.includes('ECONNRESET') ||
        message.includes('EHOSTUNREACH'));
}
exports.isNetworkError = isNetworkError;
function formatURL(uri) {
    try {
        if (!uri) {
            return null;
        }
        // Check if the URI is a sourcegraph token
        if ((0, protocol_1.isSourcegraphToken)(uri)) {
            throw new Error('Access Token is not a valid URL');
        }
        // Check if the URI is in the correct URL format
        // Add missing https:// if needed
        if (!uri.startsWith('http')) {
            uri = `https://${uri}`;
        }
        const endpointUri = new URL(uri);
        return endpointUri.href;
    }
    catch (error) {
        console.error('Invalid URL: ', error);
        return null;
    }
}
async function showAuthResultMessage(endpoint, authStatus) {
    if (authStatus?.isLoggedIn) {
        const authority = vscode.Uri.parse(endpoint).authority;
        await vscode.window.showInformationMessage(`Signed in to ${authority || endpoint}`);
    }
    else {
        await showAuthFailureMessage(endpoint);
    }
}
async function showAuthFailureMessage(endpoint) {
    const authority = vscode.Uri.parse(endpoint).authority;
    await vscode.window.showErrorMessage(`Authentication failed. Please ensure Cody is enabled for ${authority} and verify your email address if required.`);
}
