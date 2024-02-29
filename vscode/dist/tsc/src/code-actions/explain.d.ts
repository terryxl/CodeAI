/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export declare class ExplainCodeAction implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds: vscode.CodeActionKind[];
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[];
    private createCommandCodeAction;
    private getCodeActionInstruction;
}
//# sourceMappingURL=explain.d.ts.map