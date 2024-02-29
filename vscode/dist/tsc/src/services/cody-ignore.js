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
exports.setUpCodyIgnore = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../log");
const utf8 = new TextDecoder('utf-8');
/**
 * Parses `.code/ignore` files from the workspace and sets up a watcher to refresh
 * whenever the files change.
 *
 * NOTE: This is only called once at git extension start up time (gitAPIinit)
 */
function setUpCodyIgnore() {
    onConfigChange();
    // Refresh ignore rules when any ignore file in the workspace changes.
    const watcher = vscode.workspace.createFileSystemWatcher(cody_shared_1.CODY_IGNORE_POSIX_GLOB);
    watcher.onDidChange(refresh);
    watcher.onDidCreate(refresh);
    watcher.onDidDelete(refresh);
    // Handle any added/removed workspace folders.
    const didChangeSubscription = vscode.workspace.onDidChangeWorkspaceFolders(e => {
        e.added.map(wf => refresh(wf.uri));
        e.removed.map(wf => clear(wf));
    });
    // Handle existing workspace folders.
    vscode.workspace.workspaceFolders?.map(wf => refresh(wf.uri));
    // NOTE This can be removed once cody ignore is stable.
    const onDidChangeConfig = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('cody')) {
            onConfigChange();
        }
    });
    return {
        dispose() {
            watcher.dispose();
            didChangeSubscription.dispose();
            onDidChangeConfig.dispose();
        },
    };
}
exports.setUpCodyIgnore = setUpCodyIgnore;
/**
 * Rebuilds the ignore files for the workspace containing `uri`.
 */
async function refresh(uri) {
    const wf = vscode.workspace.getWorkspaceFolder(uri);
    if (!wf) {
        // If this happens, we either have no workspace folder or it was removed before we started
        // processing the watch event.
        return;
    }
    // We currently only support file://. To support others, we need to change all file
    // paths in lots of places to be URIs.
    if (wf.uri.scheme !== 'file') {
        return;
    }
    // Get the codebase name from the git clone URL on each refresh
    // NOTE: This is needed because the ignore rules are mapped to workspace addresses at creation time, we will need to map the name of the codebase to each workspace for us to map the embedding results returned for a specific codebase by the search API to the correct workspace later.
    const ignoreFilePattern = new vscode.RelativePattern(wf.uri, cody_shared_1.CODY_IGNORE_POSIX_GLOB);
    const ignoreFiles = await vscode.workspace.findFiles(ignoreFilePattern);
    const filesWithContent = await Promise.all(ignoreFiles.map(async (fileUri) => ({
        uri: fileUri,
        content: await tryReadFile(fileUri),
    })));
    (0, log_1.logDebug)('CodyIgnore:refresh:workspace', wf.uri.toString());
    cody_shared_1.ignores.setIgnoreFiles(wf.uri, filesWithContent);
}
/**
 * Removes ignore rules for the provided WorkspaceFolder.
 */
function clear(wf) {
    // We currently only support file://. To support others, we need to change all file
    // paths in lots of places to be URIs.
    if (wf.uri.scheme !== 'file') {
        return;
    }
    cody_shared_1.ignores.clearIgnoreFiles(wf.uri);
    (0, log_1.logDebug)('CodyIgnore:clearIgnoreFiles:workspace', 'removed', { verbose: wf.uri.toString() });
}
/**
 * Read the content of `fileUri`.
 *
 * Returns an empty string if the file was not readable (for example it was removed before we read it).
 */
async function tryReadFile(fileUri) {
    return vscode.workspace.fs.readFile(fileUri).then(content => utf8.decode(content), error => {
        (0, log_1.logDebug)('CodyIgnore:clearIgnoreFiles:tryReadFile', 'failed', {
            verbose: `Skipping unreadable ignore file ${fileUri}: ${error}`,
        });
        return '';
    });
}
/**
 * Check if the config for enabling cody ignore is changed.
 *
 * NOTE This can be removed once cody ignore is stable.
 */
function onConfigChange() {
    const config = vscode.workspace.getConfiguration('cody');
    cody_shared_1.ignores.setActiveState(config.get('internal.unstable'));
}
