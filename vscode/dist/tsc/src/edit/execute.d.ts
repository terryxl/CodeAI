/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ChatEventSource, ContextFile, ContextMessage, EditModel } from '@sourcegraph/cody-shared';
import type { EditIntent, EditMode } from './types';
import type { FixupTask } from '../non-stop/FixupTask';
export interface ExecuteEditArguments {
    configuration?: {
        document?: vscode.TextDocument;
        instruction?: string;
        userContextFiles?: ContextFile[];
        contextMessages?: ContextMessage[];
        intent?: EditIntent;
        range?: vscode.Range;
        mode?: EditMode;
        model?: EditModel;
        destinationFile?: vscode.Uri;
    };
    source?: ChatEventSource;
}
/**
 * Wrapper around the `edit-code` command that can be used anywhere but with better type-safety.
 */
export declare const executeEdit: (args: ExecuteEditArguments) => Promise<FixupTask | undefined>;
//# sourceMappingURL=execute.d.ts.map