"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLastAncestorOnTheSameRow = exports.truncateParsedCompletion = exports.insertMissingBrackets = void 0;
const debug_utils_1 = require("../../services/open-telemetry/debug-utils");
const parse_tree_cache_1 = require("../../tree-sitter/parse-tree-cache");
const parse_completion_1 = require("./parse-completion");
const utils_1 = require("./utils");
/**
 * Inserts missing closing brackets in the completion text.
 * This handles cases where a missing bracket breaks the incomplete parse-tree.
 */
function insertMissingBrackets(text) {
    const openingStack = [];
    const bracketPairs = Object.entries(utils_1.BRACKET_PAIR);
    for (const char of text) {
        const bracketPair = bracketPairs.find(([_, closingBracket]) => closingBracket === char);
        if (bracketPair) {
            if (openingStack.length > 0 && openingStack.at(-1) === bracketPair[0]) {
                openingStack.pop();
            }
        }
        else if (Object.keys(utils_1.BRACKET_PAIR).includes(char)) {
            openingStack.push(char);
        }
    }
    return (text +
        openingStack
            .reverse()
            .map(openBracket => utils_1.BRACKET_PAIR[openBracket])
            .join(''));
}
exports.insertMissingBrackets = insertMissingBrackets;
/**
 * Truncates the insert text of a parsed completion based on context.
 * Uses tree-sitter to walk the parse-tree with the inserted completion and truncate it.
 */
function truncateParsedCompletion(context) {
    const { completion, document, docContext } = context;
    const parseTreeCache = (0, parse_tree_cache_1.getCachedParseTreeForDocument)(document);
    if (!completion.tree || !completion.points || !parseTreeCache) {
        throw new Error('Expected completion and document to have tree-sitter data for truncation');
    }
    const { insertText, points } = completion;
    (0, debug_utils_1.addAutocompleteDebugEvent)('truncate', {
        currentLinePrefix: docContext.currentLinePrefix,
        text: insertText,
    });
    let fixedCompletion = completion;
    const insertTextWithMissingBrackets = insertMissingBrackets(docContext.currentLinePrefix + insertText).slice(docContext.currentLinePrefix.length);
    if (insertTextWithMissingBrackets.length !== insertText.length) {
        const updatedCompletion = (0, parse_completion_1.parseCompletion)({
            completion: { insertText: insertTextWithMissingBrackets },
            document,
            docContext,
        });
        if (fixedCompletion?.tree) {
            fixedCompletion = updatedCompletion;
        }
    }
    const nodeToInsert = findLastAncestorOnTheSameRow(fixedCompletion.tree.rootNode, points.trigger || points.start);
    let textToInsert = nodeToInsert?.id === fixedCompletion.tree.rootNode.id ? 'root' : nodeToInsert?.text;
    if (textToInsert && document.getText().endsWith(textToInsert.slice(-100))) {
        textToInsert = 'till the end of the document';
    }
    (0, debug_utils_1.addAutocompleteDebugEvent)('truncate node', {
        nodeToInsertType: nodeToInsert?.type,
        text: textToInsert,
    });
    if (nodeToInsert) {
        const overlap = findLargestSuffixPrefixOverlap(nodeToInsert.text, insertText);
        (0, debug_utils_1.addAutocompleteDebugEvent)('truncate overlap', {
            currentLinePrefix: docContext.currentLinePrefix,
            text: overlap ?? undefined,
        });
        if (overlap) {
            return {
                insertText: overlap,
                nodeToInsert,
            };
        }
    }
    return { insertText, nodeToInsert: nodeToInsert || undefined };
}
exports.truncateParsedCompletion = truncateParsedCompletion;
function findLastAncestorOnTheSameRow(root, position) {
    const initial = root.namedDescendantForPosition(position);
    let current = initial;
    while (current?.parent?.startPosition.row === initial?.startPosition.row &&
        current.parent.id !== root.id) {
        current = current.parent;
    }
    return current;
}
exports.findLastAncestorOnTheSameRow = findLastAncestorOnTheSameRow;
/**
 * Finds the maximum suffix-prefix overlap between two strings.
 */
function findLargestSuffixPrefixOverlap(left, right) {
    let overlap = '';
    for (let i = 1; i <= Math.min(left.length, right.length); i++) {
        const suffix = left.slice(left.length - i);
        const prefix = right.slice(0, i);
        if (suffix === prefix) {
            overlap = suffix;
        }
    }
    if (overlap.length === 0) {
        return null;
    }
    return overlap;
}
