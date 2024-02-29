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
exports.insertIntoDocContext = exports.getDerivedDocContext = exports.getCurrentDocContext = void 0;
const vscode = __importStar(require("vscode"));
const debug_utils_1 = require("../services/open-telemetry/debug-utils");
const detect_multiline_1 = require("./detect-multiline");
const text_processing_1 = require("./text-processing");
const process_inline_completions_1 = require("./text-processing/process-inline-completions");
/**
 * Get the current document context based on the cursor position in the current document.
 */
function getCurrentDocContext(params) {
    const { document, position, maxPrefixLength, maxSuffixLength, context, dynamicMultilineCompletions, } = params;
    const offset = document.offsetAt(position);
    // TODO(philipp-spiess): This requires us to read the whole document. Can we limit our ranges
    // instead?
    const completePrefix = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
    const completeSuffix = document.getText(new vscode.Range(position, document.positionAt(document.getText().length)));
    // Patch the document to contain the selected completion from the popup dialog already
    let completePrefixWithContextCompletion = completePrefix;
    let injectedPrefix = null;
    if (context?.selectedCompletionInfo) {
        const { range, text } = context.selectedCompletionInfo;
        // A selected completion info attempts to replace the specified range with the inserted text
        //
        // We assume that the end of the range equals the current position, otherwise this would not
        // inject a prefix
        if (range.end.character === position.character && range.end.line === position.line) {
            const lastLine = (0, text_processing_1.lines)(completePrefix).at(-1);
            const beforeLastLine = completePrefix.slice(0, -lastLine.length);
            completePrefixWithContextCompletion =
                beforeLastLine + lastLine.slice(0, range.start.character) + text;
            injectedPrefix = completePrefixWithContextCompletion.slice(completePrefix.length);
            if (injectedPrefix === '') {
                injectedPrefix = null;
            }
        }
        else {
            console.warn('The selected completion info does not match the current position');
        }
    }
    const prefixLines = (0, text_processing_1.lines)(completePrefixWithContextCompletion);
    const suffixLines = (0, text_processing_1.lines)(completeSuffix);
    let prefix;
    if (offset > maxPrefixLength) {
        let total = 0;
        let startLine = prefixLines.length;
        for (let i = prefixLines.length - 1; i >= 0; i--) {
            if (total + prefixLines[i].length > maxPrefixLength) {
                break;
            }
            startLine = i;
            total += prefixLines[i].length;
        }
        prefix = prefixLines.slice(startLine).join('\n');
    }
    else {
        prefix = prefixLines.join('\n');
    }
    let totalSuffix = 0;
    let endLine = 0;
    for (let i = 0; i < suffixLines.length; i++) {
        if (totalSuffix + suffixLines[i].length > maxSuffixLength) {
            break;
        }
        endLine = i + 1;
        totalSuffix += suffixLines[i].length;
    }
    const suffix = suffixLines.slice(0, endLine).join('\n');
    return getDerivedDocContext({
        position,
        languageId: document.languageId,
        dynamicMultilineCompletions,
        documentDependentContext: {
            prefix,
            suffix,
            injectedPrefix,
        },
    });
}
exports.getCurrentDocContext = getCurrentDocContext;
/**
 * Calculates `DocumentContext` based on the existing prefix and suffix.
 * Used if the document context needs to be calculated for the updated text but there's no `document` instance for that.
 */
function getDerivedDocContext(params) {
    const { position, documentDependentContext, languageId, dynamicMultilineCompletions } = params;
    const linesContext = getLinesContext(documentDependentContext);
    const { multilineTrigger, multilineTriggerPosition } = (0, detect_multiline_1.detectMultiline)({
        docContext: { ...linesContext, ...documentDependentContext },
        languageId,
        dynamicMultilineCompletions,
        position,
    });
    (0, debug_utils_1.addAutocompleteDebugEvent)('getDerivedDocContext', {
        multilineTrigger,
        multilineTriggerPosition,
    });
    return {
        ...documentDependentContext,
        ...linesContext,
        position,
        multilineTrigger,
        multilineTriggerPosition,
    };
}
exports.getDerivedDocContext = getDerivedDocContext;
function insertIntoDocContext(params) {
    const { insertText, languageId, dynamicMultilineCompletions, docContext, docContext: { position, prefix, suffix, currentLineSuffix }, } = params;
    const updatedPosition = (0, text_processing_1.getPositionAfterTextInsertion)(position, insertText);
    (0, debug_utils_1.addAutocompleteDebugEvent)('getDerivedDocContext', {
        currentLinePrefix: docContext.currentLinePrefix,
        text: insertText,
    });
    const updatedDocContext = getDerivedDocContext({
        languageId,
        position: updatedPosition,
        dynamicMultilineCompletions,
        documentDependentContext: {
            prefix: prefix + insertText,
            // Remove the characters that are being replaced by the completion
            // to reduce the chances of breaking the parse tree with redundant symbols.
            suffix: suffix.slice((0, process_inline_completions_1.getMatchingSuffixLength)(insertText, currentLineSuffix)),
            injectedPrefix: null,
        },
    });
    updatedDocContext.positionWithoutInjectedCompletionText =
        updatedDocContext.positionWithoutInjectedCompletionText || docContext.position;
    updatedDocContext.injectedCompletionText = (docContext.injectedCompletionText || '') + insertText;
    return updatedDocContext;
}
exports.insertIntoDocContext = insertIntoDocContext;
function getLinesContext(params) {
    const { prefix, suffix } = params;
    const currentLinePrefix = (0, text_processing_1.getLastLine)(prefix);
    const currentLineSuffix = (0, text_processing_1.getFirstLine)(suffix);
    const prevNonEmptyLine = (0, text_processing_1.getPrevNonEmptyLine)(prefix);
    const nextNonEmptyLine = (0, text_processing_1.getNextNonEmptyLine)(suffix);
    return {
        currentLinePrefix,
        currentLineSuffix,
        prevNonEmptyLine,
        nextNonEmptyLine,
    };
}
