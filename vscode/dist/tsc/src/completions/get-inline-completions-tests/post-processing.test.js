"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const lodash_1 = require("lodash");
const vitest_1 = require("vitest");
const textDocument_1 = require("../../testutils/textDocument");
const parser_1 = require("../../tree-sitter/parser");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
const cases = [true, false];
// Run truncation tests for both strategies: indentation-based and tree-sitter-based.
// We cannot use `describe.each` here because `toMatchInlineSnapshot` is not supported with it.
for (const isTreeSitterEnabled of cases) {
    const label = isTreeSitterEnabled ? 'enabled' : 'disabled';
    (0, vitest_1.describe)(`[getInlineCompletions] post-processing with tree-sitter ${label}`, () => {
        (0, vitest_1.beforeAll)(async () => {
            if (isTreeSitterEnabled) {
                await (0, test_helpers_1.initTreeSitterParser)();
            }
        });
        (0, vitest_1.afterAll)(() => {
            (0, parser_1.resetParsersCache)();
        });
        (0, vitest_1.it)('preserves leading whitespace when prefix has no trailing whitespace', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('const isLocalHost = window.location.host█', [(0, test_helpers_1.completion) `├ === 'localhost'┤`]))).toEqual([" === 'localhost'"]));
        (0, vitest_1.it)('collapses leading whitespace when prefix has trailing whitespace', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('const x = █', [(0, test_helpers_1.completion) `├${helpers_1.T}1337┤`]))).toEqual(['1337']));
        (0, vitest_1.describe)('bad completion starts', () => {
            vitest_1.it.each([
                [(0, test_helpers_1.completion) `├➕     foo┤`, 'foo'],
                [(0, test_helpers_1.completion) `├${'\u200B'}   foo┤`, 'foo'],
                [(0, test_helpers_1.completion) `├.      foo┤`, 'foo'],
                [(0, test_helpers_1.completion) `├+  foo┤`, 'foo'],
                [(0, test_helpers_1.completion) `├-  foo┤`, 'foo'],
            ])('fixes %s to %s', async (completion, expected) => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('█', [completion]))).toEqual([
                expected,
            ]));
        });
        (0, vitest_1.describe)('odd indentation', () => {
            (0, vitest_1.it)('filters out odd indentation in single-line completions', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('const foo = █', [(0, test_helpers_1.completion) `├ 1337┤`]))).toEqual(['1337']));
        });
        (0, vitest_1.it)('ranks results by number of lines', async () => {
            const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    function it() {
                        █
                `, [
                (0, test_helpers_1.completion) `
                        ├console.log('foo')
                        console.log('foo')┤
                    ┴┴┴┴
                    `,
                (0, test_helpers_1.completion) `
                        ├console.log('foo')
                        console.log('foo')
                        console.log('foo')
                        console.log('foo')
                        console.log('foo')┤
                    ┴┴┴┴`,
                (0, test_helpers_1.completion) `
                        ├console.log('foo')┤
                    `,
            ], {
                providerOptions: { n: 3 },
            }));
            (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
              "console.log('foo')
                  console.log('foo')
                  console.log('foo')
                  console.log('foo')
                  console.log('foo')"
            `);
            (0, vitest_1.expect)(items[1]).toMatchInlineSnapshot(`
              "console.log('foo')
                  console.log('foo')"
            `);
            (0, vitest_1.expect)(items[2]).toBe("console.log('foo')");
        });
        (0, vitest_1.it)('dedupes duplicate results', async () => {
            (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    function it() {
                        █
                `, [(0, test_helpers_1.completion) `return true`, (0, test_helpers_1.completion) `return true`, (0, test_helpers_1.completion) `return true`]))).toEqual(['return true']);
        });
        // c.f. https://github.com/sourcegraph/cody/issues/872
        (0, vitest_1.it)('removes single character completions', async () => {
            (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        function it() {
                            █
                    `, [(0, test_helpers_1.completion) `}`]))).toEqual([]);
        });
        // c.f. https://github.com/sourcegraph/cody/issues/2912
        (0, vitest_1.it)('removes prompt-continuations', async () => {
            (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        function it() {
                            █
                    `, [
                // Anthropic-style prompts
                (0, test_helpers_1.completion) `\nHuman: Here is some more context code to provide`,
                // StarCoder style context snippet
                (0, test_helpers_1.completion) `// Path: foo.ts`,
                (0, test_helpers_1.completion) `# Path: foo.ts`,
            ]))).toEqual([]);
        });
        (0, vitest_1.it)('removes appends the injected prefix to the completion response since this is not sent to the LLM', async () => {
            (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        console.l█
                    `, [(0, test_helpers_1.completion) `('hello world')`], {
                takeSuggestWidgetSelectionIntoAccount: true,
                selectedCompletionInfo: { text: 'log', range: (0, textDocument_1.range)(0, 8, 0, 9) },
            }))).toEqual(["og('hello world')"]);
        });
        if (isTreeSitterEnabled) {
            async function getCompletionItems(code, completions) {
                const completionResult = await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)((0, dedent_1.default)(code), completions.map(completion => ({
                    completion,
                    stopReason: 'unknown',
                })), {
                    providerOptions: { n: 3 },
                }));
                if (completionResult?.items) {
                    return completionResult.items;
                }
                throw new Error('Expected to have `items` in a `completionResult`');
            }
            (0, vitest_1.it)('adds parse info to single-line completions', async () => {
                const completions = await getCompletionItems('function sort(█', [
                    'array) {}',
                    'array) new',
                ]);
                (0, vitest_1.expect)(completions.map(c => Boolean(c.parseErrorCount))).toEqual([false, true]);
            });
            (0, vitest_1.it)('respects completion insert ranges', async () => {
                const completions = await getCompletionItems('function sort(█)', [
                    'array) {}',
                    'array) new',
                ]);
                (0, vitest_1.expect)(completions.map(c => Boolean(c.parseErrorCount))).toEqual([false, true]);
            });
            (0, vitest_1.it)('adds parse info to multi-line completions', async () => {
                const completions = await getCompletionItems(`
                        function hello() {
                            alert('hello world!')
                        }

                        const one = []; function sort(█)
                    `, ['array) {\nreturn array.sort()\n} function two() {}', 'array) new\n']);
                const [completion] = completions.map(c => (0, lodash_1.pick)(c, ['insertText', 'nodeTypes', 'nodeTypesWithCompletion', 'parseErrorCount']));
                (0, vitest_1.expect)(completion).toMatchInlineSnapshot(`
                  {
                    "insertText": "array) {",
                    "nodeTypes": {
                      "atCursor": "(",
                      "grandparent": "function_signature",
                      "greatGrandparent": "program",
                      "lastAncestorOnTheSameLine": "function_signature",
                      "parent": "formal_parameters",
                    },
                    "nodeTypesWithCompletion": {
                      "atCursor": "(",
                      "grandparent": "function_declaration",
                      "greatGrandparent": "program",
                      "lastAncestorOnTheSameLine": "function_declaration",
                      "parent": "formal_parameters",
                    },
                    "parseErrorCount": 0,
                  }
                `);
            });
            (0, vitest_1.it)('adds parse info to single-line completions', async () => {
                const [item] = await getCompletionItems('const one = █', ['"one"']);
                (0, vitest_1.expect)((0, lodash_1.pick)(item, ['insertText', 'nodeTypes', 'nodeTypesWithCompletion', 'parseErrorCount'])).toMatchInlineSnapshot(`
                      {
                        "insertText": ""one"",
                        "nodeTypes": {
                          "atCursor": "program",
                          "grandparent": undefined,
                          "greatGrandparent": undefined,
                          "lastAncestorOnTheSameLine": "program",
                          "parent": undefined,
                        },
                        "nodeTypesWithCompletion": {
                          "atCursor": "variable_declarator",
                          "grandparent": "program",
                          "greatGrandparent": undefined,
                          "lastAncestorOnTheSameLine": "lexical_declaration",
                          "parent": "lexical_declaration",
                        },
                        "parseErrorCount": 0,
                      }
                    `);
            });
        }
    });
}
