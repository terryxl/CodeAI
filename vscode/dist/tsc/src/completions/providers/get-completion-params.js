"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletionParamsAndFetchImpl = exports.getLineNumberDependentCompletionParams = void 0;
const fetch_and_process_completions_1 = require("./fetch-and-process-completions");
const MAX_RESPONSE_TOKENS = 256;
function getLineNumberDependentCompletionParams(params) {
    const { singlelineStopSequences, multilineStopSequences } = params;
    return {
        singlelineParams: {
            timeoutMs: 5_000,
            // To speed up sample generation in single-line case, we request a lower token limit
            // since we can't terminate on the first `\n`.
            maxTokensToSample: 30,
            stopSequences: singlelineStopSequences,
        },
        multilineParams: {
            timeoutMs: 15_000,
            maxTokensToSample: MAX_RESPONSE_TOKENS,
            stopSequences: multilineStopSequences,
        },
        dynamicMultilineParams: {
            timeoutMs: 15_000,
            maxTokensToSample: MAX_RESPONSE_TOKENS,
            // Do not stop after two consecutive new lines to get the full syntax node content. For example:
            //
            // function quickSort(array) {
            //   if (array.length <= 1) {
            //     return array
            //   }
            //
            //   // the implementation continues here after two new lines.
            // }
            stopSequences: undefined,
        },
    };
}
exports.getLineNumberDependentCompletionParams = getLineNumberDependentCompletionParams;
function getCompletionParamsAndFetchImpl(params) {
    const { timeouts, providerOptions: { multiline: isMutiline, dynamicMultilineCompletions, hotStreak }, lineNumberDependentCompletionParams: { singlelineParams, multilineParams, dynamicMultilineParams, }, } = params;
    const useExtendedGeneration = isMutiline || dynamicMultilineCompletions || hotStreak;
    const partialRequestParams = {
        ...(useExtendedGeneration ? multilineParams : singlelineParams),
        temperature: 0.2,
        topK: 0,
    };
    // Apply custom multiline timeouts if they are defined.
    if (timeouts?.multiline && useExtendedGeneration) {
        partialRequestParams.timeoutMs = timeouts.multiline;
    }
    // Apply custom singleline timeouts if they are defined.
    if (timeouts?.singleline && !useExtendedGeneration) {
        partialRequestParams.timeoutMs = timeouts.singleline;
    }
    let fetchAndProcessCompletionsImpl = fetch_and_process_completions_1.fetchAndProcessCompletions;
    if (dynamicMultilineCompletions) {
        // If the feature flag is enabled use params adjusted for the experiment.
        Object.assign(partialRequestParams, dynamicMultilineParams);
        // Use an alternative fetch completions implementation.
        fetchAndProcessCompletionsImpl = fetch_and_process_completions_1.fetchAndProcessDynamicMultilineCompletions;
    }
    return {
        partialRequestParams,
        fetchAndProcessCompletionsImpl,
    };
}
exports.getCompletionParamsAndFetchImpl = getCompletionParamsAndFetchImpl;
