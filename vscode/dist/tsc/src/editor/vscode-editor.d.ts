/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ActiveTextEditor, type ActiveTextEditorDiagnostic, type ActiveTextEditorSelection, type ActiveTextEditorSelectionRange, type ActiveTextEditorVisibleContent, type Editor } from '@sourcegraph/cody-shared';
export declare class VSCodeEditor implements Editor {
    constructor();
    getWorkspaceRootUri(): vscode.Uri | null;
    getActiveTextEditor(): ActiveTextEditor | null;
    private getActiveTextEditorInstance;
    getActiveTextEditorSelection(): ActiveTextEditorSelection | null;
    /**
     * Gets the current smart selection for the active text editor.
     *
     * Checks if there is an existing selection and returns that if it exists.
     * Otherwise tries to get the folding range containing the cursor position.
     *
     * Returns null if no selection can be determined.
     * @returns The smart selection for the active editor, or null if none can be determined.
     */
    getActiveTextEditorSmartSelection(): Promise<ActiveTextEditorSelection | null>;
    getActiveTextEditorSelectionOrEntireFile(): ActiveTextEditorSelection | null;
    getActiveTextEditorSelectionOrVisibleContent(): ActiveTextEditorSelection | null;
    getTextEditorContentForFile(fileUri: vscode.Uri, selectionRange?: ActiveTextEditorSelectionRange): Promise<string | undefined>;
    private getActiveTextEditorDiagnosticType;
    getActiveTextEditorDiagnosticsForRange({ start, end, }: ActiveTextEditorSelectionRange): ActiveTextEditorDiagnostic[] | null;
    private createActiveTextEditorSelection;
    getActiveTextEditorVisibleContent(): ActiveTextEditorVisibleContent | null;
    createWorkspaceFile(content: string, uri?: vscode.Uri): Promise<void>;
    showWarningMessage(message: string): Promise<void>;
}
//# sourceMappingURL=vscode-editor.d.ts.map