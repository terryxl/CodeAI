/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export declare class DocumentCodeAction implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds: vscode.CodeActionKind[];
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[];
    private createCommandCodeAction;
    /**
     * Edit instruction for generating documentation.
     * Note: This is a clone of the hard coded instruction in `lib/shared/src/chat/prompts/cody.json`.
     * TODO: (umpox) Consider moving top level instructions out of the JSON format.
     */
    private readonly instruction;
}
//# sourceMappingURL=document.d.ts.map