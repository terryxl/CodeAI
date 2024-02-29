"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const get_current_doc_context_1 = require("../get-current-doc-context");
const test_helpers_1 = require("../test-helpers");
const context_mixer_1 = require("./context-mixer");
const vscode_uri_1 = require("vscode-uri");
const ignore_helper_1 = require("@sourcegraph/cody-shared/src/cody-ignore/ignore-helper");
function createMockStrategy(resultSets) {
    const retrievers = [];
    for (const [index, set] of resultSets.entries()) {
        retrievers.push({
            identifier: `retriever${index + 1}`,
            retrieve: () => Promise.resolve(set),
            isSupportedForLanguageId: () => true,
            dispose: vitest_1.vi.fn(),
        });
    }
    const mockStrategyFactory = {
        getStrategy: vitest_1.vi.fn().mockReturnValue({
            name: retrievers.length > 0 ? 'jaccard-similarity' : 'none',
            retrievers,
        }),
        dispose: vitest_1.vi.fn(),
    };
    return mockStrategyFactory;
}
const { document, position } = (0, test_helpers_1.documentAndPosition)('console.█');
const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
    document,
    position,
    maxPrefixLength: 100,
    maxSuffixLength: 100,
    dynamicMultilineCompletions: false,
});
const defaultOptions = {
    document,
    position,
    docContext,
    maxChars: 1000,
};
(0, vitest_1.describe)('ContextMixer', () => {
    (0, vitest_1.describe)('with no retriever', () => {
        (0, vitest_1.it)('returns empty result if no retrievers', async () => {
            const mixer = new context_mixer_1.ContextMixer(createMockStrategy([]));
            const { context, logSummary } = await mixer.getContext(defaultOptions);
            (0, vitest_1.expect)(normalize(context)).toEqual([]);
            (0, vitest_1.expect)(logSummary).toEqual({
                duration: 0,
                retrieverStats: {},
                strategy: 'none',
                totalChars: 0,
            });
        });
    });
    (0, vitest_1.describe)('with one retriever', () => {
        (0, vitest_1.it)('returns the results of the retriever', async () => {
            const mixer = new context_mixer_1.ContextMixer(createMockStrategy([
                [
                    {
                        uri: (0, cody_shared_1.testFileUri)('foo.ts'),
                        content: 'function foo() {}',
                        startLine: 0,
                        endLine: 0,
                    },
                    {
                        uri: (0, cody_shared_1.testFileUri)('bar.ts'),
                        content: 'function bar() {}',
                        startLine: 0,
                        endLine: 0,
                    },
                ],
            ]));
            const { context, logSummary } = await mixer.getContext(defaultOptions);
            (0, vitest_1.expect)(normalize(context)).toEqual([
                {
                    fileName: 'foo.ts',
                    content: 'function foo() {}',
                    startLine: 0,
                    endLine: 0,
                },
                {
                    fileName: 'bar.ts',
                    content: 'function bar() {}',
                    startLine: 0,
                    endLine: 0,
                },
            ]);
            (0, vitest_1.expect)(logSummary).toEqual({
                duration: vitest_1.expect.any(Number),
                retrieverStats: {
                    retriever1: {
                        duration: vitest_1.expect.any(Number),
                        positionBitmap: 3,
                        retrievedItems: 2,
                        suggestedItems: 2,
                    },
                },
                strategy: 'jaccard-similarity',
                totalChars: 42,
            });
        });
    });
    (0, vitest_1.describe)('with more retriever', () => {
        (0, vitest_1.it)('mixes the results of the retriever using reciprocal rank fusion', async () => {
            const mixer = new context_mixer_1.ContextMixer(createMockStrategy([
                [
                    {
                        uri: (0, cody_shared_1.testFileUri)('foo.ts'),
                        content: 'function foo1() {}',
                        startLine: 0,
                        endLine: 0,
                    },
                    {
                        uri: (0, cody_shared_1.testFileUri)('bar.ts'),
                        content: 'function bar1() {}',
                        startLine: 0,
                        endLine: 0,
                    },
                ],
                [
                    {
                        uri: (0, cody_shared_1.testFileUri)('foo.ts'),
                        content: 'function foo3() {}',
                        startLine: 10,
                        endLine: 10,
                    },
                    {
                        uri: (0, cody_shared_1.testFileUri)('foo.ts'),
                        content: 'function foo1() {}\nfunction foo2() {}',
                        startLine: 0,
                        endLine: 1,
                    },
                    {
                        uri: (0, cody_shared_1.testFileUri)('bar.ts'),
                        content: 'function bar1() {}\nfunction bar2() {}',
                        startLine: 0,
                        endLine: 1,
                    },
                ],
            ]));
            const { context, logSummary } = await mixer.getContext(defaultOptions);
            // The results have overlaps in `foo.ts` and `bar.ts`. `foo.ts` is ranked higher in both
            // result sets, thus we expect the overlapping `foo.ts` ranges to appear first.
            // `foo3()` only appears in one result set and should thus be ranked last.
            (0, vitest_1.expect)(normalize(context)).toMatchInlineSnapshot(`
              [
                {
                  "content": "function foo1() {}",
                  "endLine": 0,
                  "fileName": "foo.ts",
                  "startLine": 0,
                },
                {
                  "content": "function foo1() {}
              function foo2() {}",
                  "endLine": 1,
                  "fileName": "foo.ts",
                  "startLine": 0,
                },
                {
                  "content": "function bar1() {}",
                  "endLine": 0,
                  "fileName": "bar.ts",
                  "startLine": 0,
                },
                {
                  "content": "function bar1() {}
              function bar2() {}",
                  "endLine": 1,
                  "fileName": "bar.ts",
                  "startLine": 0,
                },
                {
                  "content": "function foo3() {}",
                  "endLine": 10,
                  "fileName": "foo.ts",
                  "startLine": 10,
                },
              ]
            `);
            (0, vitest_1.expect)(logSummary).toEqual({
                duration: vitest_1.expect.any(Number),
                retrieverStats: {
                    retriever1: {
                        duration: vitest_1.expect.any(Number),
                        positionBitmap: 0b00101,
                        retrievedItems: 2,
                        suggestedItems: 2,
                    },
                    retriever2: {
                        duration: vitest_1.expect.any(Number),
                        positionBitmap: 0b11010,
                        retrievedItems: 3,
                        suggestedItems: 3,
                    },
                },
                strategy: 'jaccard-similarity',
                totalChars: 136,
            });
        });
        (0, vitest_1.describe)('retrived context is filtered by .cody/ignore', () => {
            const workspaceRoot = (0, cody_shared_1.testFileUri)('');
            (0, vitest_1.beforeAll)(() => {
                cody_shared_1.ignores.setActiveState(true);
                // all foo.ts files will be ignored
                cody_shared_1.ignores.setIgnoreFiles(workspaceRoot, [
                    {
                        uri: vscode_uri_1.Utils.joinPath(workspaceRoot, '.', ignore_helper_1.CODY_IGNORE_URI_PATH),
                        content: '**/foo.ts',
                    },
                ]);
            });
            (0, vitest_1.it)('mixes results are filtered', async () => {
                const mixer = new context_mixer_1.ContextMixer(createMockStrategy([
                    [
                        {
                            uri: (0, cody_shared_1.testFileUri)('foo.ts'),
                            content: 'function foo1() {}',
                            startLine: 0,
                            endLine: 0,
                        },
                        {
                            uri: (0, cody_shared_1.testFileUri)('foo/bar.ts'),
                            content: 'function bar1() {}',
                            startLine: 0,
                            endLine: 0,
                        },
                    ],
                    [
                        {
                            uri: (0, cody_shared_1.testFileUri)('test/foo.ts'),
                            content: 'function foo3() {}',
                            startLine: 10,
                            endLine: 10,
                        },
                        {
                            uri: (0, cody_shared_1.testFileUri)('foo.ts'),
                            content: 'function foo1() {}\nfunction foo2() {}',
                            startLine: 0,
                            endLine: 1,
                        },
                        {
                            uri: (0, cody_shared_1.testFileUri)('example/bar.ts'),
                            content: 'function bar1() {}\nfunction bar2() {}',
                            startLine: 0,
                            endLine: 1,
                        },
                    ],
                ]));
                const { context } = await mixer.getContext(defaultOptions);
                const contextFiles = normalize(context);
                // returns 2 bar.ts context
                (0, vitest_1.expect)(contextFiles?.length).toEqual(2);
                for (const context of contextFiles) {
                    (0, vitest_1.expect)((0, cody_shared_1.isCodyIgnoredFile)(vscode_uri_1.Utils.joinPath(workspaceRoot, context.fileName))).toBeFalsy();
                }
            });
        });
    });
});
function normalize(context) {
    return context.map(({ uri, ...rest }) => ({ ...rest, fileName: (0, cody_shared_1.uriBasename)(uri) }));
}
