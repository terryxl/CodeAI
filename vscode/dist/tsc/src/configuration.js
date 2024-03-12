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
exports.getFullConfig = exports.getConfiguration = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const configuration_keys_1 = require("./configuration-keys");
const LocalStorageProvider_1 = require("./services/LocalStorageProvider");
const SecretStorageProvider_1 = require("./services/SecretStorageProvider");
/**
 * All configuration values, with some sanitization performed.
 */
function getConfiguration(config = vscode.workspace.getConfiguration()) {
    const isTesting = process.env.CODY_TESTING === "true";
    function getHiddenSetting(configKey, defaultValue) {
        return config.get(`cody.${configKey}`, defaultValue);
    }
    let debugRegex = null;
    try {
        const debugPattern = config.get(configuration_keys_1.CONFIG_KEY.debugFilter, null);
        if (debugPattern) {
            if (debugPattern === "*") {
                debugRegex = /.*/;
            }
            else {
                debugRegex = new RegExp(debugPattern);
            }
        }
    }
    catch (error) {
        void vscode.window.showErrorMessage("Error parsing cody.debug.filter regex - using default '*'", error);
        debugRegex = /.*/;
    }
    let autocompleteAdvancedProvider = config.get(configuration_keys_1.CONFIG_KEY.autocompleteAdvancedProvider, null);
    // Handle deprecated provider identifiers
    switch (autocompleteAdvancedProvider) {
        case "unstable-fireworks":
            autocompleteAdvancedProvider = "fireworks";
            break;
        case "unstable-ollama":
            autocompleteAdvancedProvider = "experimental-ollama";
            break;
    }
    // check if the configured enum values are valid
    const configKeys = [
        "autocompleteAdvancedProvider",
        "autocompleteAdvancedModel",
    ];
    for (const configVal of configKeys) {
        const key = configVal.replaceAll(/([A-Z])/g, ".$1").toLowerCase();
        const value = config.get(configuration_keys_1.CONFIG_KEY[configVal]);
        checkValidEnumValues(key, value);
    }
    const autocompleteExperimentalGraphContext = getHiddenSetting("autocomplete.experimental.graphContext", null);
    return {
        proxy: config.get(configuration_keys_1.CONFIG_KEY.proxy, null),
        codebase: sanitizeCodebase(config.get(configuration_keys_1.CONFIG_KEY.codebase)),
        customHeaders: config.get(configuration_keys_1.CONFIG_KEY.customHeaders, {}),
        useContext: config.get(configuration_keys_1.CONFIG_KEY.useContext) ||
            "embeddings",
        debugEnable: config.get(configuration_keys_1.CONFIG_KEY.debugEnable, false),
        debugVerbose: config.get(configuration_keys_1.CONFIG_KEY.debugVerbose, false),
        debugFilter: debugRegex,
        telemetryLevel: config.get(configuration_keys_1.CONFIG_KEY.telemetryLevel, "all"),
        autocomplete: config.get(configuration_keys_1.CONFIG_KEY.autocompleteEnabled, true),
        autocompleteLanguages: config.get(configuration_keys_1.CONFIG_KEY.autocompleteLanguages, {
            "*": true,
        }),
        chatPreInstruction: config.get(configuration_keys_1.CONFIG_KEY.chatPreInstruction, ""),
        commandCodeLenses: config.get(configuration_keys_1.CONFIG_KEY.commandCodeLenses, false),
        editorTitleCommandIcon: config.get(configuration_keys_1.CONFIG_KEY.editorTitleCommandIcon, true),
        autocompleteAdvancedProvider,
        autocompleteAdvancedModel: config.get(configuration_keys_1.CONFIG_KEY.autocompleteAdvancedModel, null),
        autocompleteCompleteSuggestWidgetSelection: config.get(configuration_keys_1.CONFIG_KEY.autocompleteCompleteSuggestWidgetSelection, true),
        autocompleteFormatOnAccept: config.get(configuration_keys_1.CONFIG_KEY.autocompleteFormatOnAccept, true),
        autocompleteDisableInsideComments: config.get(configuration_keys_1.CONFIG_KEY.autocompleteDisableInsideComments, false),
        codeActions: config.get(configuration_keys_1.CONFIG_KEY.codeActionsEnabled, true),
        commandHints: config.get(configuration_keys_1.CONFIG_KEY.commandHintsEnabled, false),
        /**
         * Hidden settings for internal use only.
         */
        internalUnstable: getHiddenSetting("internal.unstable", isTesting),
        autocompleteExperimentalGraphContext,
        experimentalSimpleChatContext: getHiddenSetting("experimental.simpleChatContext", true),
        experimentalSymfContext: getHiddenSetting("experimental.symfContext", true),
        experimentalGuardrails: getHiddenSetting("experimental.guardrails", isTesting),
        experimentalTracing: getHiddenSetting("experimental.tracing", false),
        autocompleteExperimentalDynamicMultilineCompletions: getHiddenSetting("autocomplete.experimental.dynamicMultilineCompletions", false),
        autocompleteExperimentalHotStreak: getHiddenSetting("autocomplete.experimental.hotStreak", false),
        autocompleteExperimentalOllamaOptions: getHiddenSetting("autocomplete.experimental.ollamaOptions", {
            url: "http://localhost:11434",
            model: "codellama:7b-code",
        }),
        autocompleteExperimentalSmartThrottle: getHiddenSetting("autocomplete.experimental.smartThrottle", false),
        // Note: In spirit, we try to minimize agent-specific code paths in the VSC extension.
        // We currently use this flag for the agent to provide more helpful error messages
        // when something goes wrong, and to suppress event logging in the agent.
        // Rely on this flag sparingly.
        isRunningInsideAgent: getHiddenSetting("advanced.agent.running", false),
        agentIDE: getHiddenSetting("advanced.agent.ide"),
        autocompleteTimeouts: {
            multiline: getHiddenSetting("autocomplete.advanced.timeout.multiline", undefined),
            singleline: getHiddenSetting("autocomplete.advanced.timeout.singleline", undefined),
        },
        ModelsVender: config.get(configuration_keys_1.CONFIG_KEY.modelsVender, "Azure"),
        testingLocalEmbeddingsModel: isTesting
            ? getHiddenSetting("testing.localEmbeddings.model", undefined)
            : undefined,
        testingLocalEmbeddingsEndpoint: isTesting
            ? getHiddenSetting("testing.localEmbeddings.endpoint", undefined)
            : undefined,
        testingLocalEmbeddingsIndexLibraryPath: isTesting
            ? getHiddenSetting("testing.localEmbeddings.indexLibraryPath", undefined)
            : undefined,
    };
}
exports.getConfiguration = getConfiguration;
function sanitizeCodebase(codebase) {
    if (!codebase) {
        return "";
    }
    const protocolRegexp = /^(https?):\/\//;
    const trailingSlashRegexp = /\/$/;
    return codebase
        .replace(protocolRegexp, "")
        .trim()
        .replace(trailingSlashRegexp, "");
}
const getFullConfig = async () => {
    const config = getConfiguration();
    const isTesting = process.env.CODY_TESTING === "true";
    const serverEndpoint = LocalStorageProvider_1.localStorage?.getEndpoint() ||
        (isTesting
            ? "http://localhost:49300/"
            : config.ModelsVender === "Azure"
                ? cody_shared_1.DOTCOM_AZURE_URL.href
                : cody_shared_1.DOTCOM_URL.href);
    const accessToken = (await (0, SecretStorageProvider_1.getAccessToken)()) || null;
    return { ...config, accessToken, serverEndpoint };
};
exports.getFullConfig = getFullConfig;
function checkValidEnumValues(configName, value) {
    const validEnumValues = (0, configuration_keys_1.getConfigEnumValues)(`cody.${configName}`);
    if (value) {
        if (!validEnumValues.includes(value)) {
            void vscode.window.showErrorMessage(`Invalid value for ${configName}: ${value}. Valid values are: ${validEnumValues.join(", ")}`);
        }
    }
}
