"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchingSuffixLength = exports.getRangeAdjustedForOverlappingCharacters = exports.processCompletion = exports.processInlineCompletions = void 0;
const vscode_1 = require("vscode");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const debug_utils_1 = require("../../services/open-telemetry/debug-utils");
const ast_getters_1 = require("../../tree-sitter/ast-getters");
const parse_tree_cache_1 = require("../../tree-sitter/parse-tree-cache");
const parse_completion_1 = require("./parse-completion");
const truncate_parsed_completion_1 = require("./truncate-parsed-completion");
const utils_1 = require("./utils");
/**
 * This function implements post-processing logic that is applied regardless of
 * which provider is chosen.
 */
function processInlineCompletions(items, params) {
    (0, debug_utils_1.addAutocompleteDebugEvent)('enter', {
        currentLinePrefix: params.docContext.currentLinePrefix,
        text: items[0]?.insertText,
    });
    // Remove low quality results
    const visibleResults = removeLowQualityCompletions(items);
    // Remove duplicate results
    const uniqueResults = (0, cody_shared_1.dedupeWith)(visibleResults, 'insertText');
    // Rank results
    const rankedResults = rankCompletions(uniqueResults);
    (0, debug_utils_1.addAutocompleteDebugEvent)('exit', {
        currentLinePrefix: params.docContext.currentLinePrefix,
        text: rankedResults[0]?.insertText,
    });
    return rankedResults.map(parse_completion_1.dropParserFields);
}
exports.processInlineCompletions = processInlineCompletions;
function processCompletion(completion, params) {
    const { document, position, docContext } = params;
    const { prefix, suffix, currentLineSuffix, multilineTrigger, multilineTriggerPosition } = docContext;
    let { insertText } = completion;
    if (completion.insertText.length === 0) {
        return completion;
    }
    if (docContext.injectedPrefix) {
        insertText = docContext.injectedPrefix + completion.insertText;
    }
    if (insertText.length === 0) {
        return completion;
    }
    completion.range = getRangeAdjustedForOverlappingCharacters(completion, {
        position,
        currentLineSuffix,
    });
    // Use the parse tree WITHOUT the pasted completion to get surrounding node types.
    // Helpful to optimize the completion AST triggers for higher CAR.
    completion.nodeTypes = getNodeTypesInfo({
        position,
        parseTree: (0, parse_tree_cache_1.getCachedParseTreeForDocument)(document)?.tree,
        multilineTriggerPosition,
    });
    // Use the parse tree WITH the pasted completion to get surrounding node types.
    // Helpful to understand CAR for incomplete code snippets.
    // E.g., `const value = ` does not produce a valid AST, but `const value = 'someValue'` does
    completion.nodeTypesWithCompletion = getNodeTypesInfo({
        position,
        parseTree: completion.tree,
        multilineTriggerPosition,
    });
    if (multilineTrigger) {
        insertText = (0, utils_1.removeTrailingWhitespace)(insertText);
    }
    else {
        // TODO: move to parse-and-truncate to have one place where truncation happens
        // Only keep a single line in single-line completions mode
        const newLineIndex = insertText.indexOf('\n');
        if (newLineIndex !== -1) {
            insertText = insertText.slice(0, newLineIndex + 1);
        }
    }
    insertText = (0, utils_1.trimUntilSuffix)(insertText, prefix, suffix, document.languageId);
    insertText = (0, utils_1.collapseDuplicativeWhitespace)(prefix, insertText);
    // Trim start and end of the completion to remove all trailing whitespace.
    insertText = insertText.trimEnd();
    return { ...completion, insertText };
}
exports.processCompletion = processCompletion;
function getNodeTypesInfo(params) {
    const { position, parseTree, multilineTriggerPosition } = params;
    const positionBeforeCursor = (0, parse_tree_cache_1.asPoint)({
        line: position.line,
        character: Math.max(0, position.character - 1),
    });
    if (parseTree) {
        const captures = (0, ast_getters_1.getNodeAtCursorAndParents)(parseTree.rootNode, positionBeforeCursor);
        if (captures.length > 0) {
            const [atCursor, ...parents] = captures;
            const lastAncestorOnTheSameLine = (0, truncate_parsed_completion_1.findLastAncestorOnTheSameRow)(parseTree.rootNode, (0, parse_tree_cache_1.asPoint)(multilineTriggerPosition || position));
            return {
                atCursor: atCursor.node.type,
                parent: parents[0]?.node.type,
                grandparent: parents[1]?.node.type,
                greatGrandparent: parents[2]?.node.type,
                lastAncestorOnTheSameLine: lastAncestorOnTheSameLine?.type,
            };
        }
    }
    return undefined;
}
/**
 * Return a copy of item with an adjusted range to overwrite duplicative characters after the
 * completion on the first line.
 *
 * For example, with position `function sort(█)` and completion `array) {`, the range should be
 * adjusted to span the `)` so it is overwritten by the `insertText` (so that we don't end up with
 * the invalid `function sort(array) {)`).
 */
function getRangeAdjustedForOverlappingCharacters(item, { position, currentLineSuffix }) {
    const matchingSuffixLength = getMatchingSuffixLength(item.insertText, currentLineSuffix);
    if (!item.range && currentLineSuffix !== '' && matchingSuffixLength !== 0) {
        return new vscode_1.Range(position, position.translate(undefined, matchingSuffixLength));
    }
    return undefined;
}
exports.getRangeAdjustedForOverlappingCharacters = getRangeAdjustedForOverlappingCharacters;
function getMatchingSuffixLength(insertText, currentLineSuffix) {
    let j = 0;
    for (let i = 0; i < insertText.length; i++) {
        if (insertText[i] === currentLineSuffix[j]) {
            j++;
        }
    }
    return j;
}
exports.getMatchingSuffixLength = getMatchingSuffixLength;
function rankCompletions(completions) {
    return completions.sort((a, b) => {
        // Prioritize completions without parse errors
        if (a.parseErrorCount && !b.parseErrorCount) {
            return 1; // b comes first
        }
        if (!a.parseErrorCount && b.parseErrorCount) {
            return -1; // a comes first
        }
        // If both have or don't have parse errors, compare by insertText length
        return b.insertText.split('\n').length - a.insertText.split('\n').length;
    });
}
const PROMPT_CONTINUATIONS = [
    // Anthropic style prompt continuation
    /^(\n){0,2}Human:\ /,
    // StarCoder style code example
    /^(\/\/|\#) Path:\ /,
];
function removeLowQualityCompletions(completions) {
    return completions.filter(c => {
        const isEmptyOrSingleCharacterCompletion = c.insertText.trim().length <= 1;
        const isPromptContinuation = PROMPT_CONTINUATIONS.some(regex => c.insertText.match(regex));
        return !isEmptyOrSingleCharacterCompletion && !isPromptContinuation;
    });
}
