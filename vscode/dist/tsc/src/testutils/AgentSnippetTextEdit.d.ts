/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
export declare class AgentSnippetTextEdit implements vscode.SnippetTextEdit {
    range: vscode.Range;
    snippet: vscode.SnippetString;
    constructor(range: vscode.Range, snippet: vscode.SnippetString);
    static replace(range: Range, snippet: vscode.SnippetString): vscode.SnippetTextEdit;
    static insert(position: vscode.Position, snippet: vscode.SnippetString): vscode.SnippetTextEdit;
}
//# sourceMappingURL=AgentSnippetTextEdit.d.ts.map