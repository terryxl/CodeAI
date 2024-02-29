/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { FixupTask } from '../FixupTask';
import type { FixupFileCollection } from '../roles';
import type { FixupFile } from '../FixupFile';
export declare class FixupCodeLenses implements vscode.CodeLensProvider {
    private readonly files;
    private taskLenses;
    private _disposables;
    private _onDidChangeCodeLenses;
    readonly onDidChangeCodeLenses: vscode.Event<void>;
    /**
     * Create a code lens provider
     */
    constructor(files: FixupFileCollection);
    /**
     * Gets the code lenses for the specified document.
     */
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]>;
    didUpdateTask(task: FixupTask): void;
    didDeleteTask(task: FixupTask): void;
    private removeLensesFor;
    /**
     * For a set of active files, check to see if any tasks within these files are currently actionable.
     * If they are, enable the code lens keyboard shortcuts in the editor.
     */
    updateKeyboardShortcutEnablement(activeFiles: FixupFile[]): void;
    private notifyCodeLensesChanged;
    /**
     * Dispose the disposables
     */
    dispose(): void;
}
//# sourceMappingURL=provider.d.ts.map