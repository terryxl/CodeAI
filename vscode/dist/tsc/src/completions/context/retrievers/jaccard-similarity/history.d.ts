/// <reference path="../../../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
interface HistoryItem {
    document: Pick<vscode.TextDocument, 'uri' | 'languageId'>;
}
export interface DocumentHistory {
    addItem(newItem: HistoryItem): void;
    lastN(n: number, languageId?: string, ignoreUris?: vscode.Uri[]): HistoryItem[];
}
export declare class VSCodeDocumentHistory implements DocumentHistory, vscode.Disposable {
    private window;
    private history;
    private subscriptions;
    constructor(register?: () => vscode.Disposable | null);
    dispose(): void;
    addItem(newItem: HistoryItem): void;
    /**
     * Returns the last n items of history in reverse chronological order (latest item at the front)
     */
    lastN(n: number, languageId?: string, ignoreUris?: vscode.Uri[]): HistoryItem[];
}
export {};
//# sourceMappingURL=history.d.ts.map