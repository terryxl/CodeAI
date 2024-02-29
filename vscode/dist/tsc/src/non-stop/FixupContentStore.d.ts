/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
/**
 * Stores the content of the documents that Cody is about to perform fix up for the source control diff
 */
export declare class ContentProvider implements vscode.TextDocumentContentProvider, vscode.Disposable {
    private contentStore;
    private tasksByFilePath;
    private _onDidChange;
    private _disposables;
    constructor();
    provideTextDocumentContent(uri: vscode.Uri): string | null;
    set(id: string, docUri: vscode.Uri): Promise<void>;
    delete(id: string): void;
    private deleteByFilePath;
    get onDidChange(): vscode.Event<vscode.Uri>;
    dispose(): void;
}
//# sourceMappingURL=FixupContentStore.d.ts.map