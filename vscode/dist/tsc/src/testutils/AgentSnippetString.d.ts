/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
export declare class AgentSnippetString implements vscode.SnippetString {
    value: string;
    constructor(value?: string);
    appendText(string: string): vscode.SnippetString;
    appendTabstop(number?: number | undefined): vscode.SnippetString;
    appendPlaceholder(value: string | ((snippet: vscode.SnippetString) => any), number?: number | undefined): vscode.SnippetString;
    appendChoice(values: readonly string[], number?: number | undefined): vscode.SnippetString;
    appendVariable(name: string, defaultValue: string | ((snippet: vscode.SnippetString) => any)): vscode.SnippetString;
}
//# sourceMappingURL=AgentSnippetString.d.ts.map