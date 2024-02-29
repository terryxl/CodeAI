/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { SymfRunner } from '../local-context/symf';
export declare class SearchViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
    private extensionUri;
    private symfRunner;
    private disposables;
    private webview?;
    private cancellationManager;
    private indexManager;
    constructor(extensionUri: vscode.Uri, symfRunner: SymfRunner);
    dispose(): void;
    initialize(): void;
    resolveWebviewView(webviewView: vscode.WebviewView): Promise<void>;
    private onDidReceiveMessage;
    private onDidReceiveQuery;
}
//# sourceMappingURL=SearchViewProvider.d.ts.map