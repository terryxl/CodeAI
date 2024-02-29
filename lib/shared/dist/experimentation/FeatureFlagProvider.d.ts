import { type SourcegraphGraphQLAPIClient } from '../sourcegraph-api/graphql';
export declare enum FeatureFlag {
    TestFlagDoNotUse = "test-flag-do-not-use",
    CodyAutocompleteTracing = "cody-autocomplete-tracing",
    CodyAutocompleteStarCoderHybrid = "cody-autocomplete-default-starcoder-hybrid",
    CodyAutocompleteLlamaCode13B = "cody-autocomplete-llama-code-13b",
    CodyAutocompleteContextBfgMixed = "cody-autocomplete-context-bfg-mixed",
    CodyAutocompleteUserLatency = "cody-autocomplete-user-latency",
    CodyAutocompleteDynamicMultilineCompletions = "cody-autocomplete-dynamic-multiline-completions",
    CodyAutocompleteEagerCancellation = "cody-autocomplete-eager-cancellation",
    CodyAutocompleteHotStreak = "cody-autocomplete-hot-streak",
    CodyAutocompleteSmartThrottle = "cody-autocomplete-smart-throttle",
    CodyProJetBrains = "cody-pro-jetbrains",
    UseSscForCodySubscription = "use-ssc-for-cody-subscription",
    CodyProTrialEnded = "cody-pro-trial-ended",
    CodyChatMockTest = "cody-chat-mock-test",
    CodyChatFusedContext = "cody-chat-fused-context",
    CodyCommandHints = "cody-command-hints"
}
export declare class FeatureFlagProvider {
    private apiClient;
    private exposedFeatureFlags;
    private lastRefreshTimestamp;
    private unexposedFeatureFlags;
    private subscriptions;
    private nextRefreshTimeout;
    constructor(apiClient: SourcegraphGraphQLAPIClient);
    getFromCache(flagName: FeatureFlag, endpoint?: string): boolean | undefined;
    getExposedExperiments(endpoint?: string): Record<string, boolean>;
    evaluateFeatureFlag(flagName: FeatureFlag, endpoint?: string): Promise<boolean>;
    syncAuthStatus(): Promise<void>;
    refreshFeatureFlags(): Promise<void>;
    onFeatureFlagChanged(prefixFilter: string, callback: () => void, endpoint?: string): () => void;
    private notifyFeatureFlagChanged;
    private computeFeatureFlagSnapshot;
}
export declare const featureFlagProvider: FeatureFlagProvider;
//# sourceMappingURL=FeatureFlagProvider.d.ts.map