/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ContextProvider } from '../chat/ContextProvider';
interface CodeActionProviderOptions {
    contextProvider: ContextProvider;
}
export declare class CodeActionProvider implements vscode.Disposable {
    private configurationChangeListener;
    private actionProviders;
    constructor(options: CodeActionProviderOptions);
    private registerCodeActions;
    private addActionProvider;
    dispose(): void;
}
export {};
//# sourceMappingURL=CodeActionProvider.d.ts.map