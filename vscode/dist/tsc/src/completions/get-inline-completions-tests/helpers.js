"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCompletionProviderConfig = exports.getInlineCompletionsInsertText = exports.getInlineCompletions = exports.getInlineCompletionsWithInlinedChunks = exports.paramsWithInlinedCompletion = exports.params = exports.T = void 0;
const dedent_1 = __importDefault(require("dedent"));
const lodash_1 = require("lodash");
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const parse_tree_cache_1 = require("../../tree-sitter/parse-tree-cache");
const parser_1 = require("../../tree-sitter/parser");
const context_mixer_1 = require("../context/context-mixer");
const context_strategy_1 = require("../context/context-strategy");
const doc_context_getters_1 = require("../doc-context-getters");
const get_current_doc_context_1 = require("../get-current-doc-context");
const get_inline_completions_1 = require("../get-inline-completions");
const anthropic_1 = require("../providers/anthropic");
const request_manager_1 = require("../request-manager");
const test_helpers_1 = require("../test-helpers");
const hot_streak_1 = require("../providers/hot-streak");
const completion_provider_config_1 = require("../completion-provider-config");
const mocks_1 = require("../../testutils/mocks");
const utils_1 = require("../utils");
// The dedent package seems to replace `\t` with `\\t` so in order to insert a tab character, we
// have to use interpolation. We abbreviate this to `T` because ${T} is exactly 4 characters,
// mimicking the default indentation of four spaces
exports.T = '\t';
const URI_FIXTURE = (0, cody_shared_1.testFileUri)('test.ts');
/**
 * A test helper to create the parameters for {@link getInlineCompletions}.
 *
 * The code example must include a block character (█) to denote the current cursor position.
 */
function params(code, responses, params = {}) {
    const { languageId = 'typescript', onNetworkRequest, completionResponseGenerator, triggerKind = get_inline_completions_1.TriggerKind.Automatic, selectedCompletionInfo, takeSuggestWidgetSelectionIntoAccount, isDotComUser = false, providerOptions, ...restParams } = params;
    let requestCounter = 0;
    let resolveCompletionResponseGenerator;
    const completionResponseGeneratorPromise = new Promise(resolve => {
        resolveCompletionResponseGenerator = resolve;
    });
    const client = {
        async *complete(completeParams) {
            onNetworkRequest?.(completeParams);
            if (completionResponseGenerator) {
                for await (const response of completionResponseGenerator(completeParams)) {
                    yield { ...response, stopReason: cody_shared_1.CompletionStopReason.StreamingChunk };
                }
                // Signal to tests that all streaming chunks are processed.
                resolveCompletionResponseGenerator?.();
            }
            if (responses === 'never-resolve') {
                return new Promise(() => { });
            }
            return responses[requestCounter++] || { completion: '', stopReason: 'unknown' };
        },
    };
    const providerConfig = (0, anthropic_1.createProviderConfig)({
        client,
        providerOptions,
    });
    const { document, position } = (0, test_helpers_1.documentAndPosition)(code, languageId, URI_FIXTURE.toString());
    const parser = (0, parser_1.getParser)(document.languageId);
    if (parser) {
        (0, parse_tree_cache_1.updateParseTreeCache)(document, parser);
    }
    const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
        document,
        position,
        maxPrefixLength: 1000,
        maxSuffixLength: 1000,
        dynamicMultilineCompletions: false,
        context: takeSuggestWidgetSelectionIntoAccount
            ? {
                triggerKind: 0,
                selectedCompletionInfo,
            }
            : undefined,
    });
    if (docContext === null) {
        throw new Error();
    }
    return {
        document,
        position,
        docContext,
        triggerKind,
        selectedCompletionInfo,
        providerConfig,
        requestManager: new request_manager_1.RequestManager(),
        contextMixer: new context_mixer_1.ContextMixer(new context_strategy_1.DefaultContextStrategyFactory('none')),
        smartThrottleService: null,
        completionIntent: (0, doc_context_getters_1.getCompletionIntent)({
            document,
            position,
            prefix: docContext.prefix,
        }),
        isDotComUser,
        ...restParams,
        // Test-specific helpers
        completionResponseGeneratorPromise,
    };
}
exports.params = params;
/**
 * A test helper to create the parameters for {@link getInlineCompletions} with a completion
 * that's inlined in the code. Examples:
 *
 * 1. Params with prefix and suffix only and no completion response.
 *
 * function myFunction() {
 *   █
 * }
 *
 * E.g. { prefix: "function myFunction() {\n  ", suffix: "\n}" }
 *
 * 2. Params with prefix, suffix and the full completion response received with no intermediate chunks.
 *
 * function myFunction() {
 *   █const result = {
 *     value: 1,
 *     debug: true
 *   }
 *   return result█
 * }
 *
 * 3. Params with prefix, suffix and three completion chunks.
 *
 * function myFunction() {
 *   █const result = {
 *     value: 1,█
 *     debug: true
 *   }█
 *   return result█
 * }
 */
function paramsWithInlinedCompletion(code, { delayBetweenChunks, ...completionParams } = {}) {
    const chunks = (0, dedent_1.default)(code).split('█');
    if (chunks.length < 2) {
        throw new Error('Code example must include a block character (█) to denote the current cursor position.');
    }
    // For cases where no network request needed because a completion is cached already
    if (chunks.length === 2) {
        const [prefix, suffix] = chunks;
        return params([prefix, suffix].join('█'), [], completionParams);
    }
    // The full completion is received right away with no intermediate chunks
    if (chunks.length === 3) {
        const [prefix, completion, suffix] = chunks;
        return params([prefix, suffix].join('█'), [{ completion, stopReason: '' }], completionParams);
    }
    const [prefix, ...completionChunks] = chunks;
    const suffix = completionChunks.pop();
    const completion = completionChunks.join('');
    // The completion is streamed and processed chunk by chunk
    return params([prefix, suffix].join('█'), [{ completion, stopReason: '' }], {
        async *completionResponseGenerator() {
            let lastResponse = '';
            for (const completionChunk of completionChunks) {
                lastResponse += completionChunk;
                yield {
                    completion: lastResponse,
                    stopReason: cody_shared_1.CompletionStopReason.StreamingChunk,
                };
                if (delayBetweenChunks) {
                    await (0, utils_1.sleep)(delayBetweenChunks);
                }
            }
        },
        ...completionParams,
    });
}
exports.paramsWithInlinedCompletion = paramsWithInlinedCompletion;
/**
 * A wrapper around `getInlineCompletions` helper with a few differences optimized for the
 * most popular test cases with the aim to reduce the boilerplate code:
 *
 * 1. Uses `paramsWithInlinedCompletion` internally to create arguments for `getInlineCompletions`
 * which allows the consumer to define prefix, suffix and completion chunks in one template literal.
 * 2. Throws an error is the returned result is `null`. We can still use a lower level.
 * 3. Returns `params` a part of the result too, allowing to use its values in tests.
 */
async function getInlineCompletionsWithInlinedChunks(code, completionParams = {}) {
    const params = paramsWithInlinedCompletion(code, completionParams);
    const result = await getInlineCompletions(params);
    if (!result) {
        throw new Error('This test helpers should always return a result');
    }
    const acceptFirstCompletionAndPressEnter = () => {
        const [{ insertText }] = result.items;
        const newLineString = (0, hot_streak_1.pressEnterAndGetIndentString)(insertText, params.docContext.currentLinePrefix, params.document);
        const codeWithCompletionAndCursor = params.docContext.prefix + insertText + newLineString + '█' + params.docContext.suffix;
        // Workaround for the internal `dedent` call to save the useful indentation.
        const codeWithExtraIndent = codeWithCompletionAndCursor
            .split('\n')
            .map(line => '  ' + line)
            .join('\n');
        return getInlineCompletionsWithInlinedChunks(codeWithExtraIndent, {
            ...completionParams,
            requestManager: params.requestManager,
        });
    };
    return { ...params, ...result, acceptFirstCompletionAndPressEnter };
}
exports.getInlineCompletionsWithInlinedChunks = getInlineCompletionsWithInlinedChunks;
/**
 * Wraps the `getInlineCompletions` function to omit `logId` so that test expected values can omit
 * it and be stable.
 */
async function getInlineCompletions(params) {
    const { configuration = {} } = params;
    await initCompletionProviderConfig(configuration);
    const result = await (0, get_inline_completions_1.getInlineCompletions)(params);
    if (result) {
        const { logId: _discard, ...rest } = result;
        return {
            ...rest,
            items: result.items.map(({ stopReason: discard, ...item }) => item),
        };
    }
    completion_provider_config_1.completionProviderConfig.setConfig({});
    return result;
}
exports.getInlineCompletions = getInlineCompletions;
/** Test helper for when you just want to assert the completion strings. */
async function getInlineCompletionsInsertText(params) {
    const result = await getInlineCompletions(params);
    return result?.items.map(c => c.insertText) ?? [];
}
exports.getInlineCompletionsInsertText = getInlineCompletionsInsertText;
function initCompletionProviderConfig(config) {
    return completion_provider_config_1.completionProviderConfig.init(config, mocks_1.emptyMockFeatureFlagProvider);
}
exports.initCompletionProviderConfig = initCompletionProviderConfig;
vitest_1.expect.extend({
    /**
     * Checks if `CompletionParameters[]` contains one item with single-line stop sequences.
     */
    toBeSingleLine(requests, _) {
        const { isNot } = this;
        return {
            pass: requests.length === 1 && (0, lodash_1.isEqual)(requests[0]?.stopSequences, anthropic_1.SINGLE_LINE_STOP_SEQUENCES),
            message: () => `Completion requests are${isNot ? ' not' : ''} single-line`,
            actual: requests.map(r => ({ stopSequences: r.stopSequences })),
            expected: [{ stopSequences: anthropic_1.SINGLE_LINE_STOP_SEQUENCES }],
        };
    },
    /**
     * Checks if `CompletionParameters[]` contains three items with multi-line stop sequences.
     */
    toBeMultiLine(requests, _) {
        const { isNot } = this;
        return {
            pass: (0, lodash_1.isEqual)(requests[0]?.stopSequences, anthropic_1.MULTI_LINE_STOP_SEQUENCES),
            message: () => `Completion requests are${isNot ? ' not' : ''} multi-line`,
            actual: requests.map(r => ({ stopSequences: r.stopSequences })),
            expected: [
                {
                    stopSequences: anthropic_1.MULTI_LINE_STOP_SEQUENCES,
                },
            ],
        };
    },
});
