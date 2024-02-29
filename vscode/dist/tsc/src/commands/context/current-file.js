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
exports.getContextFileFromCurrentFile = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../../editor/active-editor");
const vscode = __importStar(require("vscode"));
async function getContextFileFromCurrentFile() {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.file', async (span) => {
        try {
            const editor = (0, active_editor_1.getEditor)();
            const document = editor?.active?.document;
            if (!editor?.active || !document) {
                throw new Error('No active editor');
            }
            const selection = new vscode.Selection(0, 0, document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            const content = document.getText(selection);
            if (!content.trim()) {
                throw new Error('No content');
            }
            return [
                {
                    type: 'file',
                    uri: document.uri,
                    content: (0, cody_shared_1.truncateText)(content, cody_shared_1.MAX_CURRENT_FILE_TOKENS),
                    source: 'editor',
                    range: selection,
                },
            ];
        }
        catch (error) {
            (0, cody_shared_1.logError)('getContextFileFromCurrentFile', 'failed', { verbose: error });
            return [];
        }
    });
}
exports.getContextFileFromCurrentFile = getContextFileFromCurrentFile;
