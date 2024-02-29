/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode_types from 'vscode';
/**
 * Implementation of `vscode.EventEmitter` with a single modification: there's
 * an additional `cody_fireAsync()` method to await on fired events. This functionality
 * is necessary for the agent to be able to reliably know when configuration changes
 * have finished propagating through the extension.
 */
export declare class AgentEventEmitter<T> implements vscode_types.EventEmitter<T> {
    on: () => undefined;
    constructor();
    private readonly listeners;
    event: vscode_types.Event<T>;
    fire(data: T): void;
    /**
     * Custom extension of the VS Code API to make it possible to `await` on the
     * result of `EventEmitter.fire()`.  Most event listeners return a
     * meaningful `Promise` that is discarded in the signature of the `fire()`
     * function.  Being able to await on returned promise makes it possible to
     * write more robust tests because we don't need to rely on magic timeouts.
     */
    cody_fireAsync(data: T): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=AgentEventEmitter.d.ts.map