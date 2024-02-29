/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export declare class FixupCodeAction implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds: vscode.CodeActionKind[];
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): Promise<vscode.CodeAction[]>;
    private createCommandCodeAction;
    getCodeActionInstruction(code: string, diagnostics: vscode.Diagnostic[]): Promise<string>;
    private getRelatedInformationContext;
}
//# sourceMappingURL=fixup.d.ts.map