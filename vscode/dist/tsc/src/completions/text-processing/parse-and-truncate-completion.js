"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndTruncateCompletion = void 0;
const debug_utils_1 = require("../../services/open-telemetry/debug-utils");
const parse_completion_1 = require("./parse-completion");
const truncate_multiline_completion_1 = require("./truncate-multiline-completion");
const truncate_parsed_completion_1 = require("./truncate-parsed-completion");
const utils_1 = require("./utils");
function parseAndTruncateCompletion(completion, params) {
    const { document, docContext, docContext: { multilineTrigger, prefix }, isDynamicMultilineCompletion, } = params;
    const multiline = Boolean(multilineTrigger);
    const insertTextBeforeTruncation = (multiline ? (0, truncate_multiline_completion_1.normalizeStartLine)(completion, prefix) : completion).trimEnd();
    const parsed = (0, parse_completion_1.parseCompletion)({
        completion: { insertText: insertTextBeforeTruncation },
        document,
        docContext,
    });
    (0, debug_utils_1.addAutocompleteDebugEvent)('parsed', {
        currentLinePrefix: docContext.currentLinePrefix,
        text: parsed.insertText,
    });
    if (parsed.insertText === '') {
        return parsed;
    }
    if (multiline) {
        const truncationResult = truncateMultilineBlock({
            parsed,
            document,
            docContext,
        });
        // Stop streaming _some_ unhelpful dynamic multiline completions by truncating the insert text early.
        if (isDynamicMultilineCompletion &&
            isDynamicMultilineCompletionToStopStreaming(truncationResult.nodeToInsert)) {
            truncationResult.insertText = (0, utils_1.getFirstLine)(truncationResult.insertText);
        }
        const initialLineCount = insertTextBeforeTruncation.split('\n').length;
        const truncatedLineCount = truncationResult.insertText.split('\n').length;
        parsed.lineTruncatedCount = initialLineCount - truncatedLineCount;
        (0, debug_utils_1.addAutocompleteDebugEvent)('lineTruncatedCount', {
            lineTruncatedCount: parsed.lineTruncatedCount,
        });
        parsed.insertText = truncationResult.insertText;
        parsed.truncatedWith = truncationResult.truncatedWith;
    }
    return parsed;
}
exports.parseAndTruncateCompletion = parseAndTruncateCompletion;
function truncateMultilineBlock(params) {
    const { parsed, docContext, document } = params;
    if (parsed.tree) {
        return {
            truncatedWith: 'tree-sitter',
            ...(0, truncate_parsed_completion_1.truncateParsedCompletion)({
                completion: parsed,
                docContext,
                document,
            }),
        };
    }
    const { prefix, suffix } = docContext;
    return {
        truncatedWith: 'indentation',
        insertText: (0, truncate_multiline_completion_1.truncateMultilineCompletion)(parsed.insertText, prefix, suffix, document.languageId),
    };
}
const NODE_TYPES_TO_STOP_STREAMING_AT_ROOT_NODE = new Set(['class_declaration']);
/**
 * Stop streaming dynamic multiline completions which leads to genereting a lot of lines
 * and are unhelpful most of the time. Currently applicable to a number of node types
 * at the root of the document.
 */
function isDynamicMultilineCompletionToStopStreaming(node) {
    return Boolean(node && isRootNode(node.parent) && NODE_TYPES_TO_STOP_STREAMING_AT_ROOT_NODE.has(node.type));
}
function isRootNode(node) {
    return node?.parent === null;
}
