/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ChatClient } from '@sourcegraph/cody-shared';
import type { ContextProvider } from '../chat/ContextProvider';
import type { GhostHintDecorator } from '../commands/GhostHintDecorator';
import type { VSCodeEditor } from '../editor/vscode-editor';
import type { FixupTask } from '../non-stop/FixupTask';
import type { ExecuteEditArguments } from './execute';
import { EditProvider } from './provider';
import type { AuthProvider } from '../services/AuthProvider';
import type { AuthStatus } from '../chat/protocol';
export interface EditManagerOptions {
    editor: VSCodeEditor;
    chat: ChatClient;
    contextProvider: ContextProvider;
    ghostHintDecorator: GhostHintDecorator;
    authProvider: AuthProvider;
}
export declare class EditManager implements vscode.Disposable {
    options: EditManagerOptions;
    private controller;
    private disposables;
    private editProviders;
    private models;
    constructor(options: EditManagerOptions);
    syncAuthStatus(authStatus: AuthStatus): void;
    executeEdit(args?: ExecuteEditArguments): Promise<FixupTask | undefined>;
    getProviderForTask(task: FixupTask): EditProvider;
    removeProviderForTask(task: FixupTask): void;
    dispose(): void;
}
//# sourceMappingURL=manager.d.ts.map