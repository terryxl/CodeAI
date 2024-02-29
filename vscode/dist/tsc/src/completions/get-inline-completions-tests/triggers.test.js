"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const textDocument_1 = require("../../testutils/textDocument");
const get_inline_completions_1 = require("../get-inline-completions");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] triggers', () => {
    (0, vitest_1.describe)('singleline', () => {
        (0, vitest_1.it)('after whitespace', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('foo = █', [(0, test_helpers_1.completion) `bar`]))).toEqual({
            items: [{ insertText: 'bar' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
        (0, vitest_1.it)('end of word', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('foo█', [(0, test_helpers_1.completion) `()`]))).toEqual({
            items: [{ insertText: '()' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
        (0, vitest_1.it)('middle of line', async () => {
            const result = await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('function bubbleSort(█)', [(0, test_helpers_1.completion) `array) {`]));
            (0, vitest_1.expect)(result?.items.map(item => ({
                insertText: item.insertText,
                range: item.range,
            }))).toEqual([{ insertText: 'array) {', range: (0, textDocument_1.range)(0, 20, 0, 21) }]);
        });
        (0, vitest_1.describe)('same line suffix behavior', () => {
            (0, vitest_1.it)('does not trigger when there are alphanumeric chars in the line suffix', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('foo = █ // x', []))).toBeNull());
            (0, vitest_1.it)('triggers when there are only non-alphanumeric chars in the line suffix', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('foo = █;', []))).toBeTruthy());
        });
    });
    (0, vitest_1.describe)('multiline', () => {
        (0, vitest_1.it)('triggers a multi-line completion at the start of a block', async () => {
            const requests = [];
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('function bubbleSort() {\n  █', [], {
                onNetworkRequest(params) {
                    requests.push(params);
                },
            }));
            (0, vitest_1.expect)(requests).toBeMultiLine();
        });
        (0, vitest_1.it)('does not trigger a multi-line completion at a function call', async () => {
            const requests = [];
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('bar(█)', [], {
                onNetworkRequest(params) {
                    requests.push(params);
                },
            }));
            (0, vitest_1.expect)(requests).toBeSingleLine();
        });
        (0, vitest_1.it)('does not trigger a multi-line completion at a method call', async () => {
            const requests = [];
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('foo.bar(█)', [], {
                onNetworkRequest(params) {
                    requests.push(params);
                },
            }));
            (0, vitest_1.expect)(requests).toBeSingleLine();
        });
        (0, vitest_1.describe)('does not trigger a multi-line completion if a block already has content', () => {
            (0, vitest_1.it)('for a non-empty current line', async () => {
                const requests = [];
                await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)((0, dedent_1.default) `
                        function myFunction() {█

                            console.log('three')
                        }
                    `, [], {
                    onNetworkRequest(params) {
                        requests.push(params);
                    },
                }));
                (0, vitest_1.expect)(requests).toBeSingleLine();
            });
            (0, vitest_1.it)('for an empty current line', async () => {
                const requests = [];
                await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)((0, dedent_1.default) `
                        function myFunction() {
                            █

                            console.log('three')
                        }
                    `, [], {
                    onNetworkRequest(params) {
                        requests.push(params);
                    },
                }));
                (0, vitest_1.expect)(requests).toBeSingleLine();
            });
        });
        (0, vitest_1.it)('triggers a multi-line completion at a method declarations', async () => {
            const requests = [];
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('method.hello () {█', [], {
                onNetworkRequest(params) {
                    requests.push(params);
                },
            }));
            (0, vitest_1.expect)(requests).toBeMultiLine();
        });
        (0, vitest_1.it)('does not support multi-line completion on unsupported languages', async () => {
            const requests = [];
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('function looksLegit() {\n  █', [], {
                languageId: 'elixir',
                onNetworkRequest(params) {
                    requests.push(params);
                },
            }));
            (0, vitest_1.expect)(requests).toBeSingleLine();
        });
        (0, vitest_1.it)('requires an indentation to start a block', async () => {
            const requests = [];
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('function bubbleSort() {\n█', [], {
                onNetworkRequest(params) {
                    requests.push(params);
                },
            }));
            (0, vitest_1.expect)(requests).toBeSingleLine();
        });
    });
    (0, vitest_1.describe)('closing symbols', () => {
        vitest_1.it.each(['{}█', '[]█', '()█', ';█'])('does not trigger for %s', async (prompt) => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(prompt, [(0, test_helpers_1.completion) `bar`]))).toEqual(null));
        vitest_1.it.each(['{}\n█', '[]\n█', '()\n█', ';\n█'])('does trigger for %s', async (prompt) => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(prompt, [(0, test_helpers_1.completion) `bar`]))).toEqual({
            items: [{ insertText: 'bar' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
    });
    (0, vitest_1.describe)('empty line at end of file', () => {
        const insertText = 'console.log(foo)';
        (0, vitest_1.it)('does not trigger when the line above is empty', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('function foo(){\n console.log()\n}\n\n█', [(0, test_helpers_1.completion) `bar`]))).toBeNull());
        (0, vitest_1.it)('does trigger for empty document', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('█', [(0, test_helpers_1.completion) `console.log(foo)`]))).toEqual({
            items: [{ insertText }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
        (0, vitest_1.it)('does trigger for empty line with non-empty line above', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('function log(foo: string){\n█', [(0, test_helpers_1.completion) `console.log(foo)`]))).toEqual({
            items: [{ insertText }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
        (0, vitest_1.it)('does trigger when cursor beyond character position zero', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('\n   █', [(0, test_helpers_1.completion) `console.log(foo)`]))).toEqual({
            items: [{ insertText }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
    });
});
