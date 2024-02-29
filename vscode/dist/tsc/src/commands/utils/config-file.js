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
exports.saveJSONFile = exports.createJSONFile = exports.createFileWatchers = void 0;
const vscode = __importStar(require("vscode"));
//Help functions for the custom commands config file
// Create a file watcher for each .vscode/cody.json file
function createFileWatchers(configFile) {
    if (!configFile) {
        return null;
    }
    // Use the file as the first arg to RelativePattern because a file watcher will be set up on the
    // first arg given. If this is a directory with many files, such as the user's home directory,
    // it will cause a very large number of watchers to be created, which will exhaust the system.
    // This occurs even if the second arg is a relative file path with no wildcards.
    const watchPattern = new vscode.RelativePattern(configFile, '*');
    const watcher = vscode.workspace.createFileSystemWatcher(watchPattern);
    return watcher;
}
exports.createFileWatchers = createFileWatchers;
// Create an empty Json file at the given path
async function createJSONFile(file) {
    await saveJSONFile({ commands: [] }, file);
}
exports.createJSONFile = createJSONFile;
// Add context to the given file
async function saveJSONFile(data, file) {
    try {
        const workspaceEditor = new vscode.WorkspaceEdit();
        // Clear the file before writing to it
        workspaceEditor.deleteFile(file, { ignoreIfNotExists: true });
        workspaceEditor.createFile(file, { ignoreIfExists: true });
        workspaceEditor.insert(file, new vscode.Position(0, 0), JSON.stringify(data, null, 2));
        await vscode.workspace.applyEdit(workspaceEditor);
        // Save the file
        const doc = await vscode.workspace.openTextDocument(file);
        await doc.save();
    }
    catch (error) {
        throw new Error(`Failed to save your Custom Commands to a JSON file: ${error}`);
    }
}
exports.saveJSONFile = saveJSONFile;
