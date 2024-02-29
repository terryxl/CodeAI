"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const mocks_1 = require("../../testutils/mocks");
const get_inline_completions_1 = require("../get-inline-completions");
const request_manager_1 = require("../request-manager");
const test_helpers_1 = require("../test-helpers");
const text_processing_1 = require("../text-processing");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] common', () => {
    (0, vitest_1.test)('single-line mode only completes one line', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(`
        function test() {
            console.log(1);
            █
        }
        `, [
        (0, test_helpers_1.completion) `
                    ├if (true) {
                        console.log(3);
                    }
                    console.log(4);┤
                ┴┴┴┴`,
    ]))).toEqual({
        items: [{ insertText: 'if (true) {' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.Network,
    }));
    (0, vitest_1.test)('with selectedCompletionInfo', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('array.so█', [(0, test_helpers_1.completion) `rt()`], {
        selectedCompletionInfo: { text: 'sort', range: new mocks_1.vsCodeMocks.Range(0, 6, 0, 8) },
    }))).toEqual({
        items: [{ insertText: 'rt()' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.Network,
    }));
    (0, vitest_1.test)('emits a completion even when the abort signal was triggered after a network fetch ', async () => {
        const abortController = new AbortController();
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)({
            ...(0, helpers_1.params)('const x = █', [(0, test_helpers_1.completion) `├1337┤`], {
                onNetworkRequest: () => abortController.abort(),
            }),
            abortSignal: abortController.signal,
        })).toEqual({
            items: [{ insertText: '1337' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
    });
    (0, vitest_1.test)('trims whitespace in the prefix but keeps one \n', async () => {
        const requests = [];
        await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)((0, dedent_1.default) `
            class Range {


                █
            }
        `, [], {
            onNetworkRequest(request) {
                requests.push(request);
            },
        }));
        const messages = requests[0].messages;
        (0, vitest_1.expect)(messages.at(-1).text).toBe('<CODE5711>class Range {');
    });
    (0, vitest_1.test)('uses a more complex prompt for larger files', async () => {
        const requests = [];
        await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)((0, dedent_1.default) `
            class Range {
                public startLine: number
                public startCharacter: number
                public endLine: number
                public endCharacter: number
                public start: Position
                public end: Position

                constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
                    this.startLine = █
                    this.startCharacter = startCharacter
                    this.endLine = endLine
                    this.endCharacter = endCharacter
                    this.start = new Position(startLine, startCharacter)
                    this.end = new Position(endLine, endCharacter)
                }
            }
        `, [], {
            onNetworkRequest(request) {
                requests.push(request);
            },
        }));
        (0, vitest_1.expect)(requests).toHaveLength(1);
        const messages = requests[0].messages;
        (0, vitest_1.expect)(messages.at(-1)).toMatchInlineSnapshot(`
            {
              "speaker": "assistant",
              "text": "<CODE5711>constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
                    this.startLine =",
            }
        `);
        (0, vitest_1.expect)(requests[0].stopSequences).toEqual(['\n\nHuman:', '</CODE5711>', text_processing_1.MULTILINE_STOP_SEQUENCE]);
    });
    (0, vitest_1.test)('synthesizes a completion from a prior request', async () => {
        // Reuse the same request manager for both requests in this test
        const requestManager = new request_manager_1.RequestManager();
        const promise1 = (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('console.█', [(0, test_helpers_1.completion) `log('Hello, world!');`], { requestManager }));
        // Start a second completions query before the first one is finished. The second one never
        // receives a network response
        const promise2 = (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('console.log(█', 'never-resolve', { requestManager }));
        await promise1;
        const completions = await promise2;
        (0, vitest_1.expect)(completions?.items[0].insertText).toBe("'Hello, world!');");
    });
});
