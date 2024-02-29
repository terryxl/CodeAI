"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const get_inline_completions_1 = require("../get-inline-completions");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] streaming', () => {
    (0, vitest_1.it)('terminates early for a single-line request', async () => {
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)({
            ...(0, helpers_1.params)('const x = █', [(0, test_helpers_1.completion) `├1337\nconsole.log('what?');┤`], {
                *completionResponseGenerator() {
                    yield (0, test_helpers_1.completion) `├1337\ncon┤`;
                },
            }),
        })).toEqual({
            items: [{ insertText: '1337' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
    });
    (0, vitest_1.it)('does not include unfinished lines in results', async () => {
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)({
            ...(0, helpers_1.params)('const x = █', [(0, test_helpers_1.completion) `├1337\nconsole.log('what?');┤`], {
                *completionResponseGenerator() {
                    yield (0, test_helpers_1.completion) `├13┤`;
                    yield (0, test_helpers_1.completion) `├1337\n┤`;
                },
            }),
        })).toEqual({
            items: [{ insertText: '1337' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
    });
    (0, vitest_1.it)('uses the multi-line truncation logic to terminate early for multi-line completions', async () => {
        const result = await (0, helpers_1.getInlineCompletions)({
            ...(0, helpers_1.params)((0, dedent_1.default) `
                            function myFun() {
                                █
                            }
                        `, [
                (0, test_helpers_1.completion) `
                                    ├console.log('what?')
                                }

                                function never(){}┤
                            `,
            ], {
                *completionResponseGenerator() {
                    yield (0, test_helpers_1.completion) `
                                ├console.log('what?')┤
                            ┴┴┴┴
                        `;
                    yield (0, test_helpers_1.completion) `
                                ├console.log('what?')
                            }

                            function never(){}┤
                        `;
                },
            }),
        });
        (0, vitest_1.expect)(result?.items.map(item => item.insertText)).toEqual(["console.log('what?')"]);
        (0, vitest_1.expect)(result?.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.Network);
    });
    (0, vitest_1.it)('uses the next non-empty line comparison logic to terminate early for multi-line completions', async () => {
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)({
            ...(0, helpers_1.params)((0, dedent_1.default) `
                            function myFun() {
                                █
                                console.log('oh no')
                            }
                        `, [
                (0, test_helpers_1.completion) `
                                    ├const a = new Array()
                                    console.log('oh no')
                                }┤
                            `,
            ], {
                *completionResponseGenerator() {
                    yield (0, test_helpers_1.completion) `
                                    ├const a = new Array()
                                    console.log('oh no')┤
                                ┴┴┴┴
                            `;
                    yield (0, test_helpers_1.completion) `
                                    ├const a = new Array()
                                    console.log('oh no')
                                ┤
                            `;
                },
            }),
        })).toEqual({
            items: [{ insertText: 'const a = new Array()' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
    });
    (0, vitest_1.it)('uses the multi-line truncation logic to terminate early for multi-line completions with leading new line', async () => {
        const result = await (0, helpers_1.getInlineCompletions)({
            ...(0, helpers_1.params)((0, dedent_1.default) `
                    function bubbleSort() {
                        █
                    }
                `, [
                (0, test_helpers_1.completion) `\nconst merge = (left, right) => {\n  let arr = [];\n  while (left.length && right.length) {\n    if (true) {}\n  }\n}\nconsole.log()`,
            ], {
                *completionResponseGenerator() {
                    yield (0, test_helpers_1.completion) `\nconst merge = (left, right) => {\n  let arr = [];\n  while (left.length && right.length) {\n    if (`;
                    yield (0, test_helpers_1.completion) `\nconst merge = (left, right) => {\n  let arr = [];\n  while (left.length && right.length) {\n    if (true) {}\n  }\n}\nconsole.log()\n`;
                },
            }),
        });
        (0, vitest_1.expect)(result?.items[0].insertText).toMatchInlineSnapshot(`
          "const merge = (left, right) => {
              let arr = [];
              while (left.length && right.length) {
                  if (true) {}
              }"
        `);
        (0, vitest_1.expect)(result?.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.Network);
    });
    (0, vitest_1.it)('cuts-off multlineline compeltions with inconsistent indentation correctly', async () => {
        const result = await (0, helpers_1.getInlineCompletions)({
            ...(0, helpers_1.params)((0, dedent_1.default) `
                    function bubbleSort() {
                        █
                    }
                `, [(0, test_helpers_1.completion) `// Bubble sort algorithm\nconst numbers = [5, 3, 6, 2, 10];\n`], {
                *completionResponseGenerator() {
                    yield (0, test_helpers_1.completion) `// Bubble sort algorithm\nconst numbers = [5, 3, 6, 2, 10];\n`;
                },
            }),
        });
        (0, vitest_1.expect)(result?.items[0].insertText).toMatchInlineSnapshot('"// Bubble sort algorithm"');
        (0, vitest_1.expect)(result?.source).toBe(get_inline_completions_1.InlineCompletionsResultSource.Network);
    });
});
