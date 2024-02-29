/**
 * Create a new AbortController that also aborts the given {@link signal} is aborted.
 *
 * This can be used for a operation that is controlled by an {@link AbortSignal} from its caller but
 * that also needs to create its own {@link AbortController} to control its own operations.
 */
export declare function dependentAbortController(signal?: AbortSignal): AbortController;
/**
 * Helper function to add an `abort` event listener (and properly remove it).
 */
export declare function onAbort(signal: AbortSignal | undefined, handler: () => void): void;
//# sourceMappingURL=abortController.d.ts.map