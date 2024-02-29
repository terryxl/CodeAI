/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export declare class EditCodeAction implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds: vscode.CodeActionKind[];
    provideCodeActions(document: vscode.TextDocument): vscode.CodeAction[];
    private createGenerateCodeAction;
    private createEditCommandCodeAction;
}
//# sourceMappingURL=edit.d.ts.map