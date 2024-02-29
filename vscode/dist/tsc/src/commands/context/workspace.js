"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceFilesContext = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode_1 = require("vscode");
const workspace_files_1 = require("../utils/workspace-files");
const create_context_file_1 = require("../utils/create-context-file");
/**
 * Wrap the vscode findVSCodeFiles function to return context files.
 * Gets workspace files context based on global pattern, exclude pattern and max results.
 *
 * @param globalPattern - Glob pattern to search files
 * @param excludePattern - Glob pattern to exclude files
 * @param maxResults - Max number of results to return
 * @returns Promise resolving to array of context files
 */
async function getWorkspaceFilesContext(globalPattern, excludePattern, maxResults = 5) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.workspace', async (span) => {
        // the default exclude pattern excludes dotfiles, node_modules, and snap directories
        const excluded = excludePattern || '**/{.*,node_modules,snap*}/**';
        const contextFiles = [];
        // set cancellation token to time out after 20s
        const token = new vscode_1.CancellationTokenSource();
        setTimeout(() => {
            token.cancel();
        }, 20000);
        try {
            const results = await vscode_1.workspace.findFiles(globalPattern, excluded, maxResults, token.token);
            for (const result of results) {
                const decoded = await (0, workspace_files_1.getDocText)(result);
                const contextFile = await (0, create_context_file_1.createContextFile)(result, decoded);
                if (contextFile) {
                    contextFiles.push(contextFile);
                }
            }
            return contextFiles;
        }
        catch (error) {
            (0, cody_shared_1.logError)('getWorkspaceFilesContext failed', `${error}`);
            return contextFiles;
        }
    });
}
exports.getWorkspaceFilesContext = getWorkspaceFilesContext;
