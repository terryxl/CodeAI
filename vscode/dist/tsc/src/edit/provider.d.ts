import type { FixupController } from '../non-stop/FixupController';
import type { FixupTask } from '../non-stop/FixupTask';
import type { EditManagerOptions } from './manager';
interface EditProviderOptions extends EditManagerOptions {
    task: FixupTask;
    controller: FixupController;
}
export declare class EditProvider {
    config: EditProviderOptions;
    private cancelCompletionCallback;
    private insertionResponse;
    private insertionInProgress;
    private insertionPromise;
    constructor(config: EditProviderOptions);
    startEdit(): Promise<void>;
    abortEdit(): void;
    private handleResponse;
    /**
     * Display an erred codelens to the user on failed fixup apply.
     * Will allow the user to view the error in more detail if needed.
     */
    protected handleError(error: Error): void;
    private handleFixupEdit;
    private handleFixupInsert;
    private processInsertionQueue;
    private handleFileCreationResponse;
}
export {};
//# sourceMappingURL=provider.d.ts.map