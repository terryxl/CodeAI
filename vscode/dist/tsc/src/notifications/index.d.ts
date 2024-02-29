/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
interface Action {
    label: string;
    onClick: () => Thenable<void>;
}
interface ActionNotification {
    message: string;
    options?: vscode.MessageOptions;
    actions: Action[];
}
/**
 * Displays a VS Code information message with actions.
 */
export declare const showActionNotification: ({ message, options, actions, }: ActionNotification) => Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map