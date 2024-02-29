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
exports.getEditorIndentString = exports.getEditorTabSize = exports.getEditorInsertSpaces = void 0;
const vscode = __importStar(require("vscode"));
function getEditorInsertSpaces(uri) {
    const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri === uri);
    if (!editor) {
        // Default to the same as VS Code default
        return true;
    }
    const { languageId } = editor.document;
    const languageConfig = vscode.workspace.getConfiguration(`[${languageId}]`, uri);
    const languageSetting = languageConfig.get('editor.insertSpaces');
    // Prefer language specific setting.
    const insertSpaces = languageSetting || editor.options.insertSpaces;
    // This should never happen: "When getting a text editor's options, this property will always be a boolean (resolved)."
    if (typeof insertSpaces === 'string' || insertSpaces === undefined) {
        console.error('Unexpected value when getting "insertSpaces" for the current editor.');
        return true;
    }
    return insertSpaces;
}
exports.getEditorInsertSpaces = getEditorInsertSpaces;
function getEditorTabSize(uri) {
    const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri === uri);
    if (!editor) {
        // Default to the same as VS Code default
        return 4;
    }
    const { languageId } = editor.document;
    const languageConfig = vscode.workspace.getConfiguration(`[${languageId}]`, uri);
    const languageSetting = languageConfig.get('editor.tabSize');
    // Prefer language specific setting.
    const tabSize = languageSetting || editor.options.tabSize;
    // This should never happen: "When getting a text editor's options, this property will always be a number (resolved)."
    if (typeof tabSize === 'string' || tabSize === undefined) {
        console.error('Unexpected value when getting "tabSize" for the current editor.');
        return 4;
    }
    return tabSize;
}
exports.getEditorTabSize = getEditorTabSize;
function getEditorIndentString(uri) {
    const insertSpaces = getEditorInsertSpaces(uri);
    const tabSize = getEditorTabSize(uri);
    return insertSpaces ? ' '.repeat(tabSize) : '\t';
}
exports.getEditorIndentString = getEditorIndentString;
