import type { URI } from 'vscode-uri';
import type { ActiveTextEditor, ActiveTextEditorDiagnostic, ActiveTextEditorSelection, ActiveTextEditorSelectionRange, ActiveTextEditorVisibleContent, Editor } from '../editor';
import type { IntentClassificationOption, IntentDetector } from '../intent-detector';
export declare class MockIntentDetector implements IntentDetector {
    private mocks;
    constructor(mocks?: Partial<IntentDetector>);
    isEditorContextRequired(input: string): boolean | Error;
    classifyIntentFromOptions<Intent extends string>(input: string, options: IntentClassificationOption<Intent>[], fallback: Intent): Promise<Intent>;
}
export declare class MockEditor implements Editor {
    private mocks;
    constructor(mocks?: Partial<Editor>);
    getWorkspaceRootUri(): URI | null;
    getActiveTextEditorSelection(): ActiveTextEditorSelection | null;
    getActiveTextEditorSmartSelection(): Promise<ActiveTextEditorSelection | null>;
    getActiveTextEditorSelectionOrEntireFile(): ActiveTextEditorSelection | null;
    getActiveTextEditorSelectionOrVisibleContent(): ActiveTextEditorSelection | null;
    getActiveTextEditorDiagnosticsForRange(range: ActiveTextEditorSelectionRange): ActiveTextEditorDiagnostic[] | null;
    getActiveTextEditor(): ActiveTextEditor | null;
    getActiveTextEditorVisibleContent(): ActiveTextEditorVisibleContent | null;
    showWarningMessage(message: string): Promise<void>;
    getTextEditorContentForFile(uri: URI, range?: ActiveTextEditorSelectionRange): Promise<string | undefined>;
}
export declare const defaultIntentDetector: MockIntentDetector;
export declare const defaultEditor: MockEditor;
//# sourceMappingURL=mocks.d.ts.map