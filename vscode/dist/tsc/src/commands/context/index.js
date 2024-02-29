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
exports.getCommandContextFiles = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../../log");
const selection_1 = require("./selection");
const current_file_1 = require("./current-file");
const file_path_1 = require("./file-path");
const directory_1 = require("./directory");
const open_tabs_1 = require("./open-tabs");
const vscode_uri_1 = require("vscode-uri");
/**
 * Gets the context files for a Cody command based on the given configuration.
 *
 * This handles getting context files from the selection, current file,
 * file path, directories, and open tabs based on the `config` object passed in.
 *
 * Context from context.command is added during the initial step in CommandController.
 *
 * The returned context files are filtered to remove any files ignored by Cody.
 */
const getCommandContextFiles = async (config) => {
    try {
        const contextFiles = [];
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
        // Return immediately if context.none is true
        if (config.none) {
            return [];
        }
        if (config.selection !== false) {
            contextFiles.push(...(await (0, selection_1.getContextFileFromCursor)()));
        }
        if (config.currentFile) {
            contextFiles.push(...(await (0, current_file_1.getContextFileFromCurrentFile)()));
        }
        if (config.filePath && workspaceRoot?.path) {
            // Create an workspace uri with the given relative file path
            const file = vscode_uri_1.Utils.joinPath(workspaceRoot, config.filePath);
            contextFiles.push(...(await (0, file_path_1.getContextFileFromUri)(file)));
        }
        if (config.directoryPath && workspaceRoot?.path) {
            // Create an workspace uri with the given relative directory path
            const dir = vscode_uri_1.Utils.joinPath(workspaceRoot, config.directoryPath);
            contextFiles.push(...(await (0, directory_1.getContextFileFromDirectory)(dir)));
        }
        if (config.currentDir) {
            const currentDirContext = await (0, directory_1.getContextFileFromDirectory)();
            contextFiles.push(...currentDirContext);
        }
        if (config.openTabs) {
            contextFiles.push(...(await (0, open_tabs_1.getContextFileFromTabs)()));
        }
        return contextFiles.filter(file => !(0, cody_shared_1.isCodyIgnoredFile)(file.uri));
    }
    catch (error) {
        (0, log_1.logDebug)('getCommandContextFiles', 'Error getting command context files', error);
        return [];
    }
};
exports.getCommandContextFiles = getCommandContextFiles;
