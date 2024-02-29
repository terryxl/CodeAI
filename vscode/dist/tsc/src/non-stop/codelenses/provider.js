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
exports.FixupCodeLenses = void 0;
const vscode = __importStar(require("vscode"));
const items_1 = require("./items");
const utils_1 = require("../utils");
const constants_1 = require("./constants");
class FixupCodeLenses {
    files;
    taskLenses = new Map();
    _disposables = [];
    _onDidChangeCodeLenses = new vscode.EventEmitter();
    onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    /**
     * Create a code lens provider
     */
    constructor(files) {
        this.files = files;
        this.provideCodeLenses = this.provideCodeLenses.bind(this);
        this._disposables.push(vscode.languages.registerCodeLensProvider('*', this));
    }
    /**
     * Gets the code lenses for the specified document.
     */
    provideCodeLenses(document, token) {
        const file = this.files.maybeFileForUri(document.uri);
        if (!file) {
            return [];
        }
        const lenses = [];
        for (const task of this.files.tasksForFile(file)) {
            lenses.push(...(this.taskLenses.get(task) || []));
        }
        return lenses;
    }
    didUpdateTask(task) {
        this.updateKeyboardShortcutEnablement([task.fixupFile]);
        if (task.state === utils_1.CodyTaskState.finished) {
            this.removeLensesFor(task);
            return;
        }
        this.taskLenses.set(task, (0, items_1.getLensesForTask)(task));
        this.notifyCodeLensesChanged();
    }
    didDeleteTask(task) {
        this.updateKeyboardShortcutEnablement([task.fixupFile]);
        this.removeLensesFor(task);
    }
    removeLensesFor(task) {
        if (this.taskLenses.delete(task)) {
            // TODO: Clean up the fixup file when there are no remaining code lenses
            this.notifyCodeLensesChanged();
        }
    }
    /**
     * For a set of active files, check to see if any tasks within these files are currently actionable.
     * If they are, enable the code lens keyboard shortcuts in the editor.
     */
    updateKeyboardShortcutEnablement(activeFiles) {
        const allTasks = activeFiles
            .filter(file => vscode.window.visibleTextEditors.some(editor => editor.document.uri === file.uri))
            .flatMap(file => this.files.tasksForFile(file));
        const hasActionableEdit = allTasks.some(task => constants_1.ALL_ACTIONABLE_TASK_STATES.includes(task.state));
        void vscode.commands.executeCommand('setContext', 'cody.hasActionableEdit', hasActionableEdit);
    }
    notifyCodeLensesChanged() {
        this._onDidChangeCodeLenses.fire();
    }
    /**
     * Dispose the disposables
     */
    dispose() {
        this.taskLenses.clear();
        for (const disposable of this._disposables) {
            disposable.dispose();
        }
        this._disposables = [];
    }
}
exports.FixupCodeLenses = FixupCodeLenses;
