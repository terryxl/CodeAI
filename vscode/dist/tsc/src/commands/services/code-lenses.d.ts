/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from "vscode";
/**
 * Adds Code lenses for triggering Command Menu
 */
export declare class CommandCodeLenses implements vscode.CodeLensProvider {
    private isEnabled;
    private addTestEnabled;
    private _disposables;
    private _onDidChangeCodeLenses;
    readonly onDidChangeCodeLenses: vscode.Event<void>;
    constructor();
    /**
     * init
     */
    private init;
    /**
     * Update the configurations
     */
    private updateConfig;
    /**
     * Gets the code lenses for the specified document.
     */
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]>;
    private provideCodeLensesForSymbols;
    /**
     * Handle the code lens click event
     */
    private onCodeLensClick;
    /**
     * Fire an event to notify VS Code that the code lenses have changed.
     */
    fire(): void;
    /**
     * Dispose the disposables
     */
    dispose(): void;
}
//# sourceMappingURL=code-lenses.d.ts.map