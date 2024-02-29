"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMultiline = exports.endsWithBlockStart = void 0;
const vscode_1 = require("vscode");
const debug_utils_1 = require("../services/open-telemetry/debug-utils");
const language_1 = require("../tree-sitter/language");
const text_processing_1 = require("./text-processing");
function endsWithBlockStart(text, languageId) {
    const blockStart = (0, language_1.getLanguageConfig)(languageId)?.blockStart;
    return blockStart && text.trimEnd().endsWith(blockStart) ? blockStart : null;
}
exports.endsWithBlockStart = endsWithBlockStart;
// Languages with more than 100 multiline completions in the last month and CAR > 20%:
// https://sourcegraph.looker.com/explore/sourcegraph/cody?qid=JBItVt6VFMlCtMa9KOBmjh&origin_space=562
const LANGUAGES_WITH_MULTILINE_SUPPORT = [
    'astro',
    'c',
    'cpp',
    'csharp',
    'css',
    'dart',
    'elixir',
    'go',
    'html',
    'java',
    'javascript',
    'javascriptreact',
    'php',
    'python',
    'rust',
    'svelte',
    'typescript',
    'typescriptreact',
    'vue',
];
function detectMultiline(params) {
    const { docContext, languageId, dynamicMultilineCompletions, position } = params;
    const { prefix, prevNonEmptyLine, nextNonEmptyLine, currentLinePrefix, currentLineSuffix } = docContext;
    const isMultilineSupported = LANGUAGES_WITH_MULTILINE_SUPPORT.includes(languageId);
    const blockStart = endsWithBlockStart(prefix, languageId);
    const isBlockStartActive = Boolean(blockStart);
    const currentLineText = currentLineSuffix.trim().length > 0 ? currentLinePrefix + currentLineSuffix : currentLinePrefix;
    const isMethodOrFunctionInvocation = !currentLinePrefix.trim().match(text_processing_1.FUNCTION_KEYWORDS) &&
        currentLineText.match(text_processing_1.FUNCTION_OR_METHOD_INVOCATION_REGEX);
    // Don't fire multiline completion for method or function invocations
    // see https://github.com/sourcegraph/cody/discussions/358#discussioncomment-6519606
    // Don't fire multiline completion for unsupported languages.
    if ((!dynamicMultilineCompletions && isMethodOrFunctionInvocation) || !isMultilineSupported) {
        (0, debug_utils_1.addAutocompleteDebugEvent)('detectMultiline', {
            languageId,
            dynamicMultilineCompletions,
            isMethodOrFunctionInvocation,
        });
        return {
            multilineTrigger: null,
            multilineTriggerPosition: null,
        };
    }
    const openingBracketMatch = (0, text_processing_1.getLastLine)(prefix.trimEnd()).match(text_processing_1.OPENING_BRACKET_REGEX);
    const isSameLineOpeningBracketMatch = currentLinePrefix.trim() !== '' &&
        openingBracketMatch &&
        // Only trigger multiline suggestions when the next non-empty line is indented less
        // than the block start line (the newly created block is empty).
        (0, text_processing_1.indentation)(currentLinePrefix) >= (0, text_processing_1.indentation)(nextNonEmptyLine);
    const isNewLineOpeningBracketMatch = currentLinePrefix.trim() === '' &&
        currentLineSuffix.trim() === '' &&
        openingBracketMatch &&
        // Only trigger multiline suggestions when the next non-empty line is indented the same or less
        (0, text_processing_1.indentation)(prevNonEmptyLine) < (0, text_processing_1.indentation)(currentLinePrefix) &&
        // Only trigger multiline suggestions when the next non-empty line is indented less
        // than the block start line (the newly created block is empty).
        (0, text_processing_1.indentation)(prevNonEmptyLine) >= (0, text_processing_1.indentation)(nextNonEmptyLine);
    if ((dynamicMultilineCompletions && isNewLineOpeningBracketMatch) || isSameLineOpeningBracketMatch) {
        (0, debug_utils_1.addAutocompleteDebugEvent)('detectMultiline', {
            dynamicMultilineCompletions,
            isNewLineOpeningBracketMatch,
            isSameLineOpeningBracketMatch,
        });
        return {
            multilineTrigger: openingBracketMatch[0],
            multilineTriggerPosition: getPrefixLastNonEmptyCharPosition(prefix, position),
        };
    }
    const nonEmptyLineEndsWithBlockStart = currentLinePrefix.length > 0 &&
        isBlockStartActive &&
        (0, text_processing_1.indentation)(currentLinePrefix) >= (0, text_processing_1.indentation)(nextNonEmptyLine);
    const isEmptyLineAfterBlockStart = currentLinePrefix.trim() === '' &&
        currentLineSuffix.trim() === '' &&
        // Only trigger multiline suggestions for the beginning of blocks
        isBlockStartActive &&
        // Only trigger multiline suggestions when the next non-empty line is indented the same or less
        (0, text_processing_1.indentation)(prevNonEmptyLine) < (0, text_processing_1.indentation)(currentLinePrefix) &&
        // Only trigger multiline suggestions when the next non-empty line is indented less
        // than the block start line (the newly created block is empty).
        (0, text_processing_1.indentation)(prevNonEmptyLine) >= (0, text_processing_1.indentation)(nextNonEmptyLine);
    if ((dynamicMultilineCompletions && nonEmptyLineEndsWithBlockStart) || isEmptyLineAfterBlockStart) {
        (0, debug_utils_1.addAutocompleteDebugEvent)('detectMultiline', {
            dynamicMultilineCompletions,
            nonEmptyLineEndsWithBlockStart,
            isEmptyLineAfterBlockStart,
        });
        return {
            multilineTrigger: blockStart,
            multilineTriggerPosition: getPrefixLastNonEmptyCharPosition(prefix, position),
        };
    }
    (0, debug_utils_1.addAutocompleteDebugEvent)('detectMultiline', {
        dynamicMultilineCompletions,
        nonEmptyLineEndsWithBlockStart,
        isEmptyLineAfterBlockStart,
        isNewLineOpeningBracketMatch,
        isSameLineOpeningBracketMatch,
    });
    return {
        multilineTrigger: null,
        multilineTriggerPosition: null,
    };
}
exports.detectMultiline = detectMultiline;
/**
 * Precalculate the multiline trigger position based on `prefix` and `cursorPosition` to be
 * able to change it during streaming to the end of the first line of the completion.
 */
function getPrefixLastNonEmptyCharPosition(prefix, cursorPosition) {
    const trimmedPrefix = prefix.trimEnd();
    const diffLength = prefix.length - trimmedPrefix.length;
    if (diffLength === 0) {
        return cursorPosition.translate(0, -1);
    }
    const prefixDiff = prefix.slice(-diffLength);
    return new vscode_1.Position(cursorPosition.line - ((0, text_processing_1.lines)(prefixDiff).length - 1), (0, text_processing_1.getLastLine)(trimmedPrefix).length - 1);
}
