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
// Simulate the VS Code behavior where accepting a completion will immediately start a new
// completion request.
async function getInlineCompletionAfterAccepting(initialCode, completion, acceptedCode, triggerKind = get_inline_completions_1.TriggerKind.Automatic) {
    const initialRequestParams = (0, helpers_1.params)(initialCode, [completion]);
    const item = await (0, helpers_1.getInlineCompletions)(initialRequestParams);
    return (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(acceptedCode, [], {
        triggerKind,
        lastAcceptedCompletionItem: {
            requestParams: initialRequestParams,
            analyticsItem: item.items[0],
        },
    }));
}
(0, vitest_1.describe)('[getInlineCompletions] no request when accepting', () => {
    // In VS Code, accepting a completion will immediately start a new completion request. If the
    // user, however, accepted a single line completion, chances are that the current line is
    // finished (ie. the LLM already gave the best guess at completing the line).
    //
    // Thus, this results in a request that almost always has zero results but still incurs network
    // and inference costs.
    (0, vitest_1.it)('should not make a request after accepting a completion', async () => (0, vitest_1.expect)(await getInlineCompletionAfterAccepting((0, dedent_1.default) `
                    function test() {
                        console.l█
                    }
                `, (0, test_helpers_1.completion) `├og = 123┤`, (0, dedent_1.default) `
                    function test() {
                        console.log = 123█
                    }
                `)).toEqual(null));
    (0, vitest_1.it)('should make the request when manually invoked', async () => (0, vitest_1.expect)(await getInlineCompletionAfterAccepting((0, dedent_1.default) `
                    function test() {
                        console.l█
                    }
                `, (0, test_helpers_1.completion) `├og = 123┤`, (0, dedent_1.default) `
                    function test() {
                        console.log = 123█
                    }
                `, get_inline_completions_1.TriggerKind.Manual)).not.toEqual(null));
    (0, vitest_1.it)('should make the request when the accepted completion was multi-line', async () => (0, vitest_1.expect)(await getInlineCompletionAfterAccepting((0, dedent_1.default) `
                function test() {
                    █
                }
            `, (0, test_helpers_1.completion) `├console.log = 123┤`, (0, dedent_1.default) `
                function test() {
                    console.log = 123█
                }
            `, get_inline_completions_1.TriggerKind.Manual)).not.toEqual(null));
});
