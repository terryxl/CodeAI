"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContextFileFromCursor = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../../editor/active-editor");
const utils_1 = require("../../editor/utils");
/**
 * Gets context file content from the current editor selection.
 *
 * When no selection is made, try getting the smart selection based on the cursor position.
 * If no smart selection is found, use the visible range of the editor instead.
 */
async function getContextFileFromCursor() {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.selection', async (span) => {
        try {
            const editor = (0, active_editor_1.getEditor)();
            const document = editor?.active?.document;
            if (!editor?.active || !document) {
                throw new Error('No active editor');
            }
            // Use user current selection if any
            // Else, use smart selection based on cursor position
            // Else, use visible range of the editor that contains the cursor as fallback
            const cursor = editor.active.selection;
            const smartSelection = await (0, utils_1.getSmartSelection)(document?.uri, cursor?.start.line);
            const activeSelection = !cursor?.start.isEqual(cursor?.end) ? cursor : smartSelection;
            const visibleRange = editor.active.visibleRanges.find(range => range.contains(cursor?.start));
            const selection = activeSelection ?? visibleRange;
            const content = document.getText(selection);
            return [
                {
                    type: 'file',
                    uri: document.uri,
                    content: (0, cody_shared_1.truncateText)(content, cody_shared_1.MAX_CURRENT_FILE_TOKENS),
                    source: 'selection',
                    range: selection,
                },
            ];
        }
        catch (error) {
            (0, cody_shared_1.logError)('getContextFileFromCursor', 'failed', { verbose: error });
            return [];
        }
    });
}
exports.getContextFileFromCursor = getContextFileFromCursor;
