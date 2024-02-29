/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export interface GetItemsResult {
    items: vscode.QuickPickItem[];
    activeItem?: vscode.QuickPickItem;
}
interface QuickPickConfiguration {
    title: string;
    placeHolder: string;
    onDidAccept: (item?: vscode.QuickPickItem) => void;
    onDidChangeActive?: (items: readonly vscode.QuickPickItem[]) => void;
    onDidChangeValue?: (value: string) => void;
    onDidHide?: () => void;
    getItems: () => GetItemsResult | Promise<GetItemsResult>;
    value?: string;
    buttons?: vscode.QuickInputButton[];
    onDidTriggerButton?: (target: vscode.QuickInputButton) => void;
}
export interface QuickPick {
    input: vscode.QuickPick<vscode.QuickPickItem>;
    render: (title: string, value: string) => void;
}
export declare const createQuickPick: ({ title, placeHolder, onDidAccept, onDidChangeActive, onDidChangeValue, onDidHide, onDidTriggerButton, getItems, buttons, value, }: QuickPickConfiguration) => QuickPick;
export {};
//# sourceMappingURL=quick-pick.d.ts.map