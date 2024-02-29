"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodyProExpirationNotifications = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const LocalStorageProvider_1 = require("../services/LocalStorageProvider");
const vscode_uri_1 = require("vscode-uri");
class CodyProExpirationNotifications {
    apiClient;
    authProvider;
    featureFlagProvider;
    showInformationMessage;
    openExternal;
    flagCheckDelayMs;
    autoUpdateDelay;
    static expiredActionUrl = 'https://sourcegraph.com/cody/subscription';
    static expiredMessageText = `
                Your Cody Pro trial has ended, and you are now on the Cody Free plan.

                If you'd like to upgrade to Cody Pro, please setup your payment information. You can cancel anytime.
            `;
    static nearlyExpiredActionUrl = 'https://sourcegraph.com/cody/subscription?on-trial=true';
    static nearlyExpiredMessageText = `
                Your Cody Pro Trial is ending soon.

                Setup your payment information to continue using Cody Pro, you won't be charged until February 21.
            `;
    static localStorageSuppressionKey = 'extension.codyPro.suppressExpirationNotices';
    static actionText = 'Setup Payment Info';
    static noThanksText = 'Don’t Show Again';
    /**
     * Current subscription to auth provider status changes that may trigger a check.
     */
    authProviderSubscription;
    /**
     * A timer if there is currently an outstanding timed check.
     */
    nextTimedCheck;
    /**
     * Whether we've been disposed.
     */
    isDisposed = false;
    /**
     * Set up a check (now and when auth status changes) whether to show the user a notification
     * about their Cody Pro subscription having expired (or expiring soon).
     */
    constructor(apiClient, authProvider, featureFlagProvider, showInformationMessage, openExternal, flagCheckDelayMs = 1000 * 60 * 30, // 30 mins
    autoUpdateDelay = 1000 * 3, // 3 sec
    checkImmediately = true) {
        this.apiClient = apiClient;
        this.authProvider = authProvider;
        this.featureFlagProvider = featureFlagProvider;
        this.showInformationMessage = showInformationMessage;
        this.openExternal = openExternal;
        this.flagCheckDelayMs = flagCheckDelayMs;
        this.autoUpdateDelay = autoUpdateDelay;
        if (checkImmediately) {
            void this.triggerExpirationCheck();
        }
    }
    /**
     * Perform an immediate check and display a notification if appropriate.
     */
    async triggerExpirationCheck() {
        if (this.shouldSuppressNotifications())
            return; // May have been triggered by a timer, so check again
        // Set up check for each time auth changes...
        if (!this.authProviderSubscription) {
            // HACK: authProvider listeners will fire before the GraphQL client is updated and
            // therefore checking feature flags may return incorrect results for a short period.
            //
            // As a short-term workaround, delay the check for a few seconds after the auth change
            // to allow the GraphQL client to be updated and reduce the chance of not picking up the
            // right flags.
            //
            // See https://sourcegraph.slack.com/archives/C05AGQYD528/p1706872864488829
            this.authProviderSubscription = this.authProvider.addChangeListener(() => setTimeout(() => this.triggerExpirationCheck(), this.autoUpdateDelay));
        }
        // Not logged in or not DotCom, don't show.
        const authStatus = this.authProvider.getAuthStatus();
        if (!authStatus.isLoggedIn || !authStatus.isDotCom)
            return;
        const useSscForCodySubscription = await this.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.UseSscForCodySubscription);
        if (this.shouldSuppressNotifications())
            return; // Status may have changed during await
        if (!useSscForCodySubscription) {
            // Flag has not been enabled yet, so schedule a later check.
            this.scheduleTimedCheck();
            return;
        }
        const res = await this.apiClient.getCurrentUserCodySubscription();
        if (this.shouldSuppressNotifications())
            return; // Status may have changed during await
        if (res instanceof Error) {
            // Something went wrong - schedule a future check to try again.
            console.error(res);
            this.scheduleTimedCheck();
            return;
        }
        // Only current Pro users with a Pending state (not already paid/have CC details)
        // will see notifications.
        if (res.plan !== 'PRO' || res.status !== 'PENDING')
            return;
        // If we made it here, it's time to show a notification.
        await this.showNotification();
    }
    async showNotification() {
        const codyProTrialEnded = await this.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyProTrialEnded);
        if (this.shouldSuppressNotifications())
            return; // Status may have changed during await
        // We will now definitely show a message, so dispose so that no other checks that might overlap can also trigger this.
        this.dispose();
        let actionUrl;
        let text;
        if (codyProTrialEnded) {
            actionUrl = CodyProExpirationNotifications.expiredActionUrl;
            text = CodyProExpirationNotifications.expiredMessageText;
        }
        else {
            actionUrl = CodyProExpirationNotifications.nearlyExpiredActionUrl;
            text = CodyProExpirationNotifications.nearlyExpiredMessageText;
        }
        const actionText = CodyProExpirationNotifications.actionText;
        const noThanksText = CodyProExpirationNotifications.noThanksText;
        const action = await this.showInformationMessage(text, actionText, noThanksText);
        this.suppressFutureNotifications();
        if (action === actionText) {
            await this.openExternal(vscode_uri_1.URI.parse(actionUrl));
        }
    }
    /**
     * Checks if it's still valid to show a notification.
     */
    shouldSuppressNotifications() {
        if (this.isDisposed)
            return true;
        if (LocalStorageProvider_1.localStorage.get(CodyProExpirationNotifications.localStorageSuppressionKey)) {
            this.dispose();
            return true;
        }
        return false;
    }
    suppressFutureNotifications() {
        // Don't show again this session.
        this.dispose();
        // Or again in future.
        LocalStorageProvider_1.localStorage.set(CodyProExpirationNotifications.localStorageSuppressionKey, 'true');
    }
    /**
     * Schedules a future check.
     */
    scheduleTimedCheck() {
        this.nextTimedCheck?.unref();
        this.nextTimedCheck = setTimeout(async () => this.triggerExpirationCheck(), this.flagCheckDelayMs);
    }
    /**
     * Stops checking and cleans up.
     *
     * Safe to call multiple times.
     */
    dispose() {
        this.isDisposed = true;
        this.authProviderSubscription?.();
        this.authProviderSubscription = undefined;
        this.nextTimedCheck?.unref();
        this.nextTimedCheck = undefined;
    }
}
exports.CodyProExpirationNotifications = CodyProExpirationNotifications;
