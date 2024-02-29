"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestParamsFromLastCandidate = exports.reuseLastCandidate = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const doc_context_getters_1 = require("./doc-context-getters");
const get_inline_completions_1 = require("./get-inline-completions");
/**
 * See test cases for the expected behaviors.
 */
function reuseLastCandidate({ document, position, selectedCompletionInfo, lastCandidate: { lastTriggerPosition, lastTriggerDocContext, lastTriggerSelectedCompletionInfo }, lastCandidate, docContext: { currentLinePrefix, currentLineSuffix, nextNonEmptyLine }, docContext, handleDidAcceptCompletionItem, handleDidPartiallyAcceptCompletionItem, }) {
    const isSameDocument = lastCandidate.uri.toString() === document.uri.toString();
    const isSameLine = lastTriggerPosition.line === position.line;
    const isSameNextNonEmptyLine = lastTriggerDocContext.nextNonEmptyLine === nextNonEmptyLine;
    const lastTriggerCurrentLinePrefixWithoutInject = (0, doc_context_getters_1.getCurrentLinePrefixWithoutInjectedPrefix)(lastTriggerDocContext);
    const currentLinePrefixWithoutInject = (0, doc_context_getters_1.getCurrentLinePrefixWithoutInjectedPrefix)(docContext);
    // When the current request has an selectedCompletionInfo set, we have to compare that a last
    // candidate is only reused if it is has same completion info selected.
    //
    // This will handle cases where the user fully accepts a completion info. In that case, the
    // lastTriggerSelectedCompletionInfo.text will be set but the selectedCompletionInfo will be
    // empty, allowing the last candidate to be reused.
    const isSameSelectedInfoItemOrFullyAccepted = 
    // The `selectedCompletionInfo` might change if user types forward as suggested, so we can reuse the
    // last candidate in that case.
    selectedCompletionInfo &&
        lastTriggerCurrentLinePrefixWithoutInject === currentLinePrefixWithoutInject
        ? lastTriggerSelectedCompletionInfo?.text === selectedCompletionInfo?.text
        : true;
    if (!isSameDocument ||
        !isSameLine ||
        !isSameNextNonEmptyLine ||
        !isSameSelectedInfoItemOrFullyAccepted) {
        return null;
    }
    // The currentLinePrefix might have an injected prefix. This is usually expected, since we want
    // to use eventual suggest widget state to guide the completion, but ofr the last candidate
    // logic we need to get the line prefix as it appears in the document and there, the prefix is
    // not present yet.
    const lastTriggerCurrentLinePrefixInDocument = lastTriggerDocContext.injectedPrefix
        ? lastTriggerDocContext.currentLinePrefix.slice(0, lastTriggerDocContext.currentLinePrefix.length -
            lastTriggerDocContext.injectedPrefix.length)
        : lastTriggerDocContext.currentLinePrefix;
    // There are 2 reasons we can reuse a candidate: typing-as-suggested or change-of-indentation.
    const isIndentation = isWhitespace(currentLinePrefix) &&
        currentLinePrefix.startsWith(lastTriggerCurrentLinePrefixInDocument);
    const isDeindentation = isWhitespace(lastTriggerCurrentLinePrefixInDocument) &&
        lastTriggerCurrentLinePrefixInDocument.startsWith(currentLinePrefix);
    const isIndentationChange = currentLineSuffix === '' && (isIndentation || isDeindentation);
    let didAcceptCompletion = false;
    const itemsToReuse = lastCandidate.result.items
        .map((item) => {
        // Allow reuse if the user is (possibly) typing forward as suggested by the last
        // candidate completion. We still need to filter the candidate items to see which ones
        // the user's typing actually follows.
        const lastCompletion = lastTriggerCurrentLinePrefixInDocument + item.insertText;
        const isTypingAsSuggested = lastCompletion.startsWith(currentLinePrefix) &&
            position.isAfterOrEqual(lastTriggerPosition);
        if (isTypingAsSuggested) {
            const remaining = lastCompletion.slice(currentLinePrefix.length);
            const alreadyInsertedText = item.insertText.slice(0, -remaining.length);
            // Shift the range by the already inserted characters to the right
            const prevRange = item.range;
            let newRange;
            if (prevRange) {
                const rangeShift = alreadyInsertedText.length;
                newRange = new vscode.Range(prevRange.start.line, prevRange.start.character + rangeShift, prevRange.end.line, prevRange.end.character + rangeShift);
            }
            // When the remaining text is empty, the user has forward-typed the full text of the
            // completion. We mark this as an accepted completion.
            if (remaining.length === 0) {
                didAcceptCompletion = true;
                handleDidAcceptCompletionItem?.({
                    requestParams: getRequestParamsFromLastCandidate(document, lastCandidate),
                    logId: lastCandidate.result.logId,
                    analyticsItem: item,
                    trackedRange: item.range,
                });
                return undefined;
            }
            // Detect partial acceptance of the last candidate
            const acceptedLength = currentLinePrefix.length - lastTriggerCurrentLinePrefixInDocument.length;
            if (isPartialAcceptance(item.insertText, acceptedLength)) {
                handleDidPartiallyAcceptCompletionItem?.({
                    logId: lastCandidate.result.logId,
                    analyticsItem: item,
                }, acceptedLength);
            }
            return { ...item, insertText: remaining, range: newRange };
        }
        // Allow reuse if only the indentation (leading whitespace) has changed.
        if (isIndentationChange) {
            if (isIndentation) {
                const leadingWhitespace = item.insertText.match(/^\s*/)?.[0] ?? '';
                /**
                 * Consider the following completion:
                 *
                 * lastTriggerCurrentLinePrefixInDocument = '\t'
                 * insertText = '\t\tconst foo = 1'
                 * currentLinePrefix = '\t\t\t\t'
                 *
                 *
                 * The user types on a new line `\t`, the completion is generated in the background
                 * `\t\tconst foo = 1`, while user adds `\t\t\t` to the current line.
                 * As a result all `\t` should be removed from the completion as user typed them forward
                 * as suggested. The resuling completion `const foo = 1`.
                 */
                const whiteSpaceToRemove = Math.min(currentLinePrefix.length - lastTriggerCurrentLinePrefixInDocument.length, leadingWhitespace.length);
                return {
                    ...item,
                    insertText: item.insertText.slice(whiteSpaceToRemove),
                };
            }
            return {
                ...item,
                insertText: item.insertText,
            };
        }
        return undefined;
    })
        .filter(cody_shared_1.isDefined);
    // Ensure that when one completion was marked as accepted, we don't reuse any others
    if (didAcceptCompletion) {
        return null;
    }
    return itemsToReuse.length > 0
        ? {
            // Reuse the logId to so that typing text of a displayed completion will not log a new
            // completion on every keystroke.
            logId: lastCandidate.result.logId,
            source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
            items: itemsToReuse,
        }
        : null;
}
exports.reuseLastCandidate = reuseLastCandidate;
function isWhitespace(s) {
    return /^\s*$/.test(s);
}
// Count a completion as partially accepted, when at least one word of the completion was typed
// To avoid sending partial completion events on every keystroke after the first word, we only
// return true here after every completed word.
function isPartialAcceptance(insertText, insertedLength) {
    const insertedText = insertText.slice(0, insertedLength);
    const match = insertedText.match(/(\w+)\W+$/);
    const endOfFirstWord = match?.index === undefined ? null : match.index + match[0].length;
    if (endOfFirstWord === null) {
        return false;
    }
    return insertedLength >= endOfFirstWord;
}
function getRequestParamsFromLastCandidate(document, lastCandidate) {
    return {
        document,
        position: lastCandidate.lastTriggerPosition,
        docContext: lastCandidate.lastTriggerDocContext,
        selectedCompletionInfo: lastCandidate.lastTriggerSelectedCompletionInfo,
    };
}
exports.getRequestParamsFromLastCandidate = getRequestParamsFromLastCandidate;
