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
exports.getContextFileFromUri = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode = __importStar(require("vscode"));
/**
 * Generate ContextFile for a file URI.
 */
async function getContextFileFromUri(file) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.filePath', async (span) => {
        try {
            const doc = await vscode.workspace.openTextDocument(file);
            const decoded = doc?.getText();
            const truncatedContent = (0, cody_shared_1.truncateText)(decoded, cody_shared_1.MAX_CURRENT_FILE_TOKENS).trim();
            if (!decoded || !truncatedContent) {
                throw new Error('No file content');
            }
            const range = new vscode.Range(0, 0, truncatedContent.split('\n').length, 0);
            return [
                {
                    type: 'file',
                    content: decoded,
                    uri: file,
                    source: 'editor',
                    range,
                },
            ];
        }
        catch (error) {
            (0, cody_shared_1.logError)('getContextFileFromUri', 'failed', { verbose: error });
            return [];
        }
    });
}
exports.getContextFileFromUri = getContextFileFromUri;
