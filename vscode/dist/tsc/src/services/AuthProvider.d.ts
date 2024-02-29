/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ConfigurationWithAccessToken } from '@sourcegraph/cody-shared';
import { type AuthStatus } from '../chat/protocol';
type Listener = (authStatus: AuthStatus) => void;
type Unsubscribe = () => void;
export declare class AuthProvider {
    private config;
    private endpointHistory;
    private appScheme;
    private client;
    private authStatus;
    private listeners;
    constructor(config: Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'accessToken' | 'customHeaders'>);
    init(): Promise<void>;
    addChangeListener(listener: Listener): Unsubscribe;
    signinMenu(type?: 'enterprise' | 'dotcom' | 'token', uri?: string): Promise<void>;
    private signinMenuForInstanceUrl;
    signoutMenu(): Promise<void>;
    accountMenu(): Promise<void>;
    private signout;
    private makeAuthStatus;
    getAuthStatus(): AuthStatus;
    auth(uri: string, token: string | null, customHeaders?: Record<string, string> | null): Promise<{
        authStatus: AuthStatus;
        isLoggedIn: boolean;
    }>;
    reloadAuthStatus(): Promise<void>;
    private syncAuthStatus;
    announceNewAuthStatus(): void;
    tokenCallbackHandler(uri: vscode.Uri, customHeaders: Record<string, string>): Promise<void>;
    /** Open callback URL in browser to get token from instance. */
    redirectToEndpointLogin(uri: string): void;
    private loadEndpointHistory;
    private storeAuthInfo;
    authProviderSimplifiedWillAttemptAuth(): void;
}
export declare function isNetworkError(error: Error): boolean;
export {};
//# sourceMappingURL=AuthProvider.d.ts.map