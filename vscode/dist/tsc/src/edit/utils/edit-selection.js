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
exports.getEditLineSelection = exports.getEditMaximumSelection = exports.getEditSmartSelection = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("../../editor/utils");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const edit_intent_1 = require("./edit-intent");
/**
 * This function retrieves a "smart" selection for a FixupTask when selectionRange is not available.
 *
 * The idea of a "smart" selection is to look at both the start and end positions of the current selection,
 * and attempt to expand those positions to encompass more meaningful chunks of code, such as folding regions.
 *
 * The function does the following:
 * 1. Finds the document URI from it's fileName
 * 2. If the selection starts in a folding range, moves the selection start position back to the start of that folding range.
 * 3. If the selection ends in a folding range, moves the selection end positionforward to the end of that folding range.
 * @returns A Promise that resolves to an `vscode.Range` which represents the combined "smart" selection.
 */
async function getEditSmartSelection(document, selectionRange, { forceExpand } = {}, intent) {
    // Use selectionRange when it's available
    if (!forceExpand && selectionRange && !selectionRange?.start.isEqual(selectionRange.end)) {
        return selectionRange;
    }
    // Return original (empty) range if we will resolve to generate new code
    if (!forceExpand && (0, edit_intent_1.getEditIntent)(document, selectionRange, intent) === 'add') {
        return selectionRange;
    }
    // Retrieve the start position of the current selection
    const activeCursorStartPosition = selectionRange.start;
    // If we find a new expanded selection position then we set it as the new start position
    // and if we don't then we fallback to the original selection made by the user
    const newSelectionStartingPosition = (await (0, utils_1.getSmartSelection)(document, activeCursorStartPosition.line))?.start ||
        selectionRange.start;
    // Retrieve the ending line of the current selection
    const activeCursorEndPosition = selectionRange.end;
    // If we find a new expanded selection position then we set it as the new ending position
    // and if we don't then we fallback to the original selection made by the user
    const newSelectionEndingPosition = (await (0, utils_1.getSmartSelection)(document, activeCursorEndPosition.line))?.end || selectionRange.end;
    // Create a new range that starts from the beginning of the folding range at the start position
    // and ends at the end of the folding range at the end position.
    return new vscode.Range(newSelectionStartingPosition.line, newSelectionStartingPosition.character, newSelectionEndingPosition.line, newSelectionEndingPosition.character);
}
exports.getEditSmartSelection = getEditSmartSelection;
const MAXIMUM_EDIT_SELECTION_LENGTH = (0, cody_shared_1.tokensToChars)(cody_shared_1.MAX_CURRENT_FILE_TOKENS);
/**
 * Expands the selection to encompass as much of the document as we can include as context to the LLM.
 */
function getEditMaximumSelection(document, selectionRange) {
    let expandedRange = selectionRange;
    let charCount = document.getText(expandedRange).length;
    while (charCount < MAXIMUM_EDIT_SELECTION_LENGTH) {
        const newStartLine = expandedRange.start.line > 0 ? expandedRange.start.line - 1 : 0;
        const newEndLine = expandedRange.end.line < document.lineCount - 1
            ? expandedRange.end.line + 1
            : document.lineCount - 1;
        const newRange = new vscode.Range(newStartLine, 0, newEndLine, document.lineAt(newEndLine).text.length);
        const newCharCount = document.getText(newRange).length;
        if (newCharCount > MAXIMUM_EDIT_SELECTION_LENGTH ||
            (newStartLine === 0 && newEndLine === document.lineCount - 1)) {
            break; // Stop expanding if the next expansion goes over the limit or the entire document is selected
        }
        expandedRange = newRange;
        charCount = newCharCount;
    }
    return expandedRange;
}
exports.getEditMaximumSelection = getEditMaximumSelection;
/**
 * Expands the selection to include all non-whitespace characters from the selected lines.
 * This is to help produce consistent edits regardless of user behaviour.
 */
function getEditLineSelection(document, selection) {
    if (selection.isEmpty) {
        // No selection to expand, do nothing
        return selection;
    }
    const startChar = document.lineAt(selection.start.line).firstNonWhitespaceCharacterIndex;
    const endChar = document.lineAt(selection.end.line).text.length;
    return new vscode.Range(selection.start.line, startChar, selection.end.line, endChar);
}
exports.getEditLineSelection = getEditLineSelection;
