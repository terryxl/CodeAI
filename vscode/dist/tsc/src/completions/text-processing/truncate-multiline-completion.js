"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateMultilineCompletion = exports.normalizeStartLine = void 0;
const detect_indent_1 = __importDefault(require("detect-indent"));
const language_1 = require("../../tree-sitter/language");
const utils_1 = require("./utils");
function normalizeStartLine(completion, prefix) {
    const lines = completion.split('\n');
    // We use a whitespace counting approach to finding the end of the
    // completion. To find an end, we look for the first line that is below the
    // start scope of the completion ( calculated by the number of leading
    // spaces or tabs)
    const prefixLastNewline = prefix.lastIndexOf('\n');
    const prefixIndentationWithFirstCompletionLine = prefix.slice(prefixLastNewline + 1);
    const startIndent = (0, utils_1.indentation)(prefixIndentationWithFirstCompletionLine);
    // Normalize responses that start with a newline followed by the exact
    // indentation of the first line.
    if (lines.length > 1 && lines[0] === '' && (0, utils_1.indentation)(lines[1]) === startIndent) {
        lines.shift();
        lines[0] = lines[0].trimStart();
    }
    return lines.join('\n');
}
exports.normalizeStartLine = normalizeStartLine;
function truncateMultilineCompletion(completion, prefix, suffix, languageId) {
    const config = (0, language_1.getLanguageConfig)(languageId);
    if (!config) {
        return completion;
    }
    // Ensure that the completion has the same or larger indentation
    // because we rely on the indentation size to cut off the completion.
    // TODO: add unit tests for this case. We need to update the indentation logic
    // used in unit tests for code samples.
    const indentedCompletion = ensureSameOrLargerIndentation(completion);
    const lines = indentedCompletion.split('\n');
    // We use a whitespace counting approach to finding the end of the
    // completion. To find an end, we look for the first line that is below the
    // start scope of the completion ( calculated by the number of leading
    // spaces or tabs)
    const prefixLastNewline = prefix.lastIndexOf('\n');
    const prefixIndentationWithFirstCompletionLine = prefix.slice(prefixLastNewline + 1);
    const startIndent = (0, utils_1.indentation)(prefixIndentationWithFirstCompletionLine);
    const hasEmptyCompletionLine = prefixIndentationWithFirstCompletionLine.trim() === '';
    const includeClosingLine = (0, utils_1.shouldIncludeClosingLine)(prefixIndentationWithFirstCompletionLine, suffix);
    let cutOffIndex = lines.length;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 || line === '' || config.blockElseTest.test(line)) {
            continue;
        }
        if (((0, utils_1.indentation)(line) <= startIndent && !hasEmptyCompletionLine) ||
            ((0, utils_1.indentation)(line) < startIndent && hasEmptyCompletionLine)) {
            // When we find the first block below the start indentation, only
            // include it if it is an end block
            if (includeClosingLine && config.blockEnd && line.trim().startsWith(config.blockEnd)) {
                cutOffIndex = i + 1;
            }
            else {
                cutOffIndex = i;
            }
            break;
        }
    }
    return lines.slice(0, cutOffIndex).join('\n');
}
exports.truncateMultilineCompletion = truncateMultilineCompletion;
/**
 * Adjusts the indentation of a multiline completion to match the current editor indentation.
 */
function adjustIndentation(text, originalIndent, newIndent) {
    const lines = text.split('\n');
    return lines
        .map(line => {
        let spaceCount = 0;
        for (const char of line) {
            if (char === ' ') {
                spaceCount++;
            }
            else {
                break;
            }
        }
        const indentLevel = spaceCount / originalIndent;
        if (Number.isInteger(indentLevel)) {
            const newIndentStr = ' '.repeat(indentLevel * newIndent);
            return line.replace(/^ +/, newIndentStr);
        }
        // The line has a non-standard number of spaces at the start, leave it unchanged
        return line;
    })
        .join('\n');
}
function ensureSameOrLargerIndentation(completion) {
    const indentAmount = (0, detect_indent_1.default)(completion).amount;
    const editorTabSize = (0, utils_1.getEditorTabSize)();
    if (editorTabSize > indentAmount) {
        return adjustIndentation(completion, indentAmount, editorTabSize);
    }
    return completion;
}
