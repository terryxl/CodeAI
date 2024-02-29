"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndProcessCompletions = exports.fetchAndProcessDynamicMultilineCompletions = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const debug_utils_1 = require("../../services/open-telemetry/debug-utils");
const can_use_partial_completion_1 = require("../can-use-partial-completion");
const text_processing_1 = require("../text-processing");
const parse_and_truncate_completion_1 = require("../text-processing/parse-and-truncate-completion");
const process_inline_completions_1 = require("../text-processing/process-inline-completions");
const dynamic_multiline_1 = require("./dynamic-multiline");
const hot_streak_1 = require("./hot-streak");
/**
 * Uses the first line of the completion to figure out if it start the new multiline syntax node.
 * If it does, continues streaming until the completion is truncated or we reach the token sample limit.
 */
async function* fetchAndProcessDynamicMultilineCompletions(params) {
    const { completionResponseGenerator, abortController, providerOptions, providerSpecificPostProcess, } = params;
    const { hotStreak, docContext, multiline, firstCompletionTimeout } = providerOptions;
    let hotStreakExtractor;
    function* stopStreamingAndUsePartialResponse(stopParams) {
        const { completedCompletion, rawCompletion, isFullResponse } = stopParams;
        (0, debug_utils_1.addAutocompleteDebugEvent)('stopStreamingAndUsePartialResponse', {
            isFullResponse,
            text: completedCompletion.insertText,
        });
        yield {
            docContext,
            completion: {
                ...completedCompletion,
                stopReason: isFullResponse ? completedCompletion.stopReason : 'streaming-truncation',
            },
        };
        // TODO(valery): disable hot-streak for long multiline completions?
        if (hotStreak) {
            hotStreakExtractor = (0, hot_streak_1.createHotStreakExtractor)({
                completedCompletion,
                ...params,
            });
            yield* hotStreakExtractor.extract(rawCompletion, isFullResponse);
        }
        else {
            abortController.abort();
        }
    }
    const generatorStartTime = performance.now();
    for await (const { completion, stopReason } of completionResponseGenerator) {
        const isFirstCompletionTimeoutElapsed = performance.now() - generatorStartTime >= firstCompletionTimeout;
        const isFullResponse = stopReason !== cody_shared_1.CompletionStopReason.StreamingChunk;
        const shouldYieldFirstCompletion = isFullResponse || isFirstCompletionTimeoutElapsed;
        const extractCompletion = shouldYieldFirstCompletion
            ? parse_and_truncate_completion_1.parseAndTruncateCompletion
            : can_use_partial_completion_1.canUsePartialCompletion;
        const rawCompletion = providerSpecificPostProcess(completion);
        if (!(0, text_processing_1.getFirstLine)(rawCompletion) && !shouldYieldFirstCompletion) {
            continue;
        }
        (0, debug_utils_1.addAutocompleteDebugEvent)(isFullResponse ? 'full_response' : 'incomplete_response', {
            multiline,
            currentLinePrefix: docContext.currentLinePrefix,
            text: rawCompletion,
        });
        if (hotStreakExtractor) {
            yield* hotStreakExtractor.extract(rawCompletion, isFullResponse);
            continue;
        }
        /**
         * This completion was triggered with the multiline trigger at the end of current line.
         * Process it as the usual multiline completion: continue streaming until it's truncated.
         */
        if (multiline) {
            (0, debug_utils_1.addAutocompleteDebugEvent)('multiline_branch');
            const completion = extractCompletion(rawCompletion, {
                document: providerOptions.document,
                docContext,
                isDynamicMultilineCompletion: false,
            });
            if (completion) {
                const completedCompletion = (0, process_inline_completions_1.processCompletion)(completion, providerOptions);
                yield* stopStreamingAndUsePartialResponse({
                    completedCompletion,
                    isFullResponse,
                    rawCompletion,
                });
            }
            continue;
        }
        /**
         * This completion was started without the multiline trigger at the end of current line.
         * Check if the the first completion line ends with the multiline trigger. If that's the case
         * continue streaming and pretend like this completion was multiline in the first place:
         *
         * 1. Update `docContext` with the `multilineTrigger` value.
         * 2. Set the cursor position to the multiline trigger.
         */
        const dynamicMultilineDocContext = {
            ...docContext,
            ...(0, dynamic_multiline_1.getDynamicMultilineDocContext)({
                docContext,
                languageId: providerOptions.document.languageId,
                insertText: rawCompletion,
            }),
        };
        if (dynamicMultilineDocContext.multilineTrigger && !isFirstCompletionTimeoutElapsed) {
            const completion = extractCompletion(rawCompletion, {
                document: providerOptions.document,
                docContext: dynamicMultilineDocContext,
                isDynamicMultilineCompletion: true,
            });
            if (completion) {
                (0, debug_utils_1.addAutocompleteDebugEvent)('isMultilineBasedOnFirstLine_resolve', {
                    currentLinePrefix: dynamicMultilineDocContext.currentLinePrefix,
                    text: completion.insertText,
                });
                const completedCompletion = (0, process_inline_completions_1.processCompletion)(completion, {
                    document: providerOptions.document,
                    position: dynamicMultilineDocContext.position,
                    docContext: dynamicMultilineDocContext,
                });
                yield* stopStreamingAndUsePartialResponse({
                    completedCompletion,
                    isFullResponse,
                    rawCompletion,
                });
            }
        }
        else {
            /**
             * This completion was started without the multiline trigger at the end of current line
             * and the first generated line does not end with a multiline trigger.
             *
             * Process this completion as a singleline completion: cut-off after the first new line char.
             */
            const completion = extractCompletion(rawCompletion, {
                document: providerOptions.document,
                docContext,
                isDynamicMultilineCompletion: false,
            });
            if (completion) {
                const firstLine = (0, text_processing_1.getFirstLine)(completion.insertText);
                (0, debug_utils_1.addAutocompleteDebugEvent)('singleline resolve', {
                    currentLinePrefix: docContext.currentLinePrefix,
                    text: firstLine,
                });
                const completedCompletion = (0, process_inline_completions_1.processCompletion)({
                    ...completion,
                    insertText: firstLine,
                }, providerOptions);
                yield* stopStreamingAndUsePartialResponse({
                    isFullResponse,
                    completedCompletion,
                    rawCompletion,
                });
            }
        }
    }
}
exports.fetchAndProcessDynamicMultilineCompletions = fetchAndProcessDynamicMultilineCompletions;
async function* fetchAndProcessCompletions(params) {
    const { completionResponseGenerator, abortController, providerOptions, providerSpecificPostProcess, } = params;
    const { hotStreak, docContext } = providerOptions;
    let hotStreakExtractor;
    for await (const { stopReason, completion } of completionResponseGenerator) {
        (0, debug_utils_1.addAutocompleteDebugEvent)('fetchAndProcessCompletions', {
            stopReason,
            completion,
        });
        const isFullResponse = stopReason !== cody_shared_1.CompletionStopReason.StreamingChunk;
        const rawCompletion = providerSpecificPostProcess(completion);
        if (hotStreakExtractor) {
            yield* hotStreakExtractor.extract(rawCompletion, isFullResponse);
            continue;
        }
        const extractCompletion = isFullResponse ? parse_and_truncate_completion_1.parseAndTruncateCompletion : can_use_partial_completion_1.canUsePartialCompletion;
        const parsedCompletion = extractCompletion(rawCompletion, {
            document: providerOptions.document,
            docContext,
            isDynamicMultilineCompletion: false,
        });
        if (parsedCompletion) {
            const completedCompletion = (0, process_inline_completions_1.processCompletion)(parsedCompletion, providerOptions);
            yield {
                docContext,
                completion: {
                    ...completedCompletion,
                    stopReason: isFullResponse ? stopReason : 'streaming-truncation',
                },
            };
            if (hotStreak) {
                hotStreakExtractor = (0, hot_streak_1.createHotStreakExtractor)({
                    completedCompletion,
                    ...params,
                });
                yield* hotStreakExtractor?.extract(rawCompletion, isFullResponse);
            }
            else {
                abortController.abort();
                break;
            }
        }
    }
}
exports.fetchAndProcessCompletions = fetchAndProcessCompletions;
