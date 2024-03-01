import { logDebug } from '../logger';
import { graphqlClient } from '../sourcegraph-api/graphql';
import { wrapInActiveSpan } from '../tracing';
import { isError } from '../utils';
export var FeatureFlag;
(function (FeatureFlag) {
    // This flag is only used for testing the behavior of the provider and should not be used in
    // product code
    FeatureFlag["TestFlagDoNotUse"] = "test-flag-do-not-use";
    // Enable both-client side and server-side tracing
    FeatureFlag["CodyAutocompleteTracing"] = "cody-autocomplete-tracing";
    // This flag is used to track the overall eligibility to use the StarCoder model. The `-hybrid`
    // suffix is no longer relevant
    FeatureFlag["CodyAutocompleteStarCoderHybrid"] = "cody-autocomplete-default-starcoder-hybrid";
    // Enable Llama Code 13b as the default model via Fireworks
    FeatureFlag["CodyAutocompleteLlamaCode13B"] = "cody-autocomplete-llama-code-13b";
    // Enables the bfg-mixed context retriever that will combine BFG with the default local editor
    // context.
    FeatureFlag["CodyAutocompleteContextBfgMixed"] = "cody-autocomplete-context-bfg-mixed";
    // Enable latency adjustments based on accept/reject streaks
    FeatureFlag["CodyAutocompleteUserLatency"] = "cody-autocomplete-user-latency";
    // Dynamically decide wether to show a single line or multiple lines for completions.
    FeatureFlag["CodyAutocompleteDynamicMultilineCompletions"] = "cody-autocomplete-dynamic-multiline-completions";
    // Completion requests will be cancelled as soon as a new request comes in and the debounce time
    // will be reduced to try and counter the latency impact.
    FeatureFlag["CodyAutocompleteEagerCancellation"] = "cody-autocomplete-eager-cancellation";
    // Continue generations after a single-line completion and use the response to see the next line
    // if the first completion is accepted.
    FeatureFlag["CodyAutocompleteHotStreak"] = "cody-autocomplete-hot-streak";
    // Enable smart-throttling for more aggressive request cancellation and lower initial latencies
    FeatureFlag["CodyAutocompleteSmartThrottle"] = "cody-autocomplete-smart-throttle";
    // Enable Cody PLG features on JetBrains
    FeatureFlag["CodyProJetBrains"] = "cody-pro-jetbrains";
    // use-ssc-for-cody-subscription is a feature flag that enables the use of SSC as the source of truth for Cody subscription data.
    FeatureFlag["UseSscForCodySubscription"] = "use-ssc-for-cody-subscription";
    // cody-pro-trial-ended is a feature flag that indicates if the Cody Pro "Free Trial"  has ended.
    // (Enabling users to use Cody Pro for free for 3-months starting in late Q4'2023.)
    FeatureFlag["CodyProTrialEnded"] = "cody-pro-trial-ended";
    // A feature flag to test potential chat experiments. No functionality is gated by it.
    FeatureFlag["CodyChatMockTest"] = "cody-chat-mock-test";
    // When enabled, fuses embeddings and symf context for chat.
    FeatureFlag["CodyChatFusedContext"] = "cody-chat-fused-context";
    // Show command hints alongside editor selections. "Opt+K to Edit, Opt+L to Chat"
    FeatureFlag["CodyCommandHints"] = "cody-command-hints";
})(FeatureFlag || (FeatureFlag = {}));
const ONE_HOUR = 60 * 60 * 1000;
export class FeatureFlagProvider {
    apiClient;
    // The exposed feature flags are one where the backend returns a non-null value and thus we know
    // the user is in either the test or control group.
    //
    // The first key maps to the endpoint so that we do never cache the wrong flag for different
    // endpoints
    exposedFeatureFlags = {};
    lastRefreshTimestamp = 0;
    // Unexposed feature flags are cached differently since they don't usually mean that the backend
    // won't have access to this feature flag. Those will not automatically update when feature
    // flags are updated in the background.
    unexposedFeatureFlags = {};
    subscriptions = new Map();
    // When we have at least one subscription, ensure that we also periodically refresh the flags
    nextRefreshTimeout = undefined;
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    getFromCache(flagName, endpoint = this.apiClient.endpoint) {
        const now = Date.now();
        if (now - this.lastRefreshTimestamp > ONE_HOUR) {
            // Cache expired, refresh
            void this.refreshFeatureFlags();
        }
        const exposedValue = this.exposedFeatureFlags[endpoint]?.[flagName];
        if (exposedValue !== undefined) {
            return exposedValue;
        }
        if (this.unexposedFeatureFlags[endpoint]?.has(flagName)) {
            return false;
        }
        return undefined;
    }
    getExposedExperiments(endpoint = this.apiClient.endpoint) {
        return this.exposedFeatureFlags[endpoint] || {};
    }
    async evaluateFeatureFlag(flagName, endpoint = this.apiClient.endpoint) {
        return wrapInActiveSpan(`FeatureFlagProvider.evaluateFeatureFlag.${flagName}`, async () => {
            if (process.env.BENCHMARK_DISABLE_FEATURE_FLAGS) {
                return false;
            }
            const cachedValue = this.getFromCache(flagName, endpoint);
            if (cachedValue !== undefined) {
                return cachedValue;
            }
            const value = await this.apiClient.evaluateFeatureFlag(flagName);
            if (value === null || typeof value === 'undefined' || isError(value)) {
                // The backend does not know about this feature flag, so we can't know if the user
                // is in the test or control group.
                if (!this.unexposedFeatureFlags[endpoint]) {
                    this.unexposedFeatureFlags[endpoint] = new Set();
                }
                this.unexposedFeatureFlags[endpoint].add(flagName);
                return false;
            }
            if (!this.exposedFeatureFlags[endpoint]) {
                this.exposedFeatureFlags[endpoint] = {};
            }
            this.exposedFeatureFlags[endpoint][flagName] = value;
            return value;
        });
    }
    async syncAuthStatus() {
        this.exposedFeatureFlags = {};
        this.unexposedFeatureFlags = {};
        await this.refreshFeatureFlags();
    }
    async refreshFeatureFlags() {
        return wrapInActiveSpan('FeatureFlagProvider.refreshFeatureFlags', async () => {
            const endpoint = this.apiClient.endpoint;
            const data = await this.apiClient.getEvaluatedFeatureFlags();
            this.exposedFeatureFlags[endpoint] = isError(data) ? {} : data;
            this.lastRefreshTimestamp = Date.now();
            this.notifyFeatureFlagChanged();
            if (this.nextRefreshTimeout) {
                clearTimeout(this.nextRefreshTimeout);
                this.nextRefreshTimeout = undefined;
            }
            if (this.subscriptions.size > 0) {
                this.nextRefreshTimeout = setTimeout(() => this.refreshFeatureFlags(), ONE_HOUR);
            }
        });
    }
    // Allows you to subscribe to a change event that is triggered when feature flags with a
    // predefined prefix are updated. Can be used to sync code that only queries flags at startup
    // to outside changes.
    //
    // Note this will only update feature flags that a user is currently exposed to. For feature
    // flags not defined upstream, the changes will require a new call to `evaluateFeatureFlag` to
    // be picked up.
    onFeatureFlagChanged(prefixFilter, callback, endpoint = this.apiClient.endpoint) {
        const key = endpoint + '#' + prefixFilter;
        const subscription = this.subscriptions.get(key);
        if (subscription) {
            subscription.callbacks.add(callback);
            return () => subscription.callbacks.delete(callback);
        }
        this.subscriptions.set(key, {
            lastSnapshot: this.computeFeatureFlagSnapshot(endpoint, prefixFilter),
            callbacks: new Set([callback]),
        });
        if (!this.nextRefreshTimeout) {
            this.nextRefreshTimeout = setTimeout(() => {
                this.nextRefreshTimeout = undefined;
                void this.refreshFeatureFlags();
            }, ONE_HOUR);
        }
        return () => {
            const subscription = this.subscriptions.get(key);
            if (subscription) {
                subscription.callbacks.delete(callback);
                if (subscription.callbacks.size === 0) {
                    this.subscriptions.delete(key);
                }
                if (this.subscriptions.size === 0 && this.nextRefreshTimeout) {
                    clearTimeout(this.nextRefreshTimeout);
                    this.nextRefreshTimeout = undefined;
                }
            }
        };
    }
    notifyFeatureFlagChanged() {
        const callbacksToTrigger = [];
        for (const [key, subs] of this.subscriptions) {
            const parts = key.split('#');
            const endpoint = parts[0];
            const prefixFilter = parts[1];
            const currentSnapshot = this.computeFeatureFlagSnapshot(endpoint, prefixFilter);
            // We only care about flags being changed that we previously already captured. A new
            // evaluation should not trigger a change event unless that new value is later changed.
            if (computeIfExistingFlagChanged(subs.lastSnapshot, currentSnapshot)) {
                for (const callback of subs.callbacks) {
                    callbacksToTrigger.push(callback);
                }
            }
            subs.lastSnapshot = currentSnapshot;
        }
        logDebug('featureflag', 'refreshed');
        for (const callback of callbacksToTrigger) {
            callback();
        }
    }
    computeFeatureFlagSnapshot(endpoint, prefixFilter) {
        const featureFlags = this.exposedFeatureFlags[endpoint];
        if (!featureFlags) {
            return {};
        }
        const keys = Object.keys(featureFlags);
        const filteredKeys = keys.filter(key => key.startsWith(prefixFilter));
        const filteredFeatureFlags = filteredKeys.reduce((acc, key) => {
            acc[key] = featureFlags[key];
            return acc;
        }, {});
        return filteredFeatureFlags;
    }
}
export const featureFlagProvider = new FeatureFlagProvider(graphqlClient);
function computeIfExistingFlagChanged(oldFlags, newFlags) {
    return Object.keys(oldFlags).some(key => oldFlags[key] !== newFlags[key]);
}
//# sourceMappingURL=FeatureFlagProvider.js.map