export class NoopEditor {
    getWorkspaceRootUri() {
        return null;
    }
    getActiveTextEditor() {
        return null;
    }
    getActiveTextEditorSelection() {
        return null;
    }
    getActiveTextEditorSmartSelection() {
        return Promise.resolve(null);
    }
    getActiveTextEditorSelectionOrEntireFile() {
        return null;
    }
    getActiveTextEditorSelectionOrVisibleContent() {
        return null;
    }
    getActiveTextEditorDiagnosticsForRange() {
        return null;
    }
    getActiveTextEditorVisibleContent() {
        return null;
    }
    getTextEditorContentForFile(_uri, _range) {
        return Promise.resolve(undefined);
    }
    showWarningMessage(_message) {
        return Promise.resolve();
    }
}
//# sourceMappingURL=index.js.map