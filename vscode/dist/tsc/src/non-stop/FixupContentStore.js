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
exports.ContentProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Stores the content of the documents that Cody is about to perform fix up for the source control diff
 */
class ContentProvider {
    // This stores the content of the document for each task ID
    // The content is initialized by the fixup task with the original content
    // and then updated by the fixup task with the replacement content
    contentStore = new Map();
    // This tracks the task IDs belong toe each file path
    tasksByFilePath = new Map();
    _onDidChange = new vscode.EventEmitter();
    _disposables;
    constructor() {
        // TODO: Handle applying fixups to files which are opened and closed.
        // This is tricky because we need to re-sync the range we are tracking
        // when the file is opened.
        this._disposables = vscode.workspace.onDidCloseTextDocument(doc => this.deleteByFilePath(doc.uri.fsPath));
    }
    // Get content from the content store
    provideTextDocumentContent(uri) {
        const id = uri.fragment;
        return this.contentStore.get(id) || null;
    }
    // Add to store - store origin content by fixup task id
    async set(id, docUri) {
        const doc = await vscode.workspace.openTextDocument(docUri);
        this.contentStore.set(id, doc.getText());
        this.tasksByFilePath.set(docUri.fsPath, [...(this.tasksByFilePath.get(docUri.fsPath) || []), id]);
    }
    // Remove by ID
    delete(id) {
        this.contentStore.delete(id);
        // remove task from tasksByFilePath
        for (const [filePath, tasks] of this.tasksByFilePath) {
            const index = tasks.indexOf(id);
            if (index > -1) {
                tasks.splice(index, 1);
            }
            if (tasks.length === 0) {
                this.deleteByFilePath(filePath);
            }
        }
    }
    // Remove by file path
    deleteByFilePath(fileName) {
        const files = this.tasksByFilePath.get(fileName);
        if (!files) {
            return;
        }
        for (const id of files) {
            this.contentStore.delete(id);
        }
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    dispose() {
        this._disposables.dispose();
        this._onDidChange.dispose();
        this.contentStore = new Map();
        this.tasksByFilePath = new Map();
    }
}
exports.ContentProvider = ContentProvider;
