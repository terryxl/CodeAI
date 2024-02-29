"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamicMultilineDocContext = void 0;
const debug_utils_1 = require("../../services/open-telemetry/debug-utils");
const get_current_doc_context_1 = require("../get-current-doc-context");
const text_processing_1 = require("../text-processing");
/**
 * 1. Generates the object with `multilineTrigger` and `multilineTriggerPosition` fields pretending like the first line of the completion is already in the document.
 * 2. If the updated document context has the multiline trigger, returns the generated object
 * 3. Otherwise, returns an empty object.
 */
function getDynamicMultilineDocContext(params) {
    const { insertText, languageId, docContext } = params;
    const updatedDocContext = (0, get_current_doc_context_1.insertIntoDocContext)({
        languageId,
        insertText: (0, text_processing_1.getFirstLine)(insertText),
        dynamicMultilineCompletions: true,
        docContext,
    });
    const isMultilineBasedOnFirstLine = Boolean(updatedDocContext.multilineTrigger);
    if (isMultilineBasedOnFirstLine) {
        (0, debug_utils_1.addAutocompleteDebugEvent)('isMultilineBasedOnFirstLine', {
            currentLinePrefix: docContext.currentLinePrefix,
            text: insertText,
        });
        return {
            multilineTrigger: updatedDocContext.multilineTrigger,
            multilineTriggerPosition: updatedDocContext.multilineTriggerPosition,
        };
    }
    return undefined;
}
exports.getDynamicMultilineDocContext = getDynamicMultilineDocContext;
