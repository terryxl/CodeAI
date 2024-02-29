"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const configuration_1 = require("./configuration");
const mocks_1 = require("./testutils/mocks");
(0, vitest_1.describe)('getConfiguration', () => {
    (0, vitest_1.it)('returns default values when no config set', () => {
        const config = {
            get: (_key, defaultValue) => defaultValue,
        };
        (0, vitest_1.expect)((0, configuration_1.getConfiguration)(config)).toEqual(mocks_1.DEFAULT_VSCODE_SETTINGS);
    });
    (0, vitest_1.it)('reads values from config', () => {
        const config = {
            get: key => {
                switch (key) {
                    case 'cody.serverEndpoint':
                        return 'http://example.com';
                    case 'cody.proxy':
                        return 'socks5://127.0.0.1:9999';
                    case 'cody.codebase':
                        return 'my/codebase';
                    case 'cody.useContext':
                        return 'keyword';
                    case 'cody.customHeaders':
                        return {
                            'Cache-Control': 'no-cache',
                            'Proxy-Authenticate': 'Basic',
                        };
                    case 'cody.autocomplete.enabled':
                        return false;
                    case 'cody.autocomplete.languages':
                        return { '*': true };
                    case 'cody.commandCodeLenses':
                        return true;
                    case 'cody.editorTitleCommandIcon':
                        return true;
                    case 'cody.experimental.guardrails':
                        return true;
                    case 'cody.codeActions.enabled':
                        return true;
                    case 'cody.commandHints.enabled':
                        return true;
                    case 'cody.experimental.localSymbols':
                        return true;
                    case 'cody.experimental.symf.path':
                        return '/usr/local/bin/symf';
                    case 'cody.experimental.simpleChatContext':
                        return true;
                    case 'cody.experimental.symfContext':
                        return true;
                    case 'cody.experimental.tracing':
                        return true;
                    case 'cody.debug.enable':
                        return true;
                    case 'cody.debug.verbose':
                        return true;
                    case 'cody.debug.filter':
                        return /.*/;
                    case 'cody.telemetry.level':
                        return 'off';
                    case 'cody.chat.preInstruction':
                        return 'My name is Jeff.';
                    case 'cody.autocomplete.advanced.provider':
                        return 'unstable-openai';
                    case 'cody.autocomplete.advanced.model':
                        return 'starcoder-16b';
                    case 'cody.autocomplete.advanced.timeout.multiline':
                        return undefined;
                    case 'cody.autocomplete.advanced.timeout.singleline':
                        return undefined;
                    case 'cody.autocomplete.completeSuggestWidgetSelection':
                        return false;
                    case 'cody.autocomplete.formatOnAccept':
                        return true;
                    case 'cody.autocomplete.disableInsideComments':
                        return false;
                    case 'cody.autocomplete.experimental.syntacticPostProcessing':
                        return true;
                    case 'cody.autocomplete.experimental.dynamicMultilineCompletions':
                        return false;
                    case 'cody.autocomplete.experimental.hotStreak':
                        return false;
                    case 'cody.autocomplete.experimental.ollamaOptions':
                        return {
                            model: 'codellama:7b-code',
                            url: 'http://localhost:11434',
                        };
                    case 'cody.autocomplete.experimental.graphContext':
                        return 'bfg';
                    case 'cody.autocomplete.experimental.smartThrottle':
                        return false;
                    case 'cody.advanced.agent.running':
                        return false;
                    case 'cody.advanced.agent.ide':
                        return undefined;
                    case 'cody.internal.unstable':
                        return false;
                    default:
                        throw new Error(`unexpected key: ${key}`);
                }
            },
        };
        (0, vitest_1.expect)((0, configuration_1.getConfiguration)(config)).toEqual({
            proxy: 'socks5://127.0.0.1:9999',
            codebase: 'my/codebase',
            useContext: 'keyword',
            customHeaders: {
                'Cache-Control': 'no-cache',
                'Proxy-Authenticate': 'Basic',
            },
            chatPreInstruction: 'My name is Jeff.',
            autocomplete: false,
            autocompleteLanguages: {
                '*': true,
            },
            commandCodeLenses: true,
            experimentalSimpleChatContext: true,
            experimentalSymfContext: true,
            experimentalTracing: true,
            editorTitleCommandIcon: true,
            experimentalGuardrails: true,
            codeActions: true,
            commandHints: true,
            isRunningInsideAgent: false,
            agentIDE: undefined,
            internalUnstable: false,
            debugEnable: true,
            debugVerbose: true,
            debugFilter: /.*/,
            telemetryLevel: 'off',
            autocompleteAdvancedProvider: 'unstable-openai',
            autocompleteAdvancedModel: 'starcoder-16b',
            autocompleteCompleteSuggestWidgetSelection: false,
            autocompleteFormatOnAccept: true,
            autocompleteDisableInsideComments: false,
            autocompleteExperimentalDynamicMultilineCompletions: false,
            autocompleteExperimentalHotStreak: false,
            autocompleteExperimentalGraphContext: 'bfg',
            autocompleteExperimentalSmartThrottle: false,
            autocompleteExperimentalOllamaOptions: {
                model: 'codellama:7b-code',
                url: 'http://localhost:11434',
            },
            autocompleteTimeouts: {
                multiline: undefined,
                singleline: undefined,
            },
            testingLocalEmbeddingsEndpoint: undefined,
            testingLocalEmbeddingsIndexLibraryPath: undefined,
            testingLocalEmbeddingsModel: undefined,
        });
    });
});
