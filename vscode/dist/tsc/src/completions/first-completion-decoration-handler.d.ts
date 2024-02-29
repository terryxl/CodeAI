import type { RequestParams } from './request-manager';
/**
 * Handles showing an in-editor decoration when a first completion is accepted.
 */
export declare class FirstCompletionDecorationHandler {
    /**
     * Duration to show decoration before automatically hiding.
     *
     * Modifying the document will also immediately hide.
     */
    private static readonly decorationDurationMilliseconds;
    /**
     * A subscription watching for file changes to automatically hide the decoration.
     *
     * This subscription will be cancelled once the decoration is hidden (for any reason).
     */
    private editorChangeSubscription;
    /**
     * A timer to hide the decoration automatically.
     */
    private hideTimer;
    private readonly decorationType;
    /**
     * Shows the decoration if the editor is still active.
     */
    show(request: RequestParams): void;
    /**
     * Hides the decoration and clears any active subscription/timeout.
     */
    private hide;
}
//# sourceMappingURL=first-completion-decoration-handler.d.ts.map