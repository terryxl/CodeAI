"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const mocks_1 = require("../../testutils/mocks");
const create_provider_1 = require("./create-provider");
const protocol_1 = require("../../chat/protocol");
const getVSCodeConfigurationWithAccessToken = (config = {}) => ({
    ...mocks_1.DEFAULT_VSCODE_SETTINGS,
    ...config,
    serverEndpoint: 'https://example.com',
    accessToken: 'foobar',
});
const dummyCodeCompletionsClient = {
    async *complete() {
        yield { completion: '', stopReason: '' };
    },
    logger: undefined,
    onConfigurationChange: () => undefined,
};
const dummyAuthStatus = protocol_1.defaultAuthStatus;
cody_shared_1.graphqlClient.onConfigurationChange({});
(0, vitest_1.describe)('createProviderConfig', () => {
    (0, vitest_1.describe)('if completions provider fields are defined in VSCode settings', () => {
        (0, vitest_1.it)('returns null if completions provider is not supported', async () => {
            const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken({
                autocompleteAdvancedProvider: 'nasa-ai',
            }), dummyCodeCompletionsClient, dummyAuthStatus);
            (0, vitest_1.expect)(provider).toBeNull();
        });
    });
    (0, vitest_1.describe)('if completions provider field is not defined in VSCode settings', () => {
        (0, vitest_1.it)('returns "anthropic" if completions provider is not configured', async () => {
            const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken({
                autocompleteAdvancedProvider: null,
            }), dummyCodeCompletionsClient, dummyAuthStatus);
            (0, vitest_1.expect)(provider?.identifier).toBe('anthropic');
            (0, vitest_1.expect)(provider?.model).toBe('claude-instant-1.2');
        });
        (0, vitest_1.it)('returns "fireworks" provider config and corresponding model if specified', async () => {
            const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken({
                autocompleteAdvancedProvider: 'fireworks',
                autocompleteAdvancedModel: 'starcoder-7b',
            }), dummyCodeCompletionsClient, dummyAuthStatus);
            (0, vitest_1.expect)(provider?.identifier).toBe('fireworks');
            (0, vitest_1.expect)(provider?.model).toBe('starcoder-7b');
        });
        (0, vitest_1.it)('returns "fireworks" provider config if specified in settings and default model', async () => {
            const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken({ autocompleteAdvancedProvider: 'fireworks' }), dummyCodeCompletionsClient, dummyAuthStatus);
            (0, vitest_1.expect)(provider?.identifier).toBe('fireworks');
            (0, vitest_1.expect)(provider?.model).toBe('starcoder-hybrid');
        });
        (0, vitest_1.it)('returns "openai" provider config if specified in VSCode settings; model is ignored', async () => {
            const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken({
                autocompleteAdvancedProvider: 'unstable-openai',
                autocompleteAdvancedModel: 'hello-world',
            }), dummyCodeCompletionsClient, dummyAuthStatus);
            (0, vitest_1.expect)(provider?.identifier).toBe('unstable-openai');
            (0, vitest_1.expect)(provider?.model).toBe('gpt-35-turbo');
        });
        (0, vitest_1.it)('returns "anthropic" provider config if specified in VSCode settings', async () => {
            const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken({
                autocompleteAdvancedProvider: 'anthropic',
            }), dummyCodeCompletionsClient, dummyAuthStatus);
            (0, vitest_1.expect)(provider?.identifier).toBe('anthropic');
            (0, vitest_1.expect)(provider?.model).toBe('claude-instant-1.2');
        });
        (0, vitest_1.it)('provider specified in VSCode settings takes precedence over the one defined in the site config', async () => {
            const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken({
                autocompleteAdvancedProvider: 'unstable-openai',
            }), dummyCodeCompletionsClient, {
                ...dummyAuthStatus,
                configOverwrites: {
                    provider: 'azure-open-ai',
                    completionModel: 'gpt-35-turbo-test',
                },
            });
            (0, vitest_1.expect)(provider?.identifier).toBe('unstable-openai');
            (0, vitest_1.expect)(provider?.model).toBe('gpt-35-turbo');
        });
    });
    (0, vitest_1.describe)('completions provider and model are defined in the site config and not set in VSCode settings', () => {
        (0, vitest_1.describe)('if provider is "sourcegraph"', () => {
            const testCases = [
                // sourcegraph
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: 'hello-world' },
                    expected: null,
                },
                {
                    codyLLMConfig: {
                        provider: 'sourcegraph',
                        completionModel: 'anthropic/claude-instant-1.2',
                    },
                    expected: { provider: 'anthropic', model: 'anthropic/claude-instant-1.2' },
                },
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: 'anthropic/' },
                    expected: null,
                },
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: '/claude-instant-1.2' },
                    expected: null,
                },
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: 'fireworks/starcoder' },
                    expected: { provider: 'fireworks', model: 'starcoder' },
                },
                // aws-bedrock
                {
                    codyLLMConfig: { provider: 'aws-bedrock', completionModel: 'hello-world' },
                    expected: null,
                },
                {
                    codyLLMConfig: {
                        provider: 'aws-bedrock',
                        completionModel: 'anthropic.claude-instant-1.2',
                    },
                    expected: { provider: 'anthropic', model: 'claude-instant-1.2' },
                },
                {
                    codyLLMConfig: { provider: 'aws-bedrock', completionModel: 'anthropic.' },
                    expected: null,
                },
                {
                    codyLLMConfig: {
                        provider: 'aws-bedrock',
                        completionModel: 'anthropic/claude-instant-1.2',
                    },
                    expected: null,
                },
                // open-ai
                {
                    codyLLMConfig: { provider: 'openai', completionModel: 'gpt-35-turbo-test' },
                    expected: { provider: 'unstable-openai', model: 'gpt-35-turbo-test' },
                },
                {
                    codyLLMConfig: { provider: 'openai' },
                    expected: { provider: 'unstable-openai', model: 'gpt-35-turbo' },
                },
                // azure-openai
                {
                    codyLLMConfig: { provider: 'azure-openai', completionModel: 'gpt-35-turbo-test' },
                    expected: { provider: 'unstable-openai', model: '' },
                },
                {
                    codyLLMConfig: { provider: 'azure-openai' },
                    expected: { provider: 'unstable-openai', model: 'gpt-35-turbo' },
                },
                // fireworks
                {
                    codyLLMConfig: { provider: 'fireworks', completionModel: 'llama-code-13b' },
                    expected: { provider: 'fireworks', model: 'llama-code-13b' },
                },
                {
                    codyLLMConfig: { provider: 'fireworks' },
                    expected: { provider: 'fireworks', model: 'starcoder-hybrid' },
                },
                // unknown-provider
                {
                    codyLLMConfig: { provider: 'unknown-provider', completionModel: 'llama-code-7b' },
                    expected: null,
                },
                // provider not defined (backward compat)
                {
                    codyLLMConfig: { provider: undefined, completionModel: 'llama-code-7b' },
                    expected: { provider: 'anthropic', model: 'claude-instant-1.2' },
                },
            ];
            for (const { codyLLMConfig, expected } of testCases) {
                (0, vitest_1.it)(`returns ${JSON.stringify(expected)} when cody LLM config is ${JSON.stringify(codyLLMConfig)}`, async () => {
                    const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken(), dummyCodeCompletionsClient, { ...dummyAuthStatus, configOverwrites: codyLLMConfig });
                    if (expected === null) {
                        (0, vitest_1.expect)(provider).toBeNull();
                    }
                    else {
                        (0, vitest_1.expect)(provider?.identifier).toBe(expected.provider);
                        (0, vitest_1.expect)(provider?.model).toBe(expected.model);
                    }
                });
            }
        });
    });
    (0, vitest_1.it)('returns anthropic provider config if no completions provider specified in VSCode settings or site config', async () => {
        const provider = await (0, create_provider_1.createProviderConfig)(getVSCodeConfigurationWithAccessToken(), dummyCodeCompletionsClient, dummyAuthStatus);
        (0, vitest_1.expect)(provider?.identifier).toBe('anthropic');
        (0, vitest_1.expect)(provider?.model).toBe('claude-instant-1.2');
    });
});
