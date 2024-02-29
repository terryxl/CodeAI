"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completionProviderConfig = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
class CompletionProviderConfig {
    _config;
    /**
     * Use the injected feature flag provider to make testing easier.
     */
    featureFlagProvider;
    flagsToResolve = [
        cody_shared_1.FeatureFlag.CodyAutocompleteContextBfgMixed,
        cody_shared_1.FeatureFlag.CodyAutocompleteDynamicMultilineCompletions,
        cody_shared_1.FeatureFlag.CodyAutocompleteHotStreak,
        cody_shared_1.FeatureFlag.CodyAutocompleteUserLatency,
        cody_shared_1.FeatureFlag.CodyAutocompleteEagerCancellation,
        cody_shared_1.FeatureFlag.CodyAutocompleteTracing,
        cody_shared_1.FeatureFlag.CodyAutocompleteSmartThrottle,
    ];
    get config() {
        if (!this._config) {
            throw new Error('CompletionProviderConfig is not initialized');
        }
        return this._config;
    }
    /**
     * Should be called before `InlineCompletionItemProvider` instance is created, so that the singleton
     * with resolved values is ready for downstream use.
     */
    async init(config, featureFlagProvider) {
        this._config = config;
        this.featureFlagProvider = featureFlagProvider;
        await Promise.all(this.flagsToResolve.map(flag => featureFlagProvider.evaluateFeatureFlag(flag)));
    }
    setConfig(config) {
        this._config = config;
    }
    getPrefetchedFlag(flag) {
        if (!this.featureFlagProvider) {
            throw new Error('CompletionProviderConfig is not initialized');
        }
        return Boolean(this.featureFlagProvider.getFromCache(flag));
    }
    get dynamicMultilineCompletions() {
        return (this.config.autocompleteExperimentalDynamicMultilineCompletions ||
            this.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteDynamicMultilineCompletions));
    }
    get hotStreak() {
        return (this.config.autocompleteExperimentalHotStreak ||
            this.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteHotStreak));
    }
    get contextStrategy() {
        const { config } = this;
        const bfgMixedContextFlag = this.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteContextBfgMixed);
        const contextStrategy = config.autocompleteExperimentalGraphContext === 'bfg'
            ? 'bfg'
            : config.autocompleteExperimentalGraphContext === 'bfg-mixed'
                ? 'bfg-mixed'
                : config.autocompleteExperimentalGraphContext === 'local-mixed'
                    ? 'local-mixed'
                    : config.autocompleteExperimentalGraphContext === 'jaccard-similarity'
                        ? 'jaccard-similarity'
                        : config.autocompleteExperimentalGraphContext === 'new-jaccard-similarity'
                            ? 'new-jaccard-similarity'
                            : bfgMixedContextFlag
                                ? 'bfg-mixed'
                                : 'jaccard-similarity';
        return contextStrategy;
    }
    get smartThrottle() {
        return (this.config.autocompleteExperimentalSmartThrottle ||
            this.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteSmartThrottle));
    }
}
/**
 * A singleton store for completion provider configuration values which allows us to
 * avoid propagating every feature flag and config value through completion provider
 * internal calls. It guarantees that `flagsToResolve` are resolved on `CompletionProvider`
 * creation and along with `Configuration`.
 *
 * A subset of relevant config values and feature flags is moved here from the existing
 * params waterfall. Ideally, we rely on this singleton as a source of truth for config values
 * and collapse function calls nested in `InlineCompletionItemProvider.generateCompletions()`.
 */
exports.completionProviderConfig = new CompletionProviderConfig();
