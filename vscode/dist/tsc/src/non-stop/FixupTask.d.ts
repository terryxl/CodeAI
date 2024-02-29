/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ChatEventSource, ContextFile, ContextMessage, EditModel } from '@sourcegraph/cody-shared';
import type { EditIntent, EditMode } from '../edit/types';
import type { Diff } from './diff';
import type { FixupFile } from './FixupFile';
import { CodyTaskState } from './utils';
export type taskID = string;
export declare class FixupTask {
    /**
     * The file that will be updated by Cody with the replacement text at the end of stream
     * This is set by the FixupController when creating the task,
     * and will be updated by the FixupController for tasks using the 'new' mode
     */
    fixupFile: FixupFile;
    readonly instruction: string;
    readonly userContextFiles: ContextFile[];
    readonly intent: EditIntent;
    selectionRange: vscode.Range;
    readonly mode: EditMode;
    readonly model: EditModel;
    source?: ChatEventSource;
    readonly contextMessages?: ContextMessage[];
    destinationFile?: vscode.Uri;
    id: taskID;
    state_: CodyTaskState;
    private stateChanges;
    onDidStateChange: vscode.Event<CodyTaskState>;
    /**
     * The original text that we're working on updating. Set when we start an LLM spin.
     */
    original: string;
    /**
     * The original range that we're working on updating.
     * Used to perform an accurate retry. We cannot use `selectionRange` as that range may expand with the replacement code.
     */
    originalRange: vscode.Range;
    /** The text of the streaming turn of the LLM, if any */
    inProgressReplacement: string | undefined;
    /** The text of the last completed turn of the LLM, if any */
    replacement: string | undefined;
    /** The error attached to the fixup, if any */
    error: Error | undefined;
    /**
     * If text has been received from the LLM and a diff has been computed,
     * it is cached here. Diffs are recomputed lazily and may be stale.
     */
    diff: Diff | undefined;
    /** The number of times we've submitted this to the LLM. */
    spinCount: number;
    /**
     * A callback to skip formatting.
     * We use the users' default editor formatter so it is possible that
     * they may run into an error that we can't anticipate
     */
    formattingResolver: ((value: boolean) => void) | null;
    constructor(
    /**
     * The file that will be updated by Cody with the replacement text at the end of stream
     * This is set by the FixupController when creating the task,
     * and will be updated by the FixupController for tasks using the 'new' mode
     */
    fixupFile: FixupFile, instruction: string, userContextFiles: ContextFile[], intent: EditIntent, selectionRange: vscode.Range, mode: EditMode, model: EditModel, source?: ChatEventSource, contextMessages?: ContextMessage[], destinationFile?: vscode.Uri);
    /**
     * Sets the task state. Checks the state transition is valid.
     */
    set state(state: CodyTaskState);
    /**
     * Gets the state of the fixup task.
     *
     * @returns The current state of the fixup task.
     */
    get state(): CodyTaskState;
}
//# sourceMappingURL=FixupTask.d.ts.map