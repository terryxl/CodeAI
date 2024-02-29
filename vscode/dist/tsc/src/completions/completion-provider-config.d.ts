import { type Configuration, type FeatureFlagProvider } from '@sourcegraph/cody-shared';
import type { ContextStrategy } from './context/context-strategy';
declare class CompletionProviderConfig {
    private _config?;
    /**
     * Use the injected feature flag provider to make testing easier.
     */
    private featureFlagProvider?;
    private flagsToResolve;
    private get config();
    /**
     * Should be called before `InlineCompletionItemProvider` instance is created, so that the singleton
     * with resolved values is ready for downstream use.
     */
    init(config: Configuration, featureFlagProvider: FeatureFlagProvider): Promise<void>;
    setConfig(config: Configuration): void;
    getPrefetchedFlag(flag: (typeof this.flagsToResolve)[number]): boolean;
    get dynamicMultilineCompletions(): boolean;
    get hotStreak(): boolean;
    get contextStrategy(): ContextStrategy;
    get smartThrottle(): boolean;
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
export declare const completionProviderConfig: CompletionProviderConfig;
export {};
//# sourceMappingURL=completion-provider-config.d.ts.map