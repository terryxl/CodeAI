"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execQueryWrapper = exports.getDocumentQuerySDK = exports.initQueries = void 0;
const lodash_1 = require("lodash");
const grammars_1 = require("./grammars");
const parse_tree_cache_1 = require("./parse-tree-cache");
const parser_1 = require("./parser");
const queries_1 = require("./queries");
const QUERIES_LOCAL_CACHE = {};
/**
 * Reads all language queries from disk and parses them.
 * Saves queries the local cache for further use.
 */
function initQueries(language, languageId, parser) {
    const cachedQueries = QUERIES_LOCAL_CACHE[languageId];
    if (cachedQueries) {
        return;
    }
    const languageQueries = queries_1.languages[languageId];
    if (languageQueries === undefined) {
        return;
    }
    const queryEntries = Object.entries(languageQueries).map(([name, raw]) => {
        return [
            name,
            {
                raw,
                compiled: language.query(raw),
            },
        ];
    });
    const queries = Object.fromEntries(queryEntries);
    QUERIES_LOCAL_CACHE[languageId] = {
        ...queries,
        ...getLanguageSpecificQueryWrappers(queries, parser),
    };
}
exports.initQueries = initQueries;
/**
 * Returns the query SDK only if the language has queries defined and
 * the relevant laguage parser is initialized.
 */
function getDocumentQuerySDK(language) {
    const supportedLanguage = (0, grammars_1.getParseLanguage)(language);
    if (!supportedLanguage) {
        return null;
    }
    const parser = (0, parser_1.getParser)(supportedLanguage);
    const queries = QUERIES_LOCAL_CACHE[supportedLanguage];
    if (!parser || !queries) {
        return null;
    }
    return {
        parser,
        queries,
        language: supportedLanguage,
    };
}
exports.getDocumentQuerySDK = getDocumentQuerySDK;
/**
 * Query wrappers with custom post-processing logic.
 */
function getLanguageSpecificQueryWrappers(queries, _parser) {
    return {
        getSinglelineTrigger: (root, start, end) => {
            const captures = queries.singlelineTriggers.compiled.captures(root, start, end);
            const { trigger, block } = getTriggerNodeWithBlockStaringAtPoint(captures, start);
            if (!trigger || !block || !isBlockNodeEmpty(block)) {
                return [];
            }
            return [{ node: trigger, name: 'trigger' }];
        },
        getCompletionIntent: (root, start, end) => {
            const captures = queries.intents.compiled.captures(root, start, end);
            const { intentCapture } = getIntentFromCaptures(captures, start);
            if (!intentCapture) {
                return [];
            }
            return [{ node: intentCapture.node, name: intentCapture.name }];
        },
        getDocumentableNode: (root, start, end) => {
            const captures = queries.documentableNodes.compiled.captures(root, start, end);
            const cursorCapture = (0, lodash_1.findLast)(captures, ({ node }) => {
                return (node.startPosition.row === start.row &&
                    (node.startPosition.column <= start.column || node.startPosition.row < start.row) &&
                    (start.column <= node.endPosition.column || start.row < node.endPosition.row));
            });
            if (!cursorCapture) {
                return [];
            }
            return [
                {
                    node: cursorCapture.node,
                    name: cursorCapture.name === 'export' ? 'documentableExport' : 'documentableNode',
                },
            ];
        },
    };
}
// TODO: check if the block parent is empty in the consumer.
// Tracking: https://github.com/sourcegraph/cody/issues/1452
function getIntentFromCaptures(captures, cursor) {
    const emptyResult = {
        cursorCapture: undefined,
        intentCapture: undefined,
    };
    if (!captures.length) {
        return emptyResult;
    }
    // Find the cursor capture group if exists.
    const [cursorCapture] = sortByIntentPriority(captures.filter(capture => {
        const { name, node } = capture;
        const matchesCursorPosition = node.startPosition.column === cursor.column && node.startPosition.row === cursor.row;
        return name.endsWith('.cursor') && matchesCursorPosition;
    }));
    // Find the corresponding preceding intent capture that matches the cursor capture name.
    const intentCapture = (0, lodash_1.findLast)(captures, capture => {
        return capture.name === withoutCursorSuffix(cursorCapture?.name);
    });
    if (cursorCapture && intentCapture) {
        return { cursorCapture, intentCapture };
    }
    // If we didn't find a multinode intent, use the most nested atomic capture group.
    // Atomic capture groups are matches with one node and `!` at the end the capture group name.
    const atomicCapture = (0, lodash_1.findLast)(captures, capture => {
        const enclosesCursor = (capture.node.startPosition.column <= cursor.column ||
            capture.node.startPosition.row < cursor.row) &&
            (cursor.column <= capture.node.endPosition.column ||
                cursor.row < capture.node.endPosition.row);
        return capture.name.endsWith('!') && enclosesCursor;
    });
    if (atomicCapture) {
        return {
            intentCapture: {
                ...atomicCapture,
                // Remove `!` from the end of the capture name.
                name: atomicCapture.name.slice(0, -1),
            },
        };
    }
    return emptyResult;
}
function sortByIntentPriority(captures) {
    return captures.sort((a, b) => {
        return (queries_1.intentPriority.indexOf(withoutCursorSuffix(a.name)) -
            queries_1.intentPriority.indexOf(withoutCursorSuffix(b.name)));
    });
}
function withoutCursorSuffix(name) {
    return name?.split('.').slice(0, -1).join('.');
}
function getTriggerNodeWithBlockStaringAtPoint(captures, point) {
    const emptyResult = {
        trigger: undefined,
        block: undefined,
    };
    if (!captures.length) {
        return emptyResult;
    }
    const blockStart = getNodeIfMatchesPoint({
        captures,
        name: 'block_start',
        // Taking the last result to get the most nested node.
        // See https://github.com/tree-sitter/tree-sitter/discussions/2067
        index: -1,
        point,
    });
    const trigger = getCapturedNodeAt({
        captures,
        name: 'trigger',
        index: -1,
    });
    const block = blockStart?.parent;
    if (!blockStart || !block || !trigger) {
        return emptyResult;
    }
    // Verify that the block node ends at the same position as the trigger node.
    if (trigger.endIndex !== block?.endIndex) {
        return emptyResult;
    }
    return { trigger, block };
}
function getNodeIfMatchesPoint(params) {
    const { captures, name, index, point } = params;
    const node = getCapturedNodeAt({ captures, name, index });
    if (node && node.startPosition.column === point.column && node.startPosition.row === point.row) {
        return node;
    }
    return null;
}
function getCapturedNodeAt(params) {
    const { captures, name, index } = params;
    return captures.filter(capture => capture.name === name).at(index)?.node || null;
}
/**
 * Consider a block empty if it does not have any named children or is missing its closing tag.
 */
function isBlockNodeEmpty(node) {
    // Consider a node empty if it does not have any named children.
    const isBlockEmpty = node?.children.filter(c => c.isNamed()).length === 0;
    const isMissingBlockEnd = Boolean(node?.lastChild?.isMissing());
    return isBlockEmpty || isMissingBlockEnd;
}
function positionToQueryPoints(position) {
    const startPoint = {
        row: position.line,
        column: position.character,
    };
    const endPoint = {
        row: position.line,
        // Querying around one character after trigger position.
        column: position.character + 1,
    };
    return { startPoint, endPoint };
}
function execQueryWrapper(document, position, queryWrapper) {
    const parseTreeCache = (0, parse_tree_cache_1.getCachedParseTreeForDocument)(document);
    const documentQuerySDK = getDocumentQuerySDK(document.languageId);
    const { startPoint, endPoint } = positionToQueryPoints(position);
    if (documentQuerySDK && parseTreeCache) {
        return documentQuerySDK.queries[queryWrapper](parseTreeCache.tree.rootNode, startPoint, endPoint);
    }
    return [];
}
exports.execQueryWrapper = execQueryWrapper;
