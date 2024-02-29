"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const nodeClient_1 = require("@sourcegraph/cody-shared/src/sourcegraph-api/completions/nodeClient");
const bfg_retriever_1 = require("./completions/context/retrievers/bfg/bfg-retriever");
const extension_common_1 = require("./extension.common");
const fetch_node_1 = require("./fetch.node");
const local_embeddings_1 = require("./local-context/local-embeddings");
const symf_1 = require("./local-context/symf");
const OpenTelemetryService_node_1 = require("./services/open-telemetry/OpenTelemetryService.node");
const sentry_node_1 = require("./services/sentry/sentry.node");
const provider_1 = require("./commands/services/provider");
/**
 * Activation entrypoint for the VS Code extension when running VS Code as a desktop app
 * (Node.js/Electron).
 */
function activate(context) {
    (0, fetch_node_1.initializeNetworkAgent)();
    // NOTE: local embeddings are only going to be supported in VSC for now.
    // Until we revisit this decision, we disable local embeddings for all agent
    // clients like the JetBrains plugin.
    const isLocalEmbeddingsDisabled = vscode.workspace
        .getConfiguration()
        .get('cody.advanced.agent.running', false);
    return (0, extension_common_1.activate)(context, {
        createLocalEmbeddingsController: isLocalEmbeddingsDisabled
            ? undefined
            : (config) => (0, local_embeddings_1.createLocalEmbeddingsController)(context, config),
        createCompletionsClient: (...args) => new nodeClient_1.SourcegraphNodeCompletionsClient(...args),
        createCommandsProvider: () => new provider_1.CommandsProvider(),
        createSymfRunner: (...args) => new symf_1.SymfRunner(...args),
        createBfgRetriever: () => new bfg_retriever_1.BfgRetriever(context),
        createSentryService: (...args) => new sentry_node_1.NodeSentryService(...args),
        createOpenTelemetryService: (...args) => new OpenTelemetryService_node_1.OpenTelemetryService(...args),
        onConfigurationChange: fetch_node_1.setCustomAgent,
    });
}
exports.activate = activate;
