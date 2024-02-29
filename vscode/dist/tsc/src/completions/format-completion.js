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
exports.formatCompletion = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("../utils");
const logger_1 = require("./logger");
const text_processing_1 = require("./text-processing");
async function formatCompletion(autocompleteItem) {
    try {
        const startedAt = performance.now();
        const { document, position, docContext: { currentLinePrefix }, } = autocompleteItem.requestParams;
        const insertedLines = (0, text_processing_1.lines)(autocompleteItem.analyticsItem.insertText);
        const endPosition = insertedLines.length <= 1
            ? new vscode.Position(position.line, currentLinePrefix.length + insertedLines[0].length)
            : new vscode.Position(position.line + insertedLines.length, 0);
        // Start at the beginning of the line to format the whole line if needed.
        const rangeToFormat = new vscode.Range(new vscode.Position(position.line, 0), endPosition);
        const formattingChanges = await vscode.commands.executeCommand('vscode.executeFormatDocumentProvider', document.uri, {
            tabSize: (0, utils_1.getEditorTabSize)(document.uri),
            insertSpaces: (0, utils_1.getEditorInsertSpaces)(document.uri),
        });
        const formattingChangesInRange = (formattingChanges || []).filter(change => rangeToFormat.contains(change.range));
        if (formattingChangesInRange.length !== 0) {
            await vscode.window.activeTextEditor?.edit(edit => {
                for (const change of formattingChangesInRange) {
                    edit.replace(change.range, change.newText);
                }
            }, { undoStopBefore: false, undoStopAfter: true });
        }
        (0, logger_1.logCompletionFormatEvent)({
            duration: performance.now() - startedAt,
            languageId: document.languageId,
            formatter: getFormatter(document.languageId),
        });
    }
    catch (unknownError) {
        (0, logger_1.logError)(unknownError instanceof Error ? unknownError : new Error(unknownError));
    }
}
exports.formatCompletion = formatCompletion;
function getFormatter(languageId) {
    // Access the configuration for the specific languageId
    const config = vscode.workspace.getConfiguration(`[${languageId}]`);
    // Get the default formatter setting
    const defaultFormatter = config.get('editor.defaultFormatter');
    if (defaultFormatter) {
        return defaultFormatter;
    }
    // Fallback: Check the global default formatter if specific language formatter is not set
    const globalConfig = vscode.workspace.getConfiguration();
    return globalConfig.get('editor.defaultFormatter');
}
