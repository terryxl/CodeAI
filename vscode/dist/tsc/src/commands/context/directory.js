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
exports.getContextFileFromDirectory = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../../editor/active-editor");
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
/**
 * Gets context messages for the files in the given directory.
 * Or if no directory is given, gets the context messages for the files in the current directory.
 *
 * Loops through the files in the directory, gets the content of each file,
 * truncates it, and adds it to the context messages along with the file name.
 * Limits file sizes to 1MB.
 */
async function getContextFileFromDirectory(directory) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.directory', async () => {
        const contextFiles = [];
        const editor = (0, active_editor_1.getEditor)();
        const document = editor?.active?.document;
        if (!editor?.active || !document) {
            return [];
        }
        try {
            // Use current directory if no directory uri is provided
            const dirUri = directory ?? vscode_uri_1.Utils.joinPath(document.uri, '..');
            // Get the files in the directory
            const filesInDir = await vscode.workspace.fs.readDirectory(dirUri);
            // Filter out directories and dot files
            const filtered = filesInDir.filter(file => {
                const fileName = file[0];
                const fileType = file[1];
                const isDirectory = fileType === vscode.FileType.Directory;
                const isHiddenFile = fileName.startsWith('.');
                return !isDirectory && !isHiddenFile;
            });
            // Get the context from each file in the directory
            for (const [name, _type] of filtered) {
                // Reconstruct the file URI with the file name and directory URI
                const fileUri = vscode_uri_1.Utils.joinPath(dirUri, name);
                // check file size before opening the file. skip file if it's larger than 1MB
                const fileSize = await vscode.workspace.fs.stat(fileUri);
                if (fileSize.size > 1000000 || !fileSize.size) {
                    continue;
                }
                const bytes = await vscode.workspace.fs.readFile(fileUri);
                const decoded = new TextDecoder('utf-8').decode(bytes);
                const truncatedContent = (0, cody_shared_1.truncateText)(decoded, cody_shared_1.MAX_CURRENT_FILE_TOKENS);
                const range = new vscode.Range(0, 0, truncatedContent.split('\n').length - 1 || 0, 0);
                const contextFile = {
                    type: 'file',
                    uri: fileUri,
                    content: truncatedContent,
                    source: 'editor',
                    range,
                };
                contextFiles.push(contextFile);
                // Limit the number of files to 10
                const maxResults = 10;
                if (contextFiles.length >= maxResults) {
                    return contextFiles;
                }
            }
        }
        catch (error) {
            (0, cody_shared_1.logError)('getContextFileFromDirectory', 'failed', { verbose: error });
        }
        return contextFiles;
    });
}
exports.getContextFileFromDirectory = getContextFileFromDirectory;
