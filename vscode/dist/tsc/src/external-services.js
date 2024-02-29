"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureExternalServices = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const client_1 = require("./completions/client");
const log_1 = require("./log");
async function configureExternalServices(context, initialConfig, platform) {
    const sentryService = platform.createSentryService?.(initialConfig);
    const openTelemetryService = platform.createOpenTelemetryService?.(initialConfig);
    const completionsClient = platform.createCompletionsClient(initialConfig, log_1.logger);
    const codeCompletionsClient = (0, client_1.createClient)(initialConfig, log_1.logger);
    const symfRunner = platform.createSymfRunner?.(context, initialConfig.serverEndpoint, initialConfig.accessToken, completionsClient);
    if (initialConfig.codebase && (0, cody_shared_1.isError)(await cody_shared_1.graphqlClient.getRepoId(initialConfig.codebase))) {
        (0, log_1.logDebug)('external-services:configureExternalServices', `Cody could not find the '${initialConfig.codebase}' repository on your Sourcegraph instance.\nPlease check that the repository exists. You can override the repository with the "cody.codebase" setting.`);
    }
    const localEmbeddings = platform.createLocalEmbeddingsController?.(initialConfig);
    const chatClient = new cody_shared_1.ChatClient(completionsClient);
    const guardrails = new cody_shared_1.SourcegraphGuardrailsClient(cody_shared_1.graphqlClient);
    return {
        intentDetector: new cody_shared_1.SourcegraphIntentDetectorClient(completionsClient),
        chatClient,
        codeCompletionsClient,
        guardrails,
        localEmbeddings,
        symfRunner,
        onConfigurationChange: newConfig => {
            sentryService?.onConfigurationChange(newConfig);
            openTelemetryService?.onConfigurationChange(newConfig);
            completionsClient.onConfigurationChange(newConfig);
            codeCompletionsClient.onConfigurationChange(newConfig);
            void localEmbeddings?.setAccessToken(newConfig.serverEndpoint, newConfig.accessToken);
        },
    };
}
exports.configureExternalServices = configureExternalServices;
