"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const LocalStorageProvider_1 = require("../services/LocalStorageProvider");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const cody_pro_expiration_1 = require("./cody-pro-expiration");
const protocol_1 = require("../chat/protocol");
(0, vitest_1.describe)('Cody Pro expiration notifications', () => {
    let notifier;
    let apiClient;
    let authProvider;
    let featureFlagProvider;
    let authStatus;
    let authChangeListener = () => { };
    let codyPlan;
    let codyStatus;
    const showInformationMessage = vitest_1.vitest.fn();
    const openExternal = vitest_1.vitest.fn();
    const enabledFeatureFlags = new Set();
    const localStorageKey = cody_pro_expiration_1.CodyProExpirationNotifications.localStorageSuppressionKey;
    // Set up local storage backed by an object.
    let localStorageData = {};
    LocalStorageProvider_1.localStorage.setStorage({
        get: (key) => localStorageData[key],
        update: (key, value) => {
            localStorageData[key] = value;
        },
    });
    (0, vitest_1.beforeEach)(() => {
        // Set everything up by default as a logged in DotCom users with Pro that has expired. This makes it
        // easier for tests to verify individual conditions that should prevent showing the notification.
        codyStatus = 'PENDING';
        codyPlan = 'PRO';
        enabledFeatureFlags.clear();
        enabledFeatureFlags.add(cody_shared_1.FeatureFlag.UseSscForCodySubscription);
        enabledFeatureFlags.add(cody_shared_1.FeatureFlag.CodyProTrialEnded);
        apiClient = {
            evaluateFeatureFlag: (flag) => Promise.resolve(enabledFeatureFlags.has(flag)),
            getEvaluatedFeatureFlags: () => ({}), // Unused, but called.
            getCurrentUserCodySubscription: () => ({
                status: codyStatus,
                plan: codyPlan,
            }),
        };
        authProvider = {
            addChangeListener: (f) => {
                authChangeListener = f;
                // (return an object that simulates the unsubscribe
                return () => {
                    authChangeListener = () => { };
                };
            },
            getAuthStatus: () => authStatus,
        };
        featureFlagProvider = new cody_shared_1.FeatureFlagProvider(apiClient);
        authStatus = { ...protocol_1.defaultAuthStatus, isLoggedIn: true, isDotCom: true };
        localStorageData = {};
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
        notifier?.dispose();
    });
    function createNotifier() {
        return new cody_pro_expiration_1.CodyProExpirationNotifications(apiClient, authProvider, featureFlagProvider, showInformationMessage, openExternal, 10, 0, false);
    }
    function expectExpiredNotification() {
        (0, vitest_1.expect)(showInformationMessage).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(showInformationMessage).toHaveBeenCalledWith(cody_pro_expiration_1.CodyProExpirationNotifications.expiredMessageText, cody_pro_expiration_1.CodyProExpirationNotifications.actionText, cody_pro_expiration_1.CodyProExpirationNotifications.noThanksText);
    }
    function expectExpiringSoonNotification() {
        (0, vitest_1.expect)(showInformationMessage).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(showInformationMessage).toHaveBeenCalledWith(cody_pro_expiration_1.CodyProExpirationNotifications.nearlyExpiredMessageText, cody_pro_expiration_1.CodyProExpirationNotifications.actionText, cody_pro_expiration_1.CodyProExpirationNotifications.noThanksText);
    }
    function expectNoNotification() {
        (0, vitest_1.expect)(showInformationMessage).not.toHaveBeenCalled();
    }
    /**
     * Default case shows notification. Other tests override the default conditions.
     */
    (0, vitest_1.it)('shows expired notification', async () => {
        await createNotifier().triggerExpirationCheck();
        expectExpiredNotification();
    });
    (0, vitest_1.it)('shows nearing expiry notification', async () => {
        enabledFeatureFlags.delete(cody_shared_1.FeatureFlag.CodyProTrialEnded);
        await createNotifier().triggerExpirationCheck();
        expectExpiringSoonNotification();
    });
    (0, vitest_1.it)('shows only once in a session', async () => {
        const notifier = createNotifier();
        await Promise.all([notifier.triggerExpirationCheck(), notifier.triggerExpirationCheck()]);
        expectExpiredNotification();
    });
    (0, vitest_1.it)('does not show if suppressed by LocalStorage', async () => {
        localStorageData[localStorageKey] = 'true';
        const notifier = createNotifier();
        await notifier.triggerExpirationCheck();
        (0, vitest_1.expect)(showInformationMessage).not.toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('records suppression to LocalStorage if closed', async () => {
        showInformationMessage.mockResolvedValue(undefined);
        const notifier = createNotifier();
        await notifier.triggerExpirationCheck();
        (0, vitest_1.expect)(localStorageData[localStorageKey]).toBeTruthy();
    });
    (0, vitest_1.it)('records suppression to LocalStorage if first button (Subscribe) clicked"', async () => {
        showInformationMessage.mockImplementation((text, buttons) => Promise.resolve(buttons[0]));
        const notifier = createNotifier();
        await notifier.triggerExpirationCheck();
        (0, vitest_1.expect)(localStorageData[localStorageKey]).toBeTruthy();
    });
    (0, vitest_1.it)('records suppression to LocalStorage if second button (No thanks) clicked"', async () => {
        showInformationMessage.mockImplementation((text, buttons) => Promise.resolve(buttons[1]));
        const notifier = createNotifier();
        await notifier.triggerExpirationCheck();
        (0, vitest_1.expect)(localStorageData[localStorageKey]).toBeTruthy();
    });
    (0, vitest_1.it)('does not show if not logged in', async () => {
        authStatus.isLoggedIn = false;
        await createNotifier().triggerExpirationCheck();
        expectNoNotification();
    });
    (0, vitest_1.it)('does not show if not DotCom', async () => {
        authStatus.isDotCom = false;
        await createNotifier().triggerExpirationCheck();
        expectNoNotification();
    });
    (0, vitest_1.it)('does not show if not currently PRO', async () => {
        codyPlan = 'NOT-PRO';
        await createNotifier().triggerExpirationCheck();
        expectNoNotification();
    });
    (0, vitest_1.it)('does not show if status is not PENDING', async () => {
        codyStatus = 'NOT-PENDING';
        await createNotifier().triggerExpirationCheck();
        expectNoNotification();
    });
    (0, vitest_1.it)('does not show if UseSscForCodySubscription not set', async () => {
        enabledFeatureFlags.delete(cody_shared_1.FeatureFlag.UseSscForCodySubscription);
        await createNotifier().triggerExpirationCheck();
        expectNoNotification();
    });
    (0, vitest_1.it)('shows later if UseSscForCodySubscription is enabled after some period', async () => {
        // Not shown initially because no flag.
        enabledFeatureFlags.delete(cody_shared_1.FeatureFlag.UseSscForCodySubscription);
        await createNotifier().triggerExpirationCheck();
        expectNoNotification();
        // For testing, our poll period is set to 10ms, so enable the flag and then wait
        // to allow that to trigger
        enabledFeatureFlags.add(cody_shared_1.FeatureFlag.UseSscForCodySubscription);
        featureFlagProvider.syncAuthStatus(); // Force clear cache of feature flags
        await new Promise(resolve => setTimeout(resolve, 20));
        // Should have been called by the timer.
        (0, vitest_1.expect)(showInformationMessage).toHaveBeenCalled();
    });
    (0, vitest_1.it)('shows later if auth status changes', async () => {
        // Not shown initially because not logged in
        authStatus.isLoggedIn = false;
        await createNotifier().triggerExpirationCheck();
        expectNoNotification();
        // Simulate login status change.
        authStatus.isLoggedIn = true;
        authChangeListener();
        // Allow time async operations (checking feature flags) to run as part of the check
        // before we expect. We have nothing we can wait on here.
        await new Promise(resolve => setTimeout(resolve, 100));
        // Should have been called by the auth status trigger.
        (0, vitest_1.expect)(showInformationMessage).toHaveBeenCalled();
    });
});
