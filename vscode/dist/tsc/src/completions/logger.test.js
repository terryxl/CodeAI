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
const vitest_1 = require("vitest");
const telemetry_1 = require("../services/telemetry");
const telemetry_v2_1 = require("../services/telemetry-v2");
const textDocument_1 = require("../testutils/textDocument");
const get_current_doc_context_1 = require("./get-current-doc-context");
const get_inline_completions_1 = require("./get-inline-completions");
const CompletionLogger = __importStar(require("./logger"));
const test_helpers_1 = require("./test-helpers");
const helpers_1 = require("./get-inline-completions-tests/helpers");
const defaultArgs = {
    multiline: false,
    triggerKind: get_inline_completions_1.TriggerKind.Automatic,
    testFile: false,
    providerIdentifier: 'bfl',
    providerModel: 'blazing-fast-llm',
    languageId: 'typescript',
};
const defaultContextSummary = {
    strategy: 'none',
    duration: 0.1337,
    totalChars: 3,
    retrieverStats: {},
};
const { document, position } = (0, test_helpers_1.documentAndPosition)('const foo = █');
const defaultRequestParams = {
    document,
    position,
    docContext: (0, get_current_doc_context_1.getCurrentDocContext)({
        document,
        position,
        maxPrefixLength: 100,
        maxSuffixLength: 100,
        dynamicMultilineCompletions: false,
    }),
    selectedCompletionInfo: undefined,
};
const completionItemId = 'completion-item-id';
(0, vitest_1.describe)('logger', () => {
    let logSpy;
    let recordSpy;
    (0, vitest_1.beforeEach)(async () => {
        await (0, helpers_1.initCompletionProviderConfig)({});
        logSpy = vitest_1.vi.spyOn(telemetry_1.telemetryService, 'log');
        recordSpy = vitest_1.vi.spyOn(telemetry_v2_1.telemetryRecorder, 'recordEvent');
    });
    (0, vitest_1.afterEach)(() => {
        CompletionLogger.reset_testOnly();
    });
    (0, vitest_1.it)('logs a suggestion life cycle', () => {
        const item = { id: completionItemId, insertText: 'foo' };
        const id = CompletionLogger.create(defaultArgs);
        (0, vitest_1.expect)(typeof id).toBe('string');
        CompletionLogger.start(id);
        CompletionLogger.networkRequestStarted(id, defaultContextSummary);
        CompletionLogger.loaded(id, defaultRequestParams, [item], get_inline_completions_1.InlineCompletionsResultSource.Network, false);
        CompletionLogger.suggested(id);
        CompletionLogger.accepted(id, document, item, (0, textDocument_1.range)(0, 0, 0, 0), false);
        const shared = {
            id: vitest_1.expect.any(String),
            languageId: 'typescript',
            testFile: false,
            source: 'Network',
            triggerKind: 'Automatic',
            multiline: false,
            multilineMode: null,
            otherCompletionProviderEnabled: false,
            otherCompletionProviders: [],
            providerIdentifier: 'bfl',
            providerModel: 'blazing-fast-llm',
            contextSummary: {
                retrieverStats: {},
                strategy: 'none',
                totalChars: 3,
                duration: 0.1337,
            },
            items: [
                {
                    charCount: 3,
                    lineCount: 1,
                    lineTruncatedCount: undefined,
                    nodeTypes: undefined,
                    parseErrorCount: undefined,
                    truncatedWith: undefined,
                },
            ],
        };
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:suggested', {
            ...shared,
            accepted: true,
            completionsStartedSinceLastSuggestion: 1,
            displayDuration: vitest_1.expect.any(Number),
            read: true,
            latency: vitest_1.expect.any(Number),
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'suggested', {
            version: 0,
            interactionID: vitest_1.expect.any(String),
            metadata: vitest_1.expect.anything(),
            privateMetadata: vitest_1.expect.anything(),
        });
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:accepted', {
            ...shared,
            acceptedItem: {
                charCount: 3,
                lineCount: 1,
                lineTruncatedCount: undefined,
                nodeTypes: undefined,
                parseErrorCount: undefined,
                truncatedWith: undefined,
            },
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'accepted', {
            version: 0,
            interactionID: vitest_1.expect.any(String),
            metadata: vitest_1.expect.anything(),
            privateMetadata: vitest_1.expect.anything(),
        });
    });
    (0, vitest_1.it)('reuses the completion ID for the same completion', () => {
        const item = { id: completionItemId, insertText: 'foo' };
        const id1 = CompletionLogger.create(defaultArgs);
        CompletionLogger.start(id1);
        CompletionLogger.networkRequestStarted(id1, defaultContextSummary);
        CompletionLogger.loaded(id1, defaultRequestParams, [item], get_inline_completions_1.InlineCompletionsResultSource.Network, false);
        CompletionLogger.suggested(id1);
        const loggerItem = CompletionLogger.getCompletionEvent(id1);
        const completionId = loggerItem?.params.id;
        (0, vitest_1.expect)(completionId).toBeDefined();
        const id2 = CompletionLogger.create(defaultArgs);
        CompletionLogger.start(id2);
        CompletionLogger.networkRequestStarted(id2, defaultContextSummary);
        CompletionLogger.loaded(id2, defaultRequestParams, [item], get_inline_completions_1.InlineCompletionsResultSource.Cache, false);
        CompletionLogger.suggested(id2);
        CompletionLogger.accepted(id2, document, item, (0, textDocument_1.range)(0, 0, 0, 0), false);
        const loggerItem2 = CompletionLogger.getCompletionEvent(id2);
        (0, vitest_1.expect)(loggerItem2?.params.id).toBe(completionId);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:suggested', vitest_1.expect.objectContaining({
            id: loggerItem?.params.id,
            source: 'Network',
        }), { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'suggested', vitest_1.expect.anything());
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:suggested', vitest_1.expect.objectContaining({
            id: loggerItem?.params.id,
            source: 'Cache',
        }), { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'suggested', vitest_1.expect.anything());
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:suggested', vitest_1.expect.objectContaining({
            id: loggerItem?.params.id,
        }), { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'suggested', vitest_1.expect.anything());
        // After accepting the completion, the ID won't be reused a third time
        const id3 = CompletionLogger.create(defaultArgs);
        CompletionLogger.start(id3);
        CompletionLogger.networkRequestStarted(id3, defaultContextSummary);
        CompletionLogger.loaded(id3, defaultRequestParams, [item], get_inline_completions_1.InlineCompletionsResultSource.Cache, false);
        CompletionLogger.suggested(id3);
        const loggerItem3 = CompletionLogger.getCompletionEvent(id3);
        (0, vitest_1.expect)(loggerItem3?.params.id).not.toBe(completionId);
    });
    (0, vitest_1.it)('does not log partial accept events if the length is not increasing', () => {
        const item = { insertText: 'export default class Agent' };
        const id = CompletionLogger.create(defaultArgs);
        CompletionLogger.start(id);
        CompletionLogger.partiallyAccept(id, item, 5, false);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:partiallyAccepted', vitest_1.expect.objectContaining({
            acceptedLength: 5,
            acceptedLengthDelta: 5,
        }), { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'partiallyAccepted', vitest_1.expect.anything());
        CompletionLogger.partiallyAccept(id, item, 10, false);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:partiallyAccepted', vitest_1.expect.objectContaining({
            acceptedLength: 10,
            acceptedLengthDelta: 5,
        }), { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'partiallyAccepted', vitest_1.expect.anything());
        CompletionLogger.partiallyAccept(id, item, 5, false);
        CompletionLogger.partiallyAccept(id, item, 8, false);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledTimes(2);
    });
});
