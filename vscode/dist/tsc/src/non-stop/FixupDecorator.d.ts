/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { FixupFile } from './FixupFile';
import type { FixupTask } from './FixupTask';
export declare class FixupDecorator implements vscode.Disposable {
    private decorationCodyConflictMarker_;
    private decorationCodyConflicted_;
    private decorationCodyIncoming_;
    private decorations_;
    constructor();
    dispose(): void;
    didChangeVisibleTextEditors(file: FixupFile, editors: vscode.TextEditor[]): void;
    didUpdateDiff(task: FixupTask): void;
    didCompleteTask(task: FixupTask): void;
    private updateTaskDecorations;
    private didChangeFileDecorations;
    private applyDecorations;
}
//# sourceMappingURL=FixupDecorator.d.ts.map