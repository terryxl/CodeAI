"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const parser_1 = require("../../tree-sitter/parser");
const get_inline_completions_1 = require("../get-inline-completions");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] hot streak', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('static multiline', () => {
        (0, vitest_1.it)('caches hot streaks completions that are streamed in', async () => {
            let request = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`function myFunction() {
                    console.log(1)
                    █console.log(2)
                    █console.log(3)
                    console█.log(4)
                    █
                }`, {
                configuration: { autocompleteExperimentalHotStreak: true },
                delayBetweenChunks: 50,
            });
            await vitest_1.vi.runAllTimersAsync();
            // Wait for hot streak completions be yielded and cached.
            await request.completionResponseGeneratorPromise;
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(2)');
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(3)');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(4)');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
        });
        (0, vitest_1.it)('caches hot streaks completions that are added at the end of the request', async () => {
            let request = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`function myFunction() {
                    console.log(1)
                    █console.log(2)
                    console.log(3)
                    console.log(4)
                    █
                }`, { configuration: { autocompleteExperimentalHotStreak: true } });
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(2)');
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(3)');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(4)');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
        });
        (0, vitest_1.it)('supports completion chunks terminated in the middle of the line', async () => {
            let request = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`function myFunction() {
                    const result = 'foo'
                    █console.log(result)
                    if█(i > 1) {
                        console.log(1)
                    █}
                    console.log(4)
                    return foo█
                }`, { configuration: { autocompleteExperimentalHotStreak: true } });
            await request.completionResponseGeneratorPromise;
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(result)');
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('if(i > 1) {');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(1)\n    }');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('console.log(4)');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('return foo');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
        });
    });
    (0, vitest_1.describe)('dynamic multiline', () => {
        (0, vitest_1.beforeAll)(async () => {
            await (0, test_helpers_1.initTreeSitterParser)();
        });
        (0, vitest_1.afterAll)(() => {
            (0, parser_1.resetParsersCache)();
        });
        (0, vitest_1.it)('works with dynamic multiline mode', async () => {
            let request = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`function myFunction(i) {
                    console.log(1)
                    █if(i > 1) {
                        console.log(2)
                    }
                    if(i > 2) {
                        console.log(3)
                    }
                    if(i > 3) {
                        console.log(4)
                    }█
                }`, {
                configuration: {
                    autocompleteExperimentalDynamicMultilineCompletions: true,
                    autocompleteExperimentalHotStreak: true,
                },
            });
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('if(i > 1) {\n        console.log(2)\n    }');
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('if(i > 2) {\n        console.log(3)\n    }');
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
        });
        (0, vitest_1.it)('yields a singleline completion early if `firstCompletionTimeout` elapses before the multiline completion is ready', async () => {
            const completionsPromise = (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`function myFunction█() {
                    if(i > 1) {█
                        console.log(2)
                    }
                    if(i > 2) {
                        console.log(3)
                    }█
                    if(i > 3) {
                        console.log(4)
                    }
                }
                myFunction()
                █
                const`, {
                configuration: {
                    autocompleteExperimentalDynamicMultilineCompletions: true,
                    autocompleteExperimentalHotStreak: true,
                },
                delayBetweenChunks: 20,
                providerOptions: {
                    firstCompletionTimeout: 10,
                },
            });
            // Wait for the first completion to be ready
            vitest_1.vi.advanceTimersByTime(15);
            // Release the `completionsPromise`
            await vitest_1.vi.runAllTimersAsync();
            let request = await completionsPromise;
            await request.completionResponseGeneratorPromise;
            (0, vitest_1.expect)(request.items[0].insertText).toEqual('() {');
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
            (0, vitest_1.expect)(request.items[0].insertText).toMatchInlineSnapshot(`
              "if(i > 1) {
                      console.log(2)
                  }
                  if(i > 2) {
                      console.log(3)
                  }
                  if(i > 3) {
                      console.log(4)
                  }
              }"
            `);
            request = await request.acceptFirstCompletionAndPressEnter();
            (0, vitest_1.expect)(request.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.HotStreak);
            (0, vitest_1.expect)(request.items[0].insertText).toMatchInlineSnapshot(`
              "myFunction()"
            `);
        });
    });
});
