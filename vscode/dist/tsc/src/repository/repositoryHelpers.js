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
exports.getCodebaseFromWorkspaceUri = exports.gitAPIinit = exports.gitAPI = exports.gitDirectoryUri = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../log");
const cody_ignore_1 = require("../services/cody-ignore");
const test_support_1 = require("../test-support");
function gitDirectoryUri(uri) {
    return gitAPI()?.getRepository(uri)?.rootUri;
}
exports.gitDirectoryUri = gitDirectoryUri;
function gitAPI() {
    const extension = vscode.extensions.getExtension('vscode.git');
    if (!extension) {
        console.warn('Git extension not available');
        return undefined;
    }
    if (!extension.isActive) {
        console.warn('Git extension not active');
        return undefined;
    }
    return extension.exports.getAPI(1);
}
exports.gitAPI = gitAPI;
/**
 * NOTE: This is for Chat and Commands where we use the git extension to get the codebase name.
 *
 * Initializes the Git API by activating the Git extension and getting the API instance.
 * Also sets up the .codyignore handler.
 */
let vscodeGitAPI;
async function gitAPIinit() {
    const extension = vscode.extensions.getExtension('vscode.git');
    // Initializes the Git API by activating the Git extension and getting the API instance.
    // Sets up the .codyignore handler.
    function init() {
        if (!vscodeGitAPI && extension?.isActive) {
            (0, cody_ignore_1.setUpCodyIgnore)();
            if (test_support_1.TestSupport.instance) {
                test_support_1.TestSupport.instance.ignoreHelper.set(cody_shared_1.ignores);
            }
            // This throws error if the git extension is disabled
            vscodeGitAPI = extension.exports?.getAPI(1);
        }
    }
    // Initialize the git extension if it is available
    try {
        await extension?.activate().then(() => init());
    }
    catch (error) {
        vscodeGitAPI = undefined;
        // Display error message if git extension is disabled
        const errorMessage = `${error}`;
        if (extension?.isActive && errorMessage.includes('Git model not found')) {
            console.warn('Git extension is not available. Please ensure it is enabled for Cody to work properly.');
        }
    }
    // Update vscodeGitAPI when the extension becomes enabled/disabled
    return extension?.exports?.onDidChangeEnablement(enabled => {
        if (enabled) {
            return init();
        }
        vscodeGitAPI = undefined;
    });
}
exports.gitAPIinit = gitAPIinit;
/**
 * Gets the codebase name from a workspace / file URI.
 *
 * Checks if the Git API is initialized, initializes it if not.
 * Gets the Git repository for the given URI.
 * If found, gets the codebase name from the repository.
 * Returns the codebase name, or undefined if not found.
 */
function getCodebaseFromWorkspaceUri(uri) {
    try {
        const repository = vscodeGitAPI?.getRepository(uri);
        if (repository) {
            return getCodebaseNameFromGitRepo(repository);
        }
    }
    catch (error) {
        (0, log_1.logDebug)('repositoryHelper:getCodebaseFromWorkspaceUri', 'error', { verbose: error });
    }
    return undefined;
}
exports.getCodebaseFromWorkspaceUri = getCodebaseFromWorkspaceUri;
// HELPER FUNCTIONS
function getCodebaseNameFromGitRepo(repository) {
    const remoteUrl = repository.state.remotes[0]?.pushUrl || repository.state.remotes[0]?.fetchUrl;
    if (!remoteUrl) {
        return undefined;
    }
    return (0, cody_shared_1.convertGitCloneURLToCodebaseName)(remoteUrl) || undefined;
}
