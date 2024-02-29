"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const parser_1 = require("../../tree-sitter/parser");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] dynamic multiline', () => {
    (0, vitest_1.beforeAll)(async () => {
        await (0, test_helpers_1.initTreeSitterParser)();
    });
    (0, vitest_1.afterAll)(() => {
        (0, parser_1.resetParsersCache)();
    });
    (0, vitest_1.it)('continues generating a multiline completion if a multiline trigger is found on the first line', async () => {
        const { items } = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`function █myFunction() {
                console.log(1)
                █console.log(2)
                console.log(3)
                console█.log(4)
            }
            console.log(5)█`, {
            delayBetweenChunks: 50,
            configuration: { autocompleteExperimentalDynamicMultilineCompletions: true },
        });
        (0, vitest_1.expect)(items[0].insertText).toMatchInlineSnapshot(`
            "myFunction() {
                console.log(1)
                console.log(2)
                console.log(3)
                console.log(4)
            }"
        `);
    });
    (0, vitest_1.it)('switches to multiline completions for nested blocks', async () => {
        const { items } = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`function myFunction(value) {
                if █(value) {
                    console.log('got it!')
                }

                return value█
            }`, {
            configuration: { autocompleteExperimentalDynamicMultilineCompletions: true },
        });
        (0, vitest_1.expect)(items[0].insertText).toMatchInlineSnapshot(`
          "(value) {
                  console.log('got it!')
              }"
        `);
    });
    (0, vitest_1.it)('switches to multiline completions for multiline function calls', async () => {
        const { items } = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`const result = █myFunction(
                document,
                docContext█,
                isFinalRequest
            )

            const compeltion = new InlineCompletion(result)█
            console.log(completion)`, {
            configuration: { autocompleteExperimentalDynamicMultilineCompletions: true },
        });
        (0, vitest_1.expect)(items[0].insertText).toMatchInlineSnapshot(`
          "myFunction(
              document,
              docContext,
              isFinalRequest
          )"
        `);
    });
    (0, vitest_1.it)('switches to multiline completions for multiline arrays', async () => {
        const { items } = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`const oddNumbers█ = [
                1,
                3,
                5,
                7,
                9,
            ]█

            console.log(oddNumbers)`, {
            configuration: { autocompleteExperimentalDynamicMultilineCompletions: true },
        });
        (0, vitest_1.expect)(items[0].insertText).toMatchInlineSnapshot(`
          " = [
              1,
              3,
              5,
              7,
              9,
          ]"
        `);
    });
    (0, vitest_1.it)('does not use dynamic multiline for certain black listed cases', async () => {
        const { items } = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`class █Test {
                constructor() {
                    console.log(1)
                █   console.log(2)
                    console.log(3)
                    console.█log(4)
                }
            }
            console.log(5)█`, {
            configuration: { autocompleteExperimentalDynamicMultilineCompletions: true },
        });
        (0, vitest_1.expect)(items[0]?.insertText).toMatchInlineSnapshot('"Test {"');
    });
    (0, vitest_1.it)('does not use dynamic multiline completions for certain languages', async () => {
        const { items } = await (0, helpers_1.getInlineCompletionsWithInlinedChunks)(`
- Autocomplete: Improved the new jaccard similarity retriever
- Edit: Added a multi-model selector. [pull/2951](█https://github.com/sourcegraph/cody/pull/2951)
- Edit: █Added Cody Pro support for models: █GPT-4. [█pull/2951](https://github.com/sourcegraph/cody/pull/2951)█
- Autocomplete: Remove obvious prompt-continuations. [pull/2974](https://github.com/sourcegraph/cody/pull/2974)`, {
            delayBetweenChunks: 50,
            languageId: 'markdown',
            configuration: { autocompleteExperimentalDynamicMultilineCompletions: true },
        });
        (0, vitest_1.expect)(items[0].insertText).toMatchInlineSnapshot(`"https://github.com/sourcegraph/cody/pull/2951)"`);
    });
});
