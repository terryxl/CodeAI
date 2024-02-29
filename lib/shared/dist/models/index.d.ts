import type { ModelUsage } from './types';
/**
 * ModelProvider manages available chat and edit models.
 * It stores a set of available providers and methods to add,
 * retrieve and select between them.
 */
export declare class ModelProvider {
    readonly model: string;
    readonly usage: ModelUsage[];
    default: boolean;
    codyProOnly: boolean;
    provider: string;
    readonly title: string;
    constructor(model: string, usage: ModelUsage[], isDefaultModel?: boolean);
    private static privateProviders;
    private static dotComProviders;
    /**
     * Adds a new model provider, instantiated from the given model string,
     * to the internal providers set. This allows new models to be added and
     * made available for use.
     */
    static add(provider: ModelProvider): void;
    /**
     * Gets the model providers based on the endpoint and current model.
     * If endpoint is a dotcom endpoint, returns dotComProviders.
     * Otherwise returns providers.
     * If currentModel is provided, sets it as the default model.
     */
    static get(type: ModelUsage, endpoint?: string | null, currentModel?: string): ModelProvider[];
}
//# sourceMappingURL=index.d.ts.map