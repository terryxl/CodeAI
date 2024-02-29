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
exports.getOpenTabsUris = exports.getWorkspaceSymbols = exports.getSmartSelection = void 0;
const vscode = __importStar(require("vscode"));
const document_sections_1 = require("./document-sections");
/**
 * Gets the folding range containing the target position to use as a smart selection.
 *
 * This should only be used when there is no existing selection, as a fallback.
 *
 * The smart selection removes the need to manually highlight code before running a command.
 * Instead, this tries to identify the folding range containing the user's cursor to use as the
 * selection range. For example, a docstring can be added to the target folding range when running
 * the /doc command.
 *
 * NOTE: Smart selection should be treated as a fallback, since it guesses the user's intent. A
 * manual selection truly reflects the user's intent and should be preferred when possible. Smart
 * selection can be unreliable in some cases. Callers needing the true selection range should always
 * use the manual selection method to ensure accuracy.
 * @param documentOrUri - The document or the document URI.
 * @param target - The target position in the document.
 * @returns The folding range containing the target position, if one exists. Otherwise returns
 * undefined.
 */
async function getSmartSelection(documentOrUri, target) {
    const document = documentOrUri instanceof vscode.Uri
        ? await vscode.workspace.openTextDocument(documentOrUri)
        : documentOrUri;
    return (0, document_sections_1.getSelectionAroundLine)(document, target);
}
exports.getSmartSelection = getSmartSelection;
/**
 * Searches for workspace symbols matching the given query string.
 * @param query - The search query string.
 * @returns A promise resolving to the array of SymbolInformation objects representing the matched workspace symbols.
 */
async function getWorkspaceSymbols(query = '') {
    return vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', query);
}
exports.getWorkspaceSymbols = getWorkspaceSymbols;
/**
 * Returns an array of URI's for all open editor tabs.
 *
 * Loops through all open tab groups and tabs, collecting the URI
 * of each tab with a 'file' scheme.
 */
function getOpenTabsUris() {
    const uris = [];
    // Get open tabs
    const tabGroups = vscode.window.tabGroups.all;
    const openTabs = tabGroups.flatMap(group => group.tabs.map(tab => tab.input));
    for (const tab of openTabs) {
        // Skip non-file URIs
        if (tab?.uri?.scheme === 'file') {
            uris.push(tab.uri);
        }
    }
    return uris;
}
exports.getOpenTabsUris = getOpenTabsUris;
