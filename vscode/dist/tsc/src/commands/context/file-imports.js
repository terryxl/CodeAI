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
exports.getContextFileFromImports = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode = __importStar(require("vscode"));
const active_editor_1 = require("../../editor/active-editor");
const folding_range_1 = require("./folding-range");
/**
 * Gets context file content from the import statements in the active editor.
 */
async function getContextFileFromImports() {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.imports', async (span) => {
        try {
            const editor = (0, active_editor_1.getEditor)()?.active;
            const document = editor?.document;
            if (!editor || !document) {
                throw new Error('No active editor');
            }
            // Get the folding range of the last import statement
            const lastImportRange = await (0, folding_range_1.getFoldingRanges)(document.uri, 'imports', true);
            const lastImportLineRange = lastImportRange?.[0];
            if (!lastImportLineRange) {
                throw new Error('Folding range not found');
            }
            // Recreate the selection range from line 0 to the line of the last import statement
            // This assumes import statements are typically at the top of the file
            const lastImportLine = lastImportLineRange.end;
            const range = new vscode.Range(0, 0, lastImportLine, 0);
            const importStatements = document.getText(range);
            if (!importStatements?.trim()) {
                throw new Error('No import statements');
            }
            const truncatedContent = (0, cody_shared_1.truncateText)(importStatements, cody_shared_1.MAX_CURRENT_FILE_TOKENS / 2);
            return [
                {
                    type: 'file',
                    uri: document.uri,
                    content: truncatedContent,
                    range: range,
                    source: 'editor',
                },
            ];
        }
        catch (error) {
            (0, cody_shared_1.logError)('getContextFileFromImports', 'failed', { verbose: error });
            return [];
        }
    });
}
exports.getContextFileFromImports = getContextFileFromImports;
