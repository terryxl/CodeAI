"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const get_current_doc_context_1 = require("./get-current-doc-context");
const get_inline_completions_1 = require("./get-inline-completions");
const provider_1 = require("./providers/provider");
const request_manager_1 = require("./request-manager");
const test_helpers_1 = require("./test-helpers");
const hot_streak_1 = require("./providers/hot-streak");
const helpers_1 = require("./get-inline-completions-tests/helpers");
class MockProvider extends provider_1.Provider {
    didFinishNetworkRequest = false;
    didAbort = false;
    next = () => { };
    responseQueue = [];
    yield(completions, keepAlive = false) {
        const result = completions.map(content => typeof content === 'string'
            ? {
                completion: { insertText: content, stopReason: 'test' },
                docContext: this.options.docContext,
            }
            : {
                completion: content,
                docContext: this.options.docContext,
            });
        this.responseQueue.push(result);
        this.didFinishNetworkRequest = !keepAlive;
        this.next();
    }
    async *generateCompletions(abortSignal) {
        abortSignal.addEventListener('abort', () => {
            this.didAbort = true;
        });
        //  generateMockedCompletions(this: MockProvider) {
        while (!(this.didFinishNetworkRequest && this.responseQueue.length === 0)) {
            while (this.responseQueue.length > 0) {
                yield this.responseQueue.shift();
            }
            // Wait for the next yield
            this.responseQueue = [];
            if (!this.didFinishNetworkRequest) {
                await new Promise(resolve => {
                    this.next = resolve;
                });
            }
        }
    }
}
function createProvider(prefix) {
    const { docContext, document, position } = docState(prefix);
    return new MockProvider({
        id: 'mock-provider',
        docContext,
        document,
        position,
        multiline: false,
        n: 1,
        firstCompletionTimeout: 1900,
    });
}
function docState(prefix, suffix = ';', uriString) {
    const { document, position } = (0, test_helpers_1.documentAndPosition)(`${prefix}█${suffix}`, undefined, uriString);
    return {
        document,
        position,
        docContext: (0, get_current_doc_context_1.getCurrentDocContext)({
            document,
            position,
            maxPrefixLength: 100,
            maxSuffixLength: 100,
            dynamicMultilineCompletions: false,
        }),
        selectedCompletionInfo: undefined,
    };
}
(0, vitest_1.describe)('RequestManager', () => {
    let createRequest;
    let checkCache;
    (0, vitest_1.beforeEach)(async () => {
        await (0, helpers_1.initCompletionProviderConfig)({});
        const requestManager = new request_manager_1.RequestManager();
        createRequest = (prefix, provider, suffix) => requestManager.request({
            requestParams: docState(prefix, suffix),
            provider,
            context: [],
            isCacheEnabled: true,
        });
        checkCache = (prefix, suffix) => requestManager.checkCache({ requestParams: docState(prefix, suffix), isCacheEnabled: true });
    });
    (0, vitest_1.it)('resolves a single request', async () => {
        const prefix = 'console.log(';
        const provider = createProvider(prefix);
        setTimeout(() => provider.yield(["'hello')"]), 0);
        const { completions, source } = await createRequest(prefix, provider);
        (0, vitest_1.expect)(completions[0].insertText).toBe("'hello')");
        (0, vitest_1.expect)(source).toBe(get_inline_completions_1.InlineCompletionsResultSource.Network);
    });
    (0, vitest_1.it)('does not resolve from cache if the suffix has changed', async () => {
        const prefix = 'console.log(';
        const suffix1 = ')\nconsole.log(1)';
        const provider1 = createProvider(prefix);
        setTimeout(() => provider1.yield(["'hello')"]), 0);
        await createRequest(prefix, provider1, suffix1);
        const suffix2 = ')\nconsole.log(2)';
        const provider2 = createProvider(prefix);
        setTimeout(() => provider2.yield(["'world')"]), 0);
        const { completions, source } = await createRequest(prefix, provider2, suffix2);
        (0, vitest_1.expect)(source).toBe(get_inline_completions_1.InlineCompletionsResultSource.Network);
        (0, vitest_1.expect)(completions[0].insertText).toBe("'world')");
    });
    (0, vitest_1.it)('keeps requests running when a new request comes in', async () => {
        const prefix1 = 'console.';
        const provider1 = createProvider(prefix1);
        const promise1 = createRequest(prefix1, provider1);
        const prefix2 = 'console.log(';
        const provider2 = createProvider(prefix2);
        const promise2 = createRequest(prefix2, provider2);
        (0, vitest_1.expect)(provider1.didFinishNetworkRequest).toBe(false);
        (0, vitest_1.expect)(provider2.didFinishNetworkRequest).toBe(false);
        provider2.yield(["'hello')"]);
        (0, vitest_1.expect)((await promise2).completions[0].insertText).toBe("'hello')");
        // Since the later request resolves first, the first request will not
        // resolve yet.
        (0, vitest_1.expect)(provider1.didFinishNetworkRequest).toBe(false);
        (0, vitest_1.expect)(provider2.didFinishNetworkRequest).toBe(true);
        provider1.yield(['log();']);
        (0, vitest_1.expect)((await promise1).completions[0].insertText).toBe('log();');
        (0, vitest_1.expect)(provider1.didFinishNetworkRequest).toBe(true);
    });
    (0, vitest_1.it)('synthesizes a result when a prior request resolves', async () => {
        const prefix1 = 'console.';
        const provider1 = createProvider(prefix1);
        const promise1 = createRequest(prefix1, provider1);
        const prefix2 = 'console.log(';
        const provider2 = createProvider(prefix2);
        const promise2 = createRequest(prefix2, provider2);
        provider1.yield(["log('hello')"]);
        (0, vitest_1.expect)((await promise1).completions[0].insertText).toBe("log('hello')");
        const { completions, source } = await promise2;
        (0, vitest_1.expect)(completions[0].insertText).toBe("'hello')");
        (0, vitest_1.expect)(source).toBe(get_inline_completions_1.InlineCompletionsResultSource.CacheAfterRequestStart);
        (0, vitest_1.expect)(provider1.didFinishNetworkRequest).toBe(true);
        (0, vitest_1.expect)(provider2.didFinishNetworkRequest).toBe(false);
        // Ensure that the completed network request does not cause issues
        provider2.yield(["'world')"]);
    });
    (0, vitest_1.describe)('cache', () => {
        (0, vitest_1.it)('resolves a single request with a cached value without waiting for the debounce timeout', async () => {
            const prefix = 'console.log(';
            const provider1 = createProvider(prefix);
            setTimeout(() => provider1.yield(["'hello')"]), 0);
            await createRequest(prefix, provider1);
            const { completions, source } = checkCache(prefix);
            (0, vitest_1.expect)(source).toBe(get_inline_completions_1.InlineCompletionsResultSource.Cache);
            (0, vitest_1.expect)(completions[0].insertText).toBe("'hello')");
        });
    });
    (0, vitest_1.describe)('abort logic', () => {
        (0, vitest_1.it)('aborts a newer request if a prior request resolves it', async () => {
            const prefix1 = 'console.';
            const provider1 = createProvider(prefix1);
            const promise1 = createRequest(prefix1, provider1);
            const prefix2 = 'console.log(';
            const provider2 = createProvider(prefix2);
            const promise2 = createRequest(prefix2, provider2);
            provider1.yield(["log('hello')"]);
            (0, vitest_1.expect)((await promise1).completions[0].insertText).toBe("log('hello')");
            const [completion] = (await promise2).completions;
            (0, vitest_1.expect)(completion.insertText).toBe("'hello')");
            // Keeps completion meta-data on cache-hit
            (0, vitest_1.expect)(completion).toHaveProperty('stopReason');
            (0, vitest_1.expect)(completion).toHaveProperty('range');
            (0, vitest_1.expect)(provider2.didAbort).toBe(true);
        });
        (0, vitest_1.it)('aborts requests that are no longer relevant', async () => {
            const prefix1 = 'console.';
            const provider1 = createProvider(prefix1);
            createRequest(prefix1, provider1);
            const prefix2 = 'table.';
            const provider2 = createProvider(prefix2);
            createRequest(prefix2, provider2);
            (0, vitest_1.expect)(provider1.didAbort).toBe(true);
        });
        (0, vitest_1.it)('aborts hot-streak completions when the generation start to diverge from the document', async () => {
            const prefix1 = 'console.';
            const provider1 = createProvider(prefix1);
            createRequest(prefix1, provider1);
            const prefix2 = 'console.tabletop';
            const provider2 = createProvider(prefix2);
            createRequest(prefix2, provider2);
            // we're still looking relevant
            provider1.yield(['ta'], true);
            (0, vitest_1.expect)(provider1.didAbort).toBe(false);
            // ok now we diverted (note do don't update the docContext so we have to start the
            // completion at the same prefix as the first request)
            provider1.yield([
                {
                    insertText: 'tabulatore',
                    stopReason: hot_streak_1.STOP_REASON_HOT_STREAK,
                },
            ], true);
            await (0, test_helpers_1.nextTick)();
            (0, vitest_1.expect)(provider1.didAbort).toBe(true);
        });
    });
});
(0, vitest_1.describe)('computeIfRequestStillRelevant', () => {
    (0, vitest_1.it)('returns true if the latest insertion is a forward type of the latest document', async () => {
        const currentRequest = docState('console.log');
        const previousRequest = docState('console.');
        const completion = { insertText: 'log("Hello, world!")' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeTruthy();
    });
    (0, vitest_1.it)('returns true if the latest document is a forward type of the latest insertion document', async () => {
        const currentRequest = docState('console.log("Hello, world!")');
        const previousRequest = docState('console.');
        const completion = { insertText: 'log' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeTruthy();
    });
    (0, vitest_1.it)('handles cases on different lines', async () => {
        const currentRequest = docState('if (true) {\n  console.');
        const previousRequest = docState('if (true) {');
        const completion = { insertText: '\n  console.log("wow")' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeTruthy();
    });
    (0, vitest_1.it)('handles cases where the prefix is not starting at the same line', async () => {
        let hundredLines = '';
        for (let i = 0; i < 100; i++) {
            hundredLines += `${i}\n`;
        }
        const currentRequest = docState(`${hundredLines}if (true) {\n  console.log(`);
        const previousRequest = docState(`${hundredLines}if (true) {`);
        const completion = { insertText: '\n  console.log("wow")\n}' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeTruthy();
    });
    (0, vitest_1.it)('never matches for mismatched documents', async () => {
        const currentRequest = docState('console.log', undefined, 'foo.ts');
        const previousRequest = docState('console.', undefined, 'bar.ts');
        const completion = { insertText: 'log("Hello, world!")' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeFalsy();
    });
    (0, vitest_1.it)('never matches for mismatching prefixes', async () => {
        const hundredLines = 'WOW\n'.repeat(100);
        const thousandLines = 'WOW\n'.repeat(1000);
        const currentRequest = docState(`${hundredLines}console.log`);
        const previousRequest = docState(`${thousandLines}console.`);
        const completion = { insertText: 'log("Hello, world!")' };
        // Even though the prefix will look the same, it'll be on different lines and should thus
        // not be reused
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeFalsy();
    });
    (0, vitest_1.it)('supports a change in indentation', async () => {
        const currentRequest = docState('    console.log');
        const previousRequest = docState('\tconsole.');
        const completion = { insertText: 'log("Hello, world!")' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeTruthy();
    });
    (0, vitest_1.it)('handles typos in the latest document', async () => {
        const currentRequest = docState('console.dir');
        const previousRequest = docState('console.');
        const completion = { insertText: 'log("Hello, world!")' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeTruthy();
    });
    (0, vitest_1.it)('handles typos in the latest insertion', async () => {
        const currentRequest = docState('console.log');
        const previousRequest = docState('console.');
        const completion = { insertText: 'dir' };
        (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, [completion])).toBeTruthy();
    });
    (0, vitest_1.describe)('when the request has not yielded a completion yet', () => {
        (0, vitest_1.it)('handles cases where the current document is ahead (as the user is typing forward)', async () => {
            const currentRequest = docState('console.log');
            const previousRequest = docState('con');
            (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, null)).toBeTruthy();
        });
        (0, vitest_1.it)('detects still relevant completions', async () => {
            const currentRequest = docState('console.dir');
            const previousRequest = docState('console.log');
            (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, null)).toBeTruthy();
        });
        (0, vitest_1.it)('detects irrelevant completions', async () => {
            const currentRequest = docState('console.dir');
            const previousRequest = docState('table.dir');
            (0, vitest_1.expect)((0, request_manager_1.computeIfRequestStillRelevant)(currentRequest, previousRequest, null)).toBeFalsy();
        });
    });
});
