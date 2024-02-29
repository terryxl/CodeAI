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
exports.getContextFileFromTabs = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode = __importStar(require("vscode"));
const file_path_1 = require("./file-path");
/**
 * Gets context files from the currently open tabs.
 *
 * Iterates through all open tabs, filters to only file tabs in the workspace,
 * and then creates ContextFile objects for each valid tab.
 */
async function getContextFileFromTabs() {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.openTabs', async (span) => {
        const contextFiles = [];
        try {
            // Get open tabs from the current editor
            const tabGroups = vscode.window.tabGroups.all;
            const openTabs = tabGroups.flatMap(group => group.tabs.map(tab => tab.input));
            for (const tab of openTabs) {
                // Skip non-file items
                if (tab?.uri?.scheme !== 'file') {
                    continue;
                }
                // Skip files that are not from the current workspace
                if (!vscode.workspace.getWorkspaceFolder(tab?.uri)) {
                    continue;
                }
                // Create context message
                contextFiles.push(...(await (0, file_path_1.getContextFileFromUri)(tab?.uri)));
            }
        }
        catch (error) {
            (0, cody_shared_1.logError)('getContextFileFromTabs', 'failed', { verbose: error });
        }
        // Returns what we have so far
        return contextFiles;
    });
}
exports.getContextFileFromTabs = getContextFileFromTabs;
