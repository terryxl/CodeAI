/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ChatEventSource, type ContextFile, type ContextMessage, type EditModel } from '@sourcegraph/cody-shared';
import type { EditIntent, EditMode } from '../edit/types';
import type { FixupFile } from './FixupFile';
import { FixupTask, type taskID } from './FixupTask';
import type { FixupFileCollection, FixupIdleTaskRunner, FixupTextChanged } from './roles';
import type { AuthProvider } from '../services/AuthProvider';
export declare class FixupController implements FixupFileCollection, FixupIdleTaskRunner, FixupTextChanged, vscode.Disposable {
    private readonly authProvider;
    private tasks;
    private readonly files;
    private readonly editObserver;
    private readonly scheduler;
    private readonly decorator;
    private readonly codelenses;
    private readonly contentStore;
    private _disposables;
    constructor(authProvider: AuthProvider);
    tasksForFile(file: FixupFile): FixupTask[];
    maybeFileForUri(uri: vscode.Uri): FixupFile | undefined;
    scheduleIdle<T>(callback: () => T): Promise<T>;
    promptUserForTask(document: vscode.TextDocument, range: vscode.Range, expandedRange: vscode.Range | undefined, mode: EditMode, model: EditModel, intent: EditIntent, contextMessages: ContextMessage[], source: ChatEventSource): Promise<FixupTask | null>;
    createTask(document: vscode.TextDocument, instruction: string, userContextFiles: ContextFile[], selectionRange: vscode.Range, intent: EditIntent, mode: EditMode, model: EditModel, source?: ChatEventSource, contextMessages?: ContextMessage[], destinationFile?: vscode.Uri): Promise<FixupTask>;
    apply(id: taskID): Promise<void>;
    private applicableDiffOrRespin;
    private scheduleRespin;
    private logTaskCompletion;
    private streamTask;
    private applyTask;
    private replaceEdit;
    private insertEdit;
    private formatEdit;
    private notifyTaskComplete;
    private cancel;
    cancelTask(task: FixupTask): void;
    private accept;
    private undo;
    /**
     * Reverts an applied fixup task by replacing the edited code range with the original code.
     *
     * TODO: It is possible the original code is out of date if the user edited it whilst the fixup was running.
     * Handle this case better. Possibly take a copy of the previous code just before the fixup is applied.
     */
    private undoTask;
    error(id: taskID, error: Error): void;
    private showError;
    private skipFormatting;
    private discard;
    didReceiveFixupInsertion(id: string, text: string, state: 'streaming' | 'complete'): Promise<void>;
    didReceiveFixupText(id: string, text: string, state: 'streaming' | 'complete'): Promise<void>;
    /**
     * Update the task's fixup file and selection range with the new info,
     * and then task mode to "insert".
     *
     * NOTE: Currently used for /test command only.
     */
    didReceiveNewFileRequest(id: string, newFileUri: vscode.Uri): Promise<void>;
    textDidChange(task: FixupTask): void;
    rangeDidChange(task: FixupTask): void;
    private needsDiffUpdate_;
    private needsEditor_;
    private didChangeVisibleTextEditors;
    private updateDiffs;
    private didUpdateDiff;
    private diff;
    retry(id: taskID): Promise<void>;
    private setTaskState;
    private getNearestTask;
    private reset;
    dispose(): void;
}
//# sourceMappingURL=FixupController.d.ts.map