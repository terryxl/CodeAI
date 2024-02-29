/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
export declare class AgentTextEdit implements vscode.TextEdit {
    readonly range: vscode.Range;
    readonly newText: string;
    readonly newEol?: vscode.EndOfLine;
    metadata?: vscode.WorkspaceEditEntryMetadata;
    constructor(range: vscode.Range, newText: string, newEol?: vscode.EndOfLine);
    static replace(range: vscode.Range, newText: string): vscode.TextEdit;
    static insert(position: vscode.Position, newText: string): vscode.TextEdit;
    static delete(range: vscode.Range): vscode.TextEdit;
    static setEndOfLine(eol: vscode.EndOfLine): vscode.TextEdit;
}
//# sourceMappingURL=AgentTextEdit.d.ts.map