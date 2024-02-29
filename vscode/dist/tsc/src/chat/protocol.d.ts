import type { URI } from 'vscode-uri';
import type { ActiveTextEditorSelectionRange, ChatMessage, ModelProvider, CodyLLMSiteConfiguration, ConfigurationWithAccessToken, ContextFile, ContextFileType, EnhancedContextContextT, SearchPanelFile, TelemetryEventProperties, UserLocalHistory } from '@sourcegraph/cody-shared';
import type { CodeBlockMeta } from '@sourcegraph/cody-ui/src/chat/CodeBlocks';
import type { View } from '../../webviews/NavBar';
import type { Repo } from '../context/repo-fetcher';
/**
 * A message sent from the webview to the extension host.
 */
export type WebviewMessage = {
    command: 'ready';
} | {
    command: 'initialized';
} | {
    command: 'event';
    eventName: string;
    properties: TelemetryEventProperties | undefined;
} | ({
    command: 'submit';
} & WebviewSubmitMessage) | {
    command: 'history';
    action: 'clear' | 'export';
} | {
    command: 'restoreHistory';
    chatID: string;
} | {
    command: 'deleteHistory';
    chatID: string;
} | {
    command: 'links';
    value: string;
} | {
    command: 'show-page';
    page: string;
} | {
    command: 'chatModel';
    model: string;
} | {
    command: 'get-chat-models';
} | {
    command: 'openFile';
    uri: URI;
    range?: ActiveTextEditorSelectionRange;
} | {
    command: 'openLocalFileWithRange';
    filePath: string;
    range?: ActiveTextEditorSelectionRange;
} | ({
    command: 'edit';
} & WebviewEditMessage) | {
    command: 'context/get-remote-search-repos';
} | {
    command: 'context/choose-remote-search-repo';
    explicitRepos?: Repo[];
} | {
    command: 'context/remove-remote-search-repo';
    repoId: string;
} | {
    command: 'embeddings/index';
} | {
    command: 'symf/index';
} | {
    command: 'insert';
    text: string;
    metadata?: CodeBlockMeta;
} | {
    command: 'newFile';
    text: string;
    metadata?: CodeBlockMeta;
} | {
    command: 'copy';
    eventType: 'Button' | 'Keydown';
    text: string;
    metadata?: CodeBlockMeta;
} | {
    command: 'auth';
    authKind: 'signin' | 'signout' | 'support' | 'callback' | 'simplified-onboarding' | 'simplified-onboarding-exposure';
    endpoint?: string;
    value?: string;
    authMethod?: AuthMethod;
} | {
    command: 'abort';
} | {
    command: 'reload';
} | {
    command: 'simplified-onboarding';
    onboardingKind: 'web-sign-in-token';
} | {
    command: 'getUserContext';
    query: string;
} | {
    command: 'search';
    query: string;
} | {
    command: 'show-search-result';
    uri: URI;
    range: ActiveTextEditorSelectionRange;
} | {
    command: 'reset';
} | {
    command: 'attribution-search';
    snippet: string;
};
/**
 * A message sent from the extension host to the webview.
 */
export type ExtensionMessage = {
    type: 'config';
    config: ConfigurationSubsetForWebview & LocalEnv;
    authStatus: AuthStatus;
    workspaceFolderUris: string[];
} | {
    type: 'search:config';
    workspaceFolderUris: string[];
} | {
    type: 'history';
    localHistory: UserLocalHistory | null;
} | ({
    type: 'transcript';
} & ExtensionTranscriptMessage) | {
    type: 'view';
    view: View;
} | {
    type: 'errors';
    errors: string;
} | {
    type: 'notice';
    notice: {
        key: string;
    };
} | {
    type: 'transcript-errors';
    isTranscriptError: boolean;
} | {
    type: 'userContextFiles';
    userContextFiles: ContextFile[] | null;
    kind?: ContextFileType;
} | {
    type: 'chatModels';
    models: ModelProvider[];
} | {
    type: 'update-search-results';
    results: SearchPanelFile[];
    query: string;
} | {
    type: 'index-updated';
    scopeDir: string;
} | {
    type: 'enhanced-context';
    enhancedContextStatus: EnhancedContextContextT;
} | ({
    type: 'attribution';
} & ExtensionAttributionMessage) | {
    type: 'setChatEnabledConfigFeature';
    data: boolean;
} | {
    type: 'webview-state';
    isActive: boolean;
} | {
    type: 'context/remote-repos';
    repos: Repo[];
} | {
    type: 'setConfigFeatures';
    configFeatures: {
        chat: boolean;
        attribution: boolean;
    };
};
interface ExtensionAttributionMessage {
    snippet: string;
    attribution?: {
        repositoryNames: string[];
        limitHit: boolean;
    };
    error?: string;
}
export type ChatSubmitType = 'user' | 'user-newchat';
export interface WebviewSubmitMessage extends WebviewContextMessage {
    text: string;
    submitType: ChatSubmitType;
}
interface WebviewEditMessage extends WebviewContextMessage {
    text: string;
    index?: number;
}
interface WebviewContextMessage {
    addEnhancedContext?: boolean;
    contextFiles?: ContextFile[];
}
export interface ExtensionTranscriptMessage {
    messages: ChatMessage[];
    isMessageInProgress: boolean;
    chatID: string;
}
/**
 * The subset of configuration that is visible to the webview.
 */
export interface ConfigurationSubsetForWebview extends Pick<ConfigurationWithAccessToken, 'debugEnable' | 'experimentalGuardrails' | 'serverEndpoint'> {
}
/**
 * URLs for the Sourcegraph instance and app.
 */
export declare const CODY_DOC_URL: URL;
export declare const DISCORD_URL: URL;
export declare const CODY_FEEDBACK_URL: URL;
export declare const ACCOUNT_UPGRADE_URL: URL;
export declare const ACCOUNT_USAGE_URL: URL;
export declare const ACCOUNT_LIMITS_INFO_URL: URL;
/**
 * The status of a users authentication, whether they're authenticated and have a
 * verified email.
 */
export interface AuthStatus {
    username: string;
    endpoint: string | null;
    isDotCom: boolean;
    isLoggedIn: boolean;
    showInvalidAccessTokenError: boolean;
    authenticated: boolean;
    hasVerifiedEmail: boolean;
    requiresVerifiedEmail: boolean;
    siteHasCodyEnabled: boolean;
    siteVersion: string;
    configOverwrites?: CodyLLMSiteConfiguration;
    showNetworkError?: boolean;
    primaryEmail: string;
    displayName?: string;
    avatarURL: string;
    /**
     * Whether the users account can be upgraded.
     *
     * This is `true` if the user is on dotCom and has
     * not already upgraded. It is used to customise
     * rate limit messages and show additional upgrade
     * buttons in the UI.
     */
    userCanUpgrade: boolean;
}
export declare const defaultAuthStatus: {
    endpoint: string;
    isDotCom: true;
    isLoggedIn: false;
    showInvalidAccessTokenError: false;
    authenticated: false;
    hasVerifiedEmail: false;
    requiresVerifiedEmail: false;
    siteHasCodyEnabled: false;
    siteVersion: string;
    userCanUpgrade: false;
    username: string;
    primaryEmail: string;
    displayName: string;
    avatarURL: string;
};
export declare const unauthenticatedStatus: {
    endpoint: string;
    isDotCom: true;
    isLoggedIn: false;
    showInvalidAccessTokenError: true;
    authenticated: false;
    hasVerifiedEmail: false;
    requiresVerifiedEmail: false;
    siteHasCodyEnabled: false;
    siteVersion: string;
    userCanUpgrade: false;
    username: string;
    primaryEmail: string;
    displayName: string;
    avatarURL: string;
};
export declare const networkErrorAuthStatus: {
    isDotCom: false;
    showInvalidAccessTokenError: false;
    authenticated: false;
    isLoggedIn: false;
    hasVerifiedEmail: false;
    showNetworkError: true;
    requiresVerifiedEmail: false;
    siteHasCodyEnabled: false;
    siteVersion: string;
    userCanUpgrade: false;
    username: string;
    primaryEmail: string;
    displayName: string;
    avatarURL: string;
};
/** The local environment of the editor. */
export interface LocalEnv {
    os: string;
    arch: string;
    homeDir?: string | undefined;
    extensionVersion: string;
    uiKindIsWeb: boolean;
}
export declare function isLoggedIn(authStatus: AuthStatus): boolean;
export type AuthMethod = 'dotcom' | 'github' | 'gitlab' | 'google';
/**
 * Checks if the given text matches the regex for a Sourcegraph access token.
 *
 * @param text - The text to check against the regex.
 * @returns Whether the text matches the Sourcegraph token regex.
 */
export declare function isSourcegraphToken(text: string): boolean;
export {};
//# sourceMappingURL=protocol.d.ts.map