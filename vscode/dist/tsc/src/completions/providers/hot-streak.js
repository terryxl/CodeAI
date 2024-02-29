"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHotStreakExtractor = exports.pressEnterAndGetIndentString = exports.STOP_REASON_HOT_STREAK = void 0;
const detect_indent_1 = __importDefault(require("detect-indent"));
const debug_utils_1 = require("../../services/open-telemetry/debug-utils");
const utils_1 = require("../../utils");
const can_use_partial_completion_1 = require("../can-use-partial-completion");
const detect_multiline_1 = require("../detect-multiline");
const get_current_doc_context_1 = require("../get-current-doc-context");
const text_processing_1 = require("../text-processing");
const parse_and_truncate_completion_1 = require("../text-processing/parse-and-truncate-completion");
const process_inline_completions_1 = require("../text-processing/process-inline-completions");
const dynamic_multiline_1 = require("./dynamic-multiline");
exports.STOP_REASON_HOT_STREAK = 'cody-hot-streak';
function pressEnterAndGetIndentString(insertText, currentLine, document) {
    const { languageId, uri } = document;
    const startsNewBlock = Boolean((0, detect_multiline_1.endsWithBlockStart)(insertText, languageId));
    const newBlockIndent = startsNewBlock ? (0, utils_1.getEditorIndentString)(uri) : '';
    const currentIndentReference = insertText.includes('\n') ? (0, text_processing_1.getLastLine)(insertText) : currentLine;
    return '\n' + (0, detect_indent_1.default)(currentIndentReference).indent + newBlockIndent;
}
exports.pressEnterAndGetIndentString = pressEnterAndGetIndentString;
/**
 * For a hot streak, we require the completion to be inserted followed by an enter key
 * Enter will usually insert a line break followed by the same indentation that the
 * current line has.
 */
function insertCompletionAndPressEnter(docContext, completion, document, dynamicMultilineCompletions) {
    const { insertText } = completion;
    const indentString = pressEnterAndGetIndentString(insertText, docContext.currentLinePrefix, document);
    const insertTextWithPressedEnter = insertText + indentString;
    (0, debug_utils_1.addAutocompleteDebugEvent)('insertCompletionAndPressEnter', {
        currentLinePrefix: docContext.currentLinePrefix,
        text: insertTextWithPressedEnter,
    });
    const updatedDocContext = (0, get_current_doc_context_1.insertIntoDocContext)({
        docContext,
        languageId: document.languageId,
        insertText: insertTextWithPressedEnter,
        dynamicMultilineCompletions,
    });
    return updatedDocContext;
}
function createHotStreakExtractor(params) {
    const { completedCompletion, providerOptions } = params;
    const { docContext, document, document: { languageId }, dynamicMultilineCompletions = false, } = providerOptions;
    let updatedDocContext = insertCompletionAndPressEnter(docContext, completedCompletion, document, dynamicMultilineCompletions);
    function* extract(rawCompletion, isRequestEnd) {
        while (true) {
            const unprocessedCompletion = rawCompletion.slice(updatedDocContext.injectedCompletionText?.length || 0);
            (0, debug_utils_1.addAutocompleteDebugEvent)('extract start', {
                text: unprocessedCompletion,
            });
            if (unprocessedCompletion.length === 0) {
                return undefined;
            }
            const extractCompletion = isRequestEnd ? parse_and_truncate_completion_1.parseAndTruncateCompletion : can_use_partial_completion_1.canUsePartialCompletion;
            const maybeDynamicMultilineDocContext = {
                ...updatedDocContext,
                ...(dynamicMultilineCompletions && !updatedDocContext.multilineTrigger
                    ? (0, dynamic_multiline_1.getDynamicMultilineDocContext)({
                        languageId,
                        docContext: updatedDocContext,
                        insertText: unprocessedCompletion,
                    })
                    : {}),
            };
            const completion = extractCompletion(unprocessedCompletion, {
                document,
                docContext: maybeDynamicMultilineDocContext,
                isDynamicMultilineCompletion: Boolean(dynamicMultilineCompletions),
            });
            (0, debug_utils_1.addAutocompleteDebugEvent)('attempted to extract completion', {
                previousNonEmptyLine: docContext.prevNonEmptyLine,
                currentLinePrefix: docContext.currentLinePrefix,
                multilineTrigger: maybeDynamicMultilineDocContext.multilineTrigger,
                text: completion?.insertText,
            });
            if (completion && completion.insertText.trim().length > 0) {
                // If the partial completion logic finds a match, extract this as the next hot
                // streak...
                // ... if not and we are processing the last payload, we use the whole remainder for the
                // completion (this means we will parse the last line even when a \n is missing at
                // the end) ...
                const processedCompletion = (0, process_inline_completions_1.processCompletion)(completion, {
                    document,
                    position: maybeDynamicMultilineDocContext.position,
                    docContext: maybeDynamicMultilineDocContext,
                });
                yield {
                    docContext: updatedDocContext,
                    completion: {
                        ...processedCompletion,
                        stopReason: exports.STOP_REASON_HOT_STREAK,
                    },
                };
                updatedDocContext = insertCompletionAndPressEnter(updatedDocContext, processedCompletion, document, dynamicMultilineCompletions);
            }
            else {
                (0, debug_utils_1.addAutocompleteDebugEvent)('hot-streak extractor stop');
                // ... otherwise we don't have enough in the remaining completion text to generate a full
                // hot-streak completion and yield to wait for the next chunk (or abort).
                return undefined;
            }
        }
    }
    return {
        extract,
    };
}
exports.createHotStreakExtractor = createHotStreakExtractor;
