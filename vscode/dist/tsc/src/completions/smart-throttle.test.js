"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const smart_throttle_1 = require("./smart-throttle");
const get_inline_completions_1 = require("./get-inline-completions");
const test_helpers_1 = require("./test-helpers");
const get_current_doc_context_1 = require("./get-current-doc-context");
(0, vitest_1.describe)('SmartThrottleService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        service = new smart_throttle_1.SmartThrottleService();
    });
    (0, vitest_1.it)('keeps one start-of-line request per line and immediately starts it', async () => {
        const firstThrottledRequest = await service.throttle(createRequest('█'), get_inline_completions_1.TriggerKind.Automatic);
        // Request is returned immediately
        (0, vitest_1.expect)(firstThrottledRequest?.abortSignal?.aborted).toBe(false);
        vitest_1.vi.advanceTimersByTime(100);
        const secondThrottledRequest = await service.throttle(createRequest('\n█'), get_inline_completions_1.TriggerKind.Automatic);
        // Request is returned immediately
        (0, vitest_1.expect)(secondThrottledRequest?.abortSignal?.aborted).toBe(false);
        // Previous start-of-line request was cancelled
        (0, vitest_1.expect)(firstThrottledRequest?.abortSignal?.aborted).toBe(true);
        // Another request on the same line will not be treated as a start-of-line request
        const thirdThrottledRequest = await service.throttle(createRequest('\n\t█'), get_inline_completions_1.TriggerKind.Manual);
        // Request is returned immediately
        (0, vitest_1.expect)(thirdThrottledRequest?.abortSignal?.aborted).toBe(false);
        // Previous start-of-line request is still running
        (0, vitest_1.expect)(secondThrottledRequest?.abortSignal?.aborted).toBe(false);
        vitest_1.vi.advanceTimersByTime(100);
        // Enqueuing a non start-of-line-request does not cancel the last start-of-line
        const fourthThrottledRequest = service.throttle(createRequest('\tfoo█'), get_inline_completions_1.TriggerKind.Manual);
        (0, vitest_1.expect)(secondThrottledRequest?.abortSignal?.aborted).toBe(false);
        (0, vitest_1.expect)(fourthThrottledRequest).resolves.toMatchObject({
            docContext: { currentLinePrefix: '\tfoo' },
        });
    });
    (0, vitest_1.it)('promotes tail request after timeout', async () => {
        const firstThrottledRequest = await service.throttle(createRequest('f█'), get_inline_completions_1.TriggerKind.Manual);
        const secondThrottledRequest = await service.throttle(createRequest('fo█'), get_inline_completions_1.TriggerKind.Manual);
        // The first promise is promoted so it will not be cancelled and coexist with the
        // tail request
        (0, vitest_1.expect)(firstThrottledRequest?.abortSignal?.aborted).toBe(false);
        (0, vitest_1.expect)(secondThrottledRequest?.abortSignal?.aborted).toBe(false);
        // Enqueuing a third request will cancel the second one
        const thirdThrottledRequest = await service.throttle(createRequest('foo█'), get_inline_completions_1.TriggerKind.Manual);
        (0, vitest_1.expect)(firstThrottledRequest?.abortSignal?.aborted).toBe(false);
        (0, vitest_1.expect)(secondThrottledRequest?.abortSignal?.aborted).toBe(true);
        (0, vitest_1.expect)(thirdThrottledRequest?.abortSignal?.aborted).toBe(false);
        // The third request will be promoted if enough time passes since the last promotion
        vitest_1.vi.advanceTimersByTime(smart_throttle_1.THROTTLE_TIMEOUT + 10);
        const fourthThrottledRequest = await service.throttle(createRequest('foo█'), get_inline_completions_1.TriggerKind.Manual);
        (0, vitest_1.expect)(firstThrottledRequest?.abortSignal?.aborted).toBe(false);
        (0, vitest_1.expect)(secondThrottledRequest?.abortSignal?.aborted).toBe(true);
        (0, vitest_1.expect)(thirdThrottledRequest?.abortSignal?.aborted).toBe(false);
        (0, vitest_1.expect)(fourthThrottledRequest?.abortSignal?.aborted).toBe(false);
    });
    (0, vitest_1.it)('cancels tail requests during the debounce timeout for automatic triggers', async () => {
        const abortController = new AbortController();
        const firstPromise = service.throttle(createRequest('foo█', abortController), get_inline_completions_1.TriggerKind.Automatic);
        abortController.abort();
        vitest_1.vi.advanceTimersByTime(25);
        (0, vitest_1.expect)(await firstPromise).toBeNull();
    });
});
function createRequest(textWithCursor, abortController = new AbortController()) {
    const { document, position } = (0, test_helpers_1.documentAndPosition)(textWithCursor);
    const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
        document,
        position,
        maxPrefixLength: 1000,
        maxSuffixLength: 1000,
        dynamicMultilineCompletions: false,
        context: undefined,
    });
    return {
        docContext,
        document,
        position,
        abortSignal: abortController.signal,
    };
}
