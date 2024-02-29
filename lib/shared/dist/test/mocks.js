export class MockIntentDetector {
    mocks;
    constructor(mocks = {}) {
        this.mocks = mocks;
    }
    isEditorContextRequired(input) {
        return this.mocks.isEditorContextRequired?.(input) ?? false;
    }
    classifyIntentFromOptions(input, options, fallback) {
        return Promise.resolve(fallback);
    }
}
export class MockEditor {
    mocks;
    constructor(mocks = {}) {
        this.mocks = mocks;
    }
    getWorkspaceRootUri() {
        return this.mocks.getWorkspaceRootUri?.() ?? null;
    }
    getActiveTextEditorSelection() {
        return this.mocks.getActiveTextEditorSelection?.() ?? null;
    }
    getActiveTextEditorSmartSelection() {
        return this.mocks.getActiveTextEditorSmartSelection?.() ?? Promise.resolve(null);
    }
    getActiveTextEditorSelectionOrEntireFile() {
        return this.mocks.getActiveTextEditorSelection?.() ?? null;
    }
    getActiveTextEditorSelectionOrVisibleContent() {
        return this.mocks.getActiveTextEditorSelection?.() ?? null;
    }
    getActiveTextEditorDiagnosticsForRange(range) {
        return this.mocks.getActiveTextEditorDiagnosticsForRange?.(range) ?? null;
    }
    getActiveTextEditor() {
        return this.mocks.getActiveTextEditor?.() ?? null;
    }
    getActiveTextEditorVisibleContent() {
        return this.mocks.getActiveTextEditorVisibleContent?.() ?? null;
    }
    showWarningMessage(message) {
        return this.mocks.showWarningMessage?.(message) ?? Promise.resolve();
    }
    async getTextEditorContentForFile(uri, range) {
        return this.mocks.getTextEditorContentForFile?.(uri, range) ?? Promise.resolve(undefined);
    }
}
export const defaultIntentDetector = new MockIntentDetector();
export const defaultEditor = new MockEditor();
//# sourceMappingURL=mocks.js.map