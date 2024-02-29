/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type CompletionAnalyticsID } from './logger';
export declare class PersistenceTracker implements vscode.Disposable {
    private disposables;
    private managedTimeouts;
    private trackedCompletions;
    constructor(workspace?: Pick<typeof vscode.workspace, 'onDidChangeTextDocument' | 'onDidRenameFiles' | 'onDidDeleteFiles'>);
    track({ id, insertedAt, insertText, insertRange, document, }: {
        id: CompletionAnalyticsID;
        insertedAt: number;
        insertText: string;
        insertRange: vscode.Range;
        document: vscode.TextDocument;
    }): void;
    private enqueueMeasure;
    private measure;
    private onDidChangeTextDocument;
    private onDidRenameFiles;
    private onDidDeleteFiles;
    dispose(): void;
}
//# sourceMappingURL=persistence-tracker.d.ts.map