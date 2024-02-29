/**
 * Marks the yielded value as an incomplete response.
 *
 * TODO: migrate to union of multiple `CompletionResponse` types to explicitly document
 * all possible response types.
 */
export var CompletionStopReason;
(function (CompletionStopReason) {
    /**
     * Used to signal to the completion processing code that we're still streaming.
     * Can be removed if we make `CompletionResponse.stopReason` optional. Then
     * `{ stopReason: undefined }` can be used instead.
     */
    CompletionStopReason["StreamingChunk"] = "cody-streaming-chunk";
    CompletionStopReason["RequestAborted"] = "cody-request-aborted";
    CompletionStopReason["RequestFinished"] = "cody-request-finished";
})(CompletionStopReason || (CompletionStopReason = {}));
//# sourceMappingURL=misc.js.map