import { isDotCom } from '../sourcegraph-api/environments';
import { DEFAULT_DOT_COM_MODELS } from './dotcom';
import { getProviderName } from './utils';
/**
 * ModelProvider manages available chat and edit models.
 * It stores a set of available providers and methods to add,
 * retrieve and select between them.
 */
export class ModelProvider {
    model;
    usage;
    default = false;
    codyProOnly = false;
    provider;
    title;
    vendor = 'Sourcegraph';
    constructor(model, usage, isDefaultModel = true) {
        this.model = model;
        this.usage = usage;
        const splittedModel = model.split('/');
        this.provider = getProviderName(splittedModel[0]);
        this.title = splittedModel[1]?.replaceAll('-', ' ');
        this.default = isDefaultModel;
    }
    // Providers available for non-dotcom instances
    static privateProviders = new Map();
    // Providers available for dotcom instances
    static dotComProviders = DEFAULT_DOT_COM_MODELS;
    /**
     * Adds a new model provider, instantiated from the given model string,
     * to the internal providers set. This allows new models to be added and
     * made available for use.
     */
    static add(provider) {
        // private instances can only support 1 provider atm
        if (ModelProvider.privateProviders.size) {
            ModelProvider.privateProviders.clear();
        }
        ModelProvider.privateProviders.set(provider.model.trim(), provider);
    }
    /**
     * Gets the model providers based on the endpoint and current model.
     * If endpoint is a dotcom endpoint, returns dotComProviders.
     * Otherwise returns providers.
     * If currentModel is provided, sets it as the default model.
     */
    static get(type, endpoint, currentModel) {
        const isDotComUser = !endpoint || (endpoint && isDotCom(endpoint));
        const providers = [];
        if (!isDotComUser) {
            providers.push(...ModelProvider.dotComProviders.filter(m => m.vendor === 'Azure'));
            providers.push(...Array.from(ModelProvider.privateProviders.values()));
        }
        const models = (isDotComUser
            ? ModelProvider.dotComProviders.filter(m => m.vendor !== 'Azure')
            : providers).filter(model => model.usage.includes(type));
        if (!isDotComUser) {
            return models;
        }
        // Set the current model as default
        return models.map(model => {
            return {
                ...model,
                default: model.model === currentModel,
            };
        });
    }
}
//# sourceMappingURL=index.js.map