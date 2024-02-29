/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import { type FeatureFlagProvider, type SourcegraphGraphQLAPIClient } from '@sourcegraph/cody-shared';
import type { AuthProvider } from '../services/AuthProvider';
import { URI } from 'vscode-uri';
export declare class CodyProExpirationNotifications implements vscode.Disposable {
    private readonly apiClient;
    private readonly authProvider;
    private readonly featureFlagProvider;
    private readonly showInformationMessage;
    private readonly openExternal;
    private readonly flagCheckDelayMs;
    private readonly autoUpdateDelay;
    static readonly expiredActionUrl = "https://sourcegraph.com/cody/subscription";
    static readonly expiredMessageText = "\n                Your Cody Pro trial has ended, and you are now on the Cody Free plan.\n\n                If you'd like to upgrade to Cody Pro, please setup your payment information. You can cancel anytime.\n            ";
    static readonly nearlyExpiredActionUrl = "https://sourcegraph.com/cody/subscription?on-trial=true";
    static readonly nearlyExpiredMessageText = "\n                Your Cody Pro Trial is ending soon.\n\n                Setup your payment information to continue using Cody Pro, you won't be charged until February 21.\n            ";
    static readonly localStorageSuppressionKey = "extension.codyPro.suppressExpirationNotices";
    static readonly actionText = "Setup Payment Info";
    static readonly noThanksText = "Don\u2019t Show Again";
    /**
     * Current subscription to auth provider status changes that may trigger a check.
     */
    private authProviderSubscription;
    /**
     * A timer if there is currently an outstanding timed check.
     */
    private nextTimedCheck;
    /**
     * Whether we've been disposed.
     */
    private isDisposed;
    /**
     * Set up a check (now and when auth status changes) whether to show the user a notification
     * about their Cody Pro subscription having expired (or expiring soon).
     */
    constructor(apiClient: SourcegraphGraphQLAPIClient, authProvider: AuthProvider, featureFlagProvider: FeatureFlagProvider, showInformationMessage: (message: string, ...items: string[]) => Thenable<string | undefined>, openExternal: (target: URI) => Thenable<boolean>, flagCheckDelayMs?: number, // 30 mins
    autoUpdateDelay?: number, // 3 sec
    checkImmediately?: boolean);
    /**
     * Perform an immediate check and display a notification if appropriate.
     */
    triggerExpirationCheck(): Promise<void>;
    private showNotification;
    /**
     * Checks if it's still valid to show a notification.
     */
    private shouldSuppressNotifications;
    private suppressFutureNotifications;
    /**
     * Schedules a future check.
     */
    private scheduleTimedCheck;
    /**
     * Stops checking and cleans up.
     *
     * Safe to call multiple times.
     */
    dispose(): void;
}
//# sourceMappingURL=cody-pro-expiration.d.ts.map