/**
 * Create a new AbortController that also aborts the given {@link signal} is aborted.
 *
 * This can be used for a operation that is controlled by an {@link AbortSignal} from its caller but
 * that also needs to create its own {@link AbortController} to control its own operations.
 */
export function dependentAbortController(signal) {
    const controller = new AbortController();
    if (signal?.aborted) {
        controller.abort();
    }
    else if (signal) {
        const abortHandler = () => {
            signal.removeEventListener('abort', abortHandler);
            controller.abort();
        };
        signal.addEventListener('abort', abortHandler);
    }
    return controller;
}
/**
 * Helper function to add an `abort` event listener (and properly remove it).
 */
export function onAbort(signal, handler) {
    if (signal) {
        const handlerWithRemoval = () => {
            signal.removeEventListener('abort', handlerWithRemoval);
            handler();
        };
        signal.addEventListener('abort', handlerWithRemoval);
    }
}
//# sourceMappingURL=abortController.js.map