/// <reference types="vscode" />
/**
 * Accepts actions that should block on initialization. If invoked before initialization, queues
 * the actions to be invoked upon initialization.
 */
export declare class InitDoer<R> {
    private onInitTodos;
    private isInitialized;
    signalInitialized(): void;
    do(todo: () => Thenable<R> | R): Thenable<R>;
}
//# sourceMappingURL=InitDoer.d.ts.map