"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUsePartialCompletion = void 0;
const text_processing_1 = require("./text-processing");
const parse_and_truncate_completion_1 = require("./text-processing/parse-and-truncate-completion");
/**
 * Evaluates a partial completion response and returns it when we can already use it. This is used
 * to terminate any streaming responses where we can get a token-by-token access to the result and
 * want to terminate as soon as stop conditions are triggered.
 *
 * Right now this handles two cases:
 *  1. When a single line completion is requested, it terminates after the first full line was
 *     received.
 *  2. For a multi-line completion, it terminates when the completion will be truncated based on the
 *     multi-line indentation logic.
 */
function canUsePartialCompletion(partialResponse, params) {
    const { docContext } = params;
    if (!(0, text_processing_1.hasCompleteFirstLine)(partialResponse)) {
        return null;
    }
    const item = (0, parse_and_truncate_completion_1.parseAndTruncateCompletion)(partialResponse, params);
    if (docContext.multilineTrigger) {
        return (item.lineTruncatedCount || 0) > 0 ? item : null;
    }
    return item.insertText.trim() === '' ? null : item;
}
exports.canUsePartialCompletion = canUsePartialCompletion;
