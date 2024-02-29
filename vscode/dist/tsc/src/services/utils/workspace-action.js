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
exports.openExternalLinks = exports.openLocalFileWithRange = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Open file in editor (assumed filePath is absolute) and optionally reveal a specific range
 */
async function openLocalFileWithRange(filePath, range) {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    const selection = range
        ? new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character)
        : range;
    await vscode.window.showTextDocument(doc, { selection });
}
exports.openLocalFileWithRange = openLocalFileWithRange;
/**
 * Open external links
 */
async function openExternalLinks(uri) {
    try {
        await vscode.env.openExternal(vscode.Uri.parse(uri));
    }
    catch (error) {
        throw new Error(`Failed to open file: ${error}`);
    }
}
exports.openExternalLinks = openExternalLinks;
