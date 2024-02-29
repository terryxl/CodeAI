/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ContextGroup, ContextStatusProvider } from '@sourcegraph/cody-shared';
export declare class ContextStatusAggregator implements vscode.Disposable, ContextStatusProvider {
    private static TAG;
    private disposables;
    private statusEmitter;
    private providerStatusMap;
    private pendingPublish;
    dispose(): void;
    addProvider(provider: ContextStatusProvider): vscode.Disposable;
    private providerDidChangeStatus;
    private publishStatus;
    onDidChangeStatus(callback: (sender: ContextStatusProvider) => void): vscode.Disposable;
    get status(): ContextGroup[];
}
//# sourceMappingURL=enhanced-context-status.d.ts.map