"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProviderConfig = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../../log");
const anthropic_1 = require("./anthropic");
const fireworks_1 = require("./fireworks");
const experimental_ollama_1 = require("./experimental-ollama");
const unstable_openai_1 = require("./unstable-openai");
async function createProviderConfig(config, client, authStatus) {
    /**
     * Look for the autocomplete provider in VSCode settings and return matching provider config.
     */
    const providerAndModelFromVSCodeConfig = await resolveDefaultProviderFromVSCodeConfigOrFeatureFlags(config.autocompleteAdvancedProvider);
    if (providerAndModelFromVSCodeConfig) {
        const { provider, model } = providerAndModelFromVSCodeConfig;
        switch (provider) {
            case 'unstable-openai': {
                return (0, unstable_openai_1.createProviderConfig)({
                    client,
                });
            }
            case 'fireworks': {
                return (0, fireworks_1.createProviderConfig)({
                    client,
                    model: config.autocompleteAdvancedModel ?? model ?? null,
                    timeouts: config.autocompleteTimeouts,
                    authStatus,
                    config,
                });
            }
            case 'anthropic': {
                return (0, anthropic_1.createProviderConfig)({ client });
            }
            case 'experimental-ollama':
            case 'unstable-ollama': {
                return (0, experimental_ollama_1.createProviderConfig)(config.autocompleteExperimentalOllamaOptions);
            }
            default:
                (0, log_1.logError)('createProviderConfig', `Unrecognized provider '${config.autocompleteAdvancedProvider}' configured.`);
                return null;
        }
    }
    /**
     * If autocomplete provider is not defined in the VSCode settings,
     * check the completions provider in the connected Sourcegraph instance site config
     * and return the matching provider config.
     */
    if (authStatus.configOverwrites?.provider) {
        const parsed = parseProviderAndModel({
            provider: authStatus.configOverwrites.provider,
            model: authStatus.configOverwrites.completionModel,
        });
        if (!parsed) {
            (0, log_1.logError)('createProviderConfig', `Failed to parse the model name for '${authStatus.configOverwrites.provider}' completions provider.`);
            return null;
        }
        const { provider, model } = parsed;
        switch (provider) {
            case 'openai':
            case 'azure-openai':
                return (0, unstable_openai_1.createProviderConfig)({
                    client,
                    // Model name for azure openai provider is a deployment name. It shouldn't appear in logs.
                    model: provider === 'azure-openai' && model ? '' : model,
                });
            case 'fireworks':
                return (0, fireworks_1.createProviderConfig)({
                    client,
                    timeouts: config.autocompleteTimeouts,
                    model: model ?? null,
                    authStatus,
                    config,
                });
            case 'aws-bedrock':
            case 'anthropic':
                return (0, anthropic_1.createProviderConfig)({
                    client,
                    // Only pass through the upstream-defined model if we're using Cody Gateway
                    model: authStatus.configOverwrites.provider === 'sourcegraph'
                        ? authStatus.configOverwrites.completionModel
                        : undefined,
                });
            default:
                (0, log_1.logError)('createProviderConfig', `Unrecognized provider '${provider}' configured.`);
                return null;
        }
    }
    /**
     * If autocomplete provider is not defined neither in VSCode nor in Sourcegraph instance site config,
     * use the default provider config ("anthropic").
     */
    return (0, anthropic_1.createProviderConfig)({ client });
}
exports.createProviderConfig = createProviderConfig;
async function resolveDefaultProviderFromVSCodeConfigOrFeatureFlags(configuredProvider) {
    if (configuredProvider) {
        return { provider: configuredProvider };
    }
    const [starCoderHybrid, llamaCode13B] = await Promise.all([
        cody_shared_1.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyAutocompleteStarCoderHybrid),
        cody_shared_1.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyAutocompleteLlamaCode13B),
    ]);
    if (llamaCode13B) {
        return { provider: 'fireworks', model: 'llama-code-13b' };
    }
    if (starCoderHybrid) {
        return { provider: 'fireworks', model: 'starcoder-hybrid' };
    }
    return null;
}
const delimiters = {
    sourcegraph: '/',
    'aws-bedrock': '.',
};
/**
 * For certain completions providers configured in the Sourcegraph instance site config
 * the model name consists MODEL_PROVIDER and MODEL_NAME separated by a specific delimiter (see {@link delimiters}).
 *
 * This function checks if the given provider has a specific model naming format and:
 *   - if it does, parses the model name and returns the parsed provider and model names;
 *   - if it doesn't, returns the original provider and model names.
 *
 * E.g. for "sourcegraph" provider the completions model name consists of model provider and model name separated by "/".
 * So when received `{ provider: "sourcegraph", model: "anthropic/claude-instant-1" }` the expected output would be `{ provider: "anthropic", model: "claude-instant-1" }`.
 */
function parseProviderAndModel({ provider, model, }) {
    const delimiter = delimiters[provider];
    if (!delimiter) {
        return { provider, model };
    }
    if (model) {
        const index = model.indexOf(delimiter);
        const parsedProvider = model.slice(0, index);
        const parsedModel = model.slice(index + 1);
        if (parsedProvider && parsedModel) {
            return { provider: parsedProvider, model: parsedModel };
        }
    }
    return null;
}
