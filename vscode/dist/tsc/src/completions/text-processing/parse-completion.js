"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropParserFields = exports.parseCompletion = void 0;
const vscode_1 = require("vscode");
const debug_utils_1 = require("../../services/open-telemetry/debug-utils");
const parse_tree_cache_1 = require("../../tree-sitter/parse-tree-cache");
const process_inline_completions_1 = require("./process-inline-completions");
const utils_1 = require("./utils");
/**
 * Parses an inline code completion item using Tree-sitter and determines if the completion
 * would introduce any syntactic errors.
 */
function parseCompletion(context) {
    const { completion, document, docContext, docContext: { position, multilineTriggerPosition }, } = context;
    const parseTreeCache = (0, parse_tree_cache_1.getCachedParseTreeForDocument)(document);
    // Do nothing if the syntactic post-processing is not enabled.
    if (!parseTreeCache) {
        return completion;
    }
    const { parser, tree } = parseTreeCache;
    const completionEndPosition = position.translate((0, utils_1.lines)(completion.insertText).length, (0, utils_1.getLastLine)(completion.insertText).length);
    const treeWithCompletion = pasteCompletion({
        completion,
        document,
        docContext,
        tree,
        parser,
        completionEndPosition,
    });
    const points = {
        start: {
            row: position.line,
            column: position.character,
        },
        end: {
            row: completionEndPosition.line,
            column: completionEndPosition.character,
        },
    };
    if (multilineTriggerPosition) {
        points.trigger = (0, parse_tree_cache_1.asPoint)(multilineTriggerPosition);
    }
    // Search for ERROR nodes in the completion range.
    const query = parser.getLanguage().query('(ERROR) @error');
    // TODO(tree-sitter): query bigger range to catch higher scope syntactic errors caused by the completion.
    const captures = query.captures(treeWithCompletion.rootNode, points?.trigger || points.start, points.end);
    return {
        ...completion,
        points,
        tree: treeWithCompletion,
        parseErrorCount: captures.length,
    };
}
exports.parseCompletion = parseCompletion;
function pasteCompletion(params) {
    const { completion: { insertText }, document, tree, parser, docContext: { position, currentLineSuffix, 
    // biome-ignore lint/nursery/noInvalidUseBeforeDeclaration: it's actually correct
    positionWithoutInjectedCompletionText = position, injectedCompletionText = '', }, completionEndPosition, } = params;
    const matchingSuffixLength = (0, process_inline_completions_1.getMatchingSuffixLength)(insertText, currentLineSuffix);
    // Adjust suffix and prefix based on completion insert range.
    const prefix = document.getText(new vscode_1.Range(new vscode_1.Position(0, 0), positionWithoutInjectedCompletionText)) +
        injectedCompletionText;
    const suffix = document.getText(new vscode_1.Range(positionWithoutInjectedCompletionText, document.positionAt(document.getText().length)));
    const offset = document.offsetAt(positionWithoutInjectedCompletionText);
    // Remove the characters that are being replaced by the completion to avoid having
    // them in the parse tree. It breaks the multiline truncation logic which looks for
    // the increased number of children in the tree.
    const textWithCompletion = prefix + insertText + suffix.slice(matchingSuffixLength);
    (0, debug_utils_1.addAutocompleteDebugEvent)('paste-completion', {
        text: textWithCompletion,
    });
    const treeCopy = tree.copy();
    treeCopy.edit({
        startIndex: offset,
        oldEndIndex: offset,
        newEndIndex: offset + injectedCompletionText.length + insertText.length,
        startPosition: (0, parse_tree_cache_1.asPoint)(positionWithoutInjectedCompletionText),
        oldEndPosition: (0, parse_tree_cache_1.asPoint)(positionWithoutInjectedCompletionText),
        newEndPosition: (0, parse_tree_cache_1.asPoint)(completionEndPosition),
    });
    // TODO(tree-sitter): consider parsing only the changed part of the document to improve performance.
    // parser.parse(textWithCompletion, tree, { includedRanges: [...]})
    return parser.parse(textWithCompletion, treeCopy);
}
function dropParserFields(completion) {
    const { points, tree, ...rest } = completion;
    return rest;
}
exports.dropParserFields = dropParserFields;
