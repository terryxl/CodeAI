/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ContextGroup, type ContextStatusProvider, type Disposable, type Editor } from '@sourcegraph/cody-shared';
import type { SymfRunner } from '../../local-context/symf';
import type { CodebaseRepoIdMapper } from '../../context/enterprise-context-factory';
interface CodebaseIdentifiers {
    localFolder: vscode.Uri;
    remote?: string;
    remoteRepoId?: string;
    setting?: string;
}
/**
 * Provides and signals updates to the current codebase identifiers to use in the chat panel.
 */
export declare class CodebaseStatusProvider implements vscode.Disposable, ContextStatusProvider {
    private readonly editor;
    private readonly symf;
    private readonly codebaseRepoIdMapper;
    private disposables;
    private eventEmitter;
    private _currentCodebase;
    private symfIndexStatus?;
    constructor(editor: Editor, symf: SymfRunner | null, codebaseRepoIdMapper: CodebaseRepoIdMapper | null);
    dispose(): void;
    onDidChangeStatus(callback: (provider: ContextStatusProvider) => void): Disposable;
    get status(): ContextGroup[];
    private getSymfIndexStatus;
    currentCodebase(): Promise<CodebaseIdentifiers | null>;
    private updateStatus;
    private _updateCodebase_NoFire;
    private _updateSymfStatus_NoFire;
}
export {};
//# sourceMappingURL=CodebaseStatusProvider.d.ts.map