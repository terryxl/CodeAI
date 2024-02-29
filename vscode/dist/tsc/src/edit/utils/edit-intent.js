"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditIntent = exports.isGenerateIntent = void 0;
const constants_1 = require("../constants");
/**
 * Checks if the current selection and editor represent a generate intent.
 * A generate intent means the user has an empty selection on an empty line.
 */
function isGenerateIntent(document, selection) {
    return selection.isEmpty && document.lineAt(selection.start.line).isEmptyOrWhitespace;
}
exports.isGenerateIntent = isGenerateIntent;
function getEditIntent(document, selection, proposedIntent) {
    if (proposedIntent !== undefined && proposedIntent !== 'add') {
        // Return provided intent that should not be overriden
        return proposedIntent;
    }
    if (isGenerateIntent(document, selection)) {
        return 'add';
    }
    return proposedIntent || constants_1.DEFAULT_EDIT_INTENT;
}
exports.getEditIntent = getEditIntent;
