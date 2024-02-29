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
exports.getEditor = exports.resetActiveEditor = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
/**
 * This returns the current active text editor instance if available,
 * along with a boolean indicating if the text editor is on the Cody ignored list.
 * Returns undefined if no editor is active.
 *
 * NOTE: ALL USERS of chat interface in VS Code should use this to get the correct Active Editor instead of using
 * 'vscode.window.activeTextEditor' as this handles cases where the activeTextEditor API will always return
 * 'undefined' when user is focused on the webview chat panel.
 *
 * NOTE: Users that operate within an actual text editor (non-webview panels) do not need to use this API as calling
 * 'vscode.window.activeTextEditor' from the text editor will always return the correct active editor.
 */
let lastActiveTextEditor = { active: undefined, ignored: false };
// Used for testing purposes
function resetActiveEditor() {
    lastActiveTextEditor = { active: undefined, ignored: false };
}
exports.resetActiveEditor = resetActiveEditor;
// Support file, untitled, and notebooks
const validFileSchemes = new Set(['file', 'untitled', 'vscode-notebook', 'vscode-notebook-cell']);
// When the webview panel is focused, calling activeTextEditor will return undefined.
// This allows us to keep using the last active editor before the webview panel became the active editor
function getEditor() {
    // If there is no visible text editors, then we don't have an active editor
    const activeEditors = vscode.window.visibleTextEditors;
    if (!activeEditors.length) {
        lastActiveTextEditor = { active: undefined, ignored: false };
        return lastActiveTextEditor;
    }
    // When the webview panel is focused, calling activeTextEditor will return undefined.
    // This allows us to get the active editor before the webview panel is focused.
    const get = () => {
        // Check if the active editor is:
        // a. a file that cody supports
        // b. a file that is ignored by Cody
        const activeEditor = vscode.window.activeTextEditor || vscode.window.visibleTextEditors[0];
        if (activeEditor?.document.uri.scheme) {
            // Update the lastActiveTextEditor if the active editor is a valid file
            if (validFileSchemes.has(activeEditor.document.uri.scheme)) {
                lastActiveTextEditor.active = activeEditor;
                lastActiveTextEditor.ignored = (0, cody_shared_1.isCodyIgnoredFile)(activeEditor?.document.uri);
            }
        }
        return lastActiveTextEditor;
    };
    return get();
}
exports.getEditor = getEditor;
