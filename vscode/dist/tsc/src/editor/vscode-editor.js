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
exports.VSCodeEditor = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("./active-editor");
const code_lenses_1 = require("../commands/services/code-lenses");
const utils_1 = require("./utils");
class VSCodeEditor {
    constructor() {
        /**
         * Callback function that calls getEditor().active whenever the visible text editors change in VS Code.
         * This allows tracking of the currently active text editor even when focus moves to something like a webview panel.
         */
        vscode.window.onDidChangeActiveTextEditor(() => (0, active_editor_1.getEditor)());
        new code_lenses_1.CommandCodeLenses();
    }
    getWorkspaceRootUri() {
        const uri = (0, active_editor_1.getEditor)().active?.document?.uri;
        if (uri) {
            const wsFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (wsFolder) {
                return wsFolder.uri;
            }
        }
        return vscode.workspace.workspaceFolders?.[0]?.uri ?? null;
    }
    getActiveTextEditor() {
        const activeEditor = this.getActiveTextEditorInstance();
        if (!activeEditor) {
            return null;
        }
        const documentUri = activeEditor.document.uri;
        const documentText = activeEditor.document.getText();
        const documentSelection = activeEditor.selection;
        return {
            content: documentText,
            fileUri: documentUri,
            selectionRange: documentSelection.isEmpty ? undefined : documentSelection,
            ignored: (0, cody_shared_1.isCodyIgnoredFile)(activeEditor.document.uri),
        };
    }
    getActiveTextEditorInstance() {
        const editor = (0, active_editor_1.getEditor)();
        const activeEditor = editor.ignored ? null : (0, active_editor_1.getEditor)().active;
        return activeEditor ?? null;
    }
    getActiveTextEditorSelection() {
        const activeEditor = this.getActiveTextEditorInstance();
        if (!activeEditor) {
            return null;
        }
        const selection = activeEditor.selection;
        if (!selection || selection?.start.isEqual(selection.end)) {
            return null;
        }
        return this.createActiveTextEditorSelection(activeEditor, selection);
    }
    /**
     * Gets the current smart selection for the active text editor.
     *
     * Checks if there is an existing selection and returns that if it exists.
     * Otherwise tries to get the folding range containing the cursor position.
     *
     * Returns null if no selection can be determined.
     * @returns The smart selection for the active editor, or null if none can be determined.
     */
    async getActiveTextEditorSmartSelection() {
        const activeEditor = this.getActiveTextEditorInstance();
        if (!activeEditor) {
            return null;
        }
        const selection = activeEditor.selection;
        if (!selection.start) {
            return null;
        }
        if (selection && !selection?.start.isEqual(selection.end)) {
            return this.createActiveTextEditorSelection(activeEditor, selection);
        }
        // Get selection for current folding range of cursor
        const activeCursorPosition = selection.start.line;
        const foldingRange = await (0, utils_1.getSmartSelection)(activeEditor.document.uri, activeCursorPosition);
        if (foldingRange) {
            return this.createActiveTextEditorSelection(activeEditor, foldingRange);
        }
        return null;
    }
    getActiveTextEditorSelectionOrEntireFile() {
        const activeEditor = this.getActiveTextEditorInstance();
        if (!activeEditor) {
            return null;
        }
        let selection = activeEditor.selection;
        if (!selection || selection.isEmpty) {
            selection = new vscode.Selection(0, 0, activeEditor.document.lineCount, 0);
        }
        return this.createActiveTextEditorSelection(activeEditor, selection);
    }
    getActiveTextEditorSelectionOrVisibleContent() {
        const activeEditor = this.getActiveTextEditorInstance();
        if (!activeEditor) {
            return null;
        }
        let selection = activeEditor.selection;
        if (selection && !selection.isEmpty) {
            return this.createActiveTextEditorSelection(activeEditor, selection);
        }
        const visibleRanges = activeEditor.visibleRanges;
        if (visibleRanges.length === 0) {
            return null;
        }
        const visibleRange = visibleRanges[0];
        selection = new vscode.Selection(visibleRange.start.line, 0, visibleRange.end.line + 1, 0);
        if (!selection || selection.isEmpty) {
            return null;
        }
        return this.createActiveTextEditorSelection(activeEditor, selection);
    }
    async getTextEditorContentForFile(fileUri, selectionRange) {
        if (!fileUri) {
            return undefined;
        }
        let range;
        if (selectionRange) {
            const startLine = selectionRange?.start?.line;
            let endLine = selectionRange?.end?.line;
            if (startLine === endLine) {
                endLine++;
            }
            range = new vscode.Range(startLine, 0, endLine, 0);
        }
        // Get the text from document by file Uri
        const vscodeUri = vscode.Uri.file(fileUri.fsPath);
        const doc = await vscode.workspace.openTextDocument(vscodeUri);
        return doc.getText(range);
    }
    getActiveTextEditorDiagnosticType(severity) {
        switch (severity) {
            case vscode.DiagnosticSeverity.Error:
                return 'error';
            case vscode.DiagnosticSeverity.Warning:
                return 'warning';
            case vscode.DiagnosticSeverity.Information:
                return 'information';
            case vscode.DiagnosticSeverity.Hint:
                return 'hint';
        }
    }
    getActiveTextEditorDiagnosticsForRange({ start, end, }) {
        const activeEditor = this.getActiveTextEditorInstance();
        if (!activeEditor) {
            return null;
        }
        const diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
        const selectionRange = new vscode.Range(new vscode.Position(start.line, start.character), new vscode.Position(end.line, end.character));
        return diagnostics
            .filter(diagnostic => selectionRange.contains(diagnostic.range))
            .map(({ message, range, severity }) => ({
            type: this.getActiveTextEditorDiagnosticType(severity),
            range,
            text: activeEditor.document.getText(range),
            message,
        }));
    }
    createActiveTextEditorSelection(activeEditor, selection) {
        const precedingText = activeEditor.document.getText(new vscode.Range(new vscode.Position(Math.max(0, selection.start.line - cody_shared_1.SURROUNDING_LINES), 0), selection.start));
        const followingText = activeEditor.document.getText(new vscode.Range(selection.end, new vscode.Position(selection.end.line + cody_shared_1.SURROUNDING_LINES, 0)));
        return {
            fileUri: activeEditor.document.uri,
            selectedText: activeEditor.document.getText(selection),
            precedingText,
            followingText,
            selectionRange: selection,
        };
    }
    getActiveTextEditorVisibleContent() {
        const activeEditor = this.getActiveTextEditorInstance();
        if (!activeEditor) {
            return null;
        }
        const visibleRanges = activeEditor.visibleRanges;
        if (visibleRanges.length === 0) {
            return null;
        }
        const visibleRange = visibleRanges[0];
        const content = activeEditor.document.getText(new vscode.Range(new vscode.Position(visibleRange.start.line, 0), new vscode.Position(visibleRange.end.line + 1, 0)));
        return {
            fileUri: activeEditor.document.uri,
            content,
        };
    }
    async createWorkspaceFile(content, uri) {
        const fileUri = uri ?? (await vscode.window.showSaveDialog());
        if (!fileUri) {
            return;
        }
        try {
            const workspaceEditor = new vscode.WorkspaceEdit();
            workspaceEditor.createFile(fileUri, { ignoreIfExists: true });
            // replace whole file with new content
            const range = new vscode.Range(0, 0, 9999, 0);
            workspaceEditor.replace(fileUri, range, content.trimEnd());
            await vscode.workspace.applyEdit(workspaceEditor);
            void vscode.commands.executeCommand('vscode.open', fileUri);
        }
        catch {
            const errorMsg = 'Failed to create new file.';
            await vscode.window.showInformationMessage(errorMsg);
        }
    }
    async showWarningMessage(message) {
        await vscode.window.showWarningMessage(message);
    }
}
exports.VSCodeEditor = VSCodeEditor;
