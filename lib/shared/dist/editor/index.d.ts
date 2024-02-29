import type { URI } from 'vscode-uri';
export interface ActiveTextEditor {
    content: string;
    fileUri: URI;
    repoName?: string;
    revision?: string;
    selectionRange?: ActiveTextEditorSelectionRange;
    ignored?: boolean;
}
export interface ActiveTextEditorSelectionRange {
    start: {
        line: number;
        character: number;
    };
    end: {
        line: number;
        character: number;
    };
}
export interface ActiveTextEditorSelection {
    fileUri: URI;
    repoName?: string;
    revision?: string;
    precedingText: string;
    selectedText: string;
    followingText: string;
    selectionRange?: ActiveTextEditorSelectionRange | null;
}
export type ActiveTextEditorDiagnosticType = 'error' | 'warning' | 'information' | 'hint';
export interface ActiveTextEditorDiagnostic {
    type: ActiveTextEditorDiagnosticType;
    range: ActiveTextEditorSelectionRange;
    text: string;
    message: string;
}
export interface ActiveTextEditorVisibleContent {
    content: string;
    fileUri: URI;
    repoName?: string;
    revision?: string;
}
export interface Editor {
    /** The URI of the workspace root. */
    getWorkspaceRootUri(): URI | null;
    getActiveTextEditor(): ActiveTextEditor | null;
    getActiveTextEditorSelection(): ActiveTextEditorSelection | null;
    getActiveTextEditorSmartSelection(): Promise<ActiveTextEditorSelection | null>;
    /**
     * Gets the active text editor's selection, or the entire file if the selected range is empty.
     */
    getActiveTextEditorSelectionOrEntireFile(): ActiveTextEditorSelection | null;
    /**
     * Gets the active text editor's selection, or the visible content if the selected range is empty.
     */
    getActiveTextEditorSelectionOrVisibleContent(): ActiveTextEditorSelection | null;
    /**
     * Get diagnostics (errors, warnings, hints) for a range within the active text editor.
     */
    getActiveTextEditorDiagnosticsForRange(range: ActiveTextEditorSelectionRange): ActiveTextEditorDiagnostic[] | null;
    getActiveTextEditorVisibleContent(): ActiveTextEditorVisibleContent | null;
    getTextEditorContentForFile(uri: URI, range?: ActiveTextEditorSelectionRange): Promise<string | undefined>;
    showWarningMessage(message: string): Promise<void>;
}
export declare class NoopEditor implements Editor {
    getWorkspaceRootUri(): URI | null;
    getActiveTextEditor(): ActiveTextEditor | null;
    getActiveTextEditorSelection(): ActiveTextEditorSelection | null;
    getActiveTextEditorSmartSelection(): Promise<ActiveTextEditorSelection | null>;
    getActiveTextEditorSelectionOrEntireFile(): ActiveTextEditorSelection | null;
    getActiveTextEditorSelectionOrVisibleContent(): ActiveTextEditorSelection | null;
    getActiveTextEditorDiagnosticsForRange(): ActiveTextEditorDiagnostic[] | null;
    getActiveTextEditorVisibleContent(): ActiveTextEditorVisibleContent | null;
    getTextEditorContentForFile(_uri: URI, _range?: ActiveTextEditorSelectionRange): Promise<string | undefined>;
    showWarningMessage(_message: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map