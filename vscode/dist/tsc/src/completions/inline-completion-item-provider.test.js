"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const LocalStorageProvider_1 = require("../services/LocalStorageProvider");
const mocks_1 = require("../testutils/mocks");
const textDocument_1 = require("../testutils/textDocument");
const get_inline_completions_1 = require("./get-inline-completions");
const inline_completion_item_provider_1 = require("./inline-completion-item-provider");
const CompletionLogger = __importStar(require("./logger"));
const anthropic_1 = require("./providers/anthropic");
const test_helpers_1 = require("./test-helpers");
const helpers_1 = require("./get-inline-completions-tests/helpers");
const parser_1 = require("../tree-sitter/parser");
const parse_tree_cache_1 = require("../tree-sitter/parse-tree-cache");
const grammars_1 = require("../tree-sitter/grammars");
vitest_1.vi.mock('vscode', () => ({
    ...mocks_1.vsCodeMocks,
    workspace: {
        ...mocks_1.vsCodeMocks.workspace,
        onDidChangeTextDocument() {
            return null;
        },
    },
}));
const DUMMY_CONTEXT = {
    selectedCompletionInfo: undefined,
    triggerKind: mocks_1.vsCodeMocks.InlineCompletionTriggerKind.Automatic,
};
const DUMMY_AUTH_STATUS = {
    endpoint: 'https://fastsourcegraph.com',
    isDotCom: true,
    isLoggedIn: true,
    showInvalidAccessTokenError: false,
    authenticated: true,
    hasVerifiedEmail: true,
    requiresVerifiedEmail: true,
    siteHasCodyEnabled: true,
    siteVersion: '1234',
    primaryEmail: 'heisenberg@exmaple.com',
    username: 'uwu',
    displayName: 'w.w.',
    avatarURL: '',
    userCanUpgrade: false,
};
cody_shared_1.graphqlClient.onConfigurationChange({});
class MockableInlineCompletionItemProvider extends inline_completion_item_provider_1.InlineCompletionItemProvider {
    constructor(mockGetInlineCompletions, superArgs) {
        super({
            completeSuggestWidgetSelection: true,
            // Most of these are just passed directly to `getInlineCompletions`, which we've mocked, so
            // we can just make them `null`.
            //
            statusBar: null,
            providerConfig: (0, anthropic_1.createProviderConfig)({
                client: null,
            }),
            triggerNotice: null,
            authStatus: DUMMY_AUTH_STATUS,
            ...superArgs,
        });
        this.getInlineCompletions = mockGetInlineCompletions;
    }
}
(0, vitest_1.describe)('InlineCompletionItemProvider', () => {
    (0, vitest_1.beforeAll)(async () => {
        await (0, helpers_1.initCompletionProviderConfig)({});
    });
    (0, vitest_1.it)('returns results that span the whole line', async () => {
        const { document, position } = (0, test_helpers_1.documentAndPosition)('const foo = █', 'typescript');
        const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
            logId: '1',
            items: [{ insertText: 'test', range: new mocks_1.vsCodeMocks.Range(position, position) }],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
        const provider = new MockableInlineCompletionItemProvider(fn);
        const result = await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result.items.map(item => item.range)).toMatchInlineSnapshot(`
          [
            Range {
              "end": Position {
                "character": 12,
                "line": 0,
              },
              "start": Position {
                "character": 0,
                "line": 0,
              },
            },
          ]
        `);
    });
    (0, vitest_1.it)('prevents completions inside comments', async () => {
        try {
            const { document, position } = (0, test_helpers_1.documentAndPosition)('// █', 'typescript');
            await (0, test_helpers_1.initTreeSitterParser)();
            const parser = (0, parser_1.getParser)(grammars_1.SupportedLanguage.TypeScript);
            if (parser) {
                (0, parse_tree_cache_1.updateParseTreeCache)(document, parser);
            }
            const fn = vitest_1.vi.fn();
            const provider = new MockableInlineCompletionItemProvider(fn, {
                disableInsideComments: true,
            });
            const result = await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            (0, vitest_1.expect)(result).toBeNull();
            (0, vitest_1.expect)(fn).not.toHaveBeenCalled();
        }
        finally {
            (0, parser_1.resetParsersCache)();
        }
    });
    (0, vitest_1.it)('saves lastInlineCompletionResult', async () => {
        const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                const foo = █
                console.log(1)
                console.log(2)
            `, 'typescript');
        const item = {
            insertText: 'test',
            range: new mocks_1.vsCodeMocks.Range(position, position),
        };
        const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
            logId: '1',
            items: [item],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
        const provider = new MockableInlineCompletionItemProvider(fn);
        // Initially it is undefined.
        (0, vitest_1.expect)(provider.lastCandidate).toBeUndefined();
        // No lastInlineCompletionResult is provided on the 1st call.
        await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
        (0, vitest_1.expect)(fn.mock.calls.map(call => call[0].lastCandidate)).toEqual([undefined]);
        fn.mockReset();
        // But it is returned and saved.
        (0, vitest_1.expect)((0, textDocument_1.withPosixPaths)(provider.lastCandidate)).toMatchInlineSnapshot(`
          {
            "lastTriggerDocContext": {
              "currentLinePrefix": "const foo = ",
              "currentLineSuffix": "",
              "injectedPrefix": null,
              "multilineTrigger": null,
              "multilineTriggerPosition": null,
              "nextNonEmptyLine": "console.log(1)",
              "position": Position {
                "character": 12,
                "line": 0,
              },
              "prefix": "const foo = ",
              "prevNonEmptyLine": "",
              "suffix": "
          console.log(1)
          console.log(2)",
            },
            "lastTriggerPosition": Position {
              "character": 12,
              "line": 0,
            },
            "lastTriggerSelectedCompletionInfo": undefined,
            "result": {
              "items": [
                {
                  "insertText": "test",
                  "range": Range {
                    "end": Position {
                      "character": 12,
                      "line": 0,
                    },
                    "start": Position {
                      "character": 12,
                      "line": 0,
                    },
                  },
                },
              ],
              "logId": "1",
              "source": "Network",
            },
            "uri": {
              "$mid": 1,
              "path": "/test.ts",
              "scheme": "file",
            },
          }
        `);
        // On the 2nd call, lastInlineCompletionResult is provided.
        await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
        (0, vitest_1.expect)(fn.mock.calls.map(call => call[0].lastCandidate?.result.items)).toEqual([[item]]);
    });
    (0, vitest_1.describe)('onboarding', () => {
        // Set up local storage backed by an object. Local storage is used to
        // track whether a completion was accepted for the first time.
        let localStorageData = {};
        LocalStorageProvider_1.localStorage.setStorage({
            get: (key) => localStorageData[key],
            update: (key, value) => {
                localStorageData[key] = value;
            },
        });
        (0, vitest_1.beforeEach)(() => {
            localStorageData = {};
        });
        (0, vitest_1.it)('triggers notice the first time an inline completion is accepted', async () => {
            const { document, position } = (0, test_helpers_1.documentAndPosition)('const foo = █', 'typescript');
            const logId = '1';
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId,
                items: [{ insertText: 'bar', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const triggerNotice = vitest_1.vi.fn();
            const provider = new MockableInlineCompletionItemProvider(fn, {
                triggerNotice,
            });
            const completions = await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            (0, vitest_1.expect)(completions).not.toBeNull();
            (0, vitest_1.expect)(completions?.items).not.toHaveLength(0);
            // Shouldn't have been called yet.
            (0, vitest_1.expect)(triggerNotice).not.toHaveBeenCalled();
            // Called on first accept.
            await provider.handleDidAcceptCompletionItem(completions.items[0]);
            (0, vitest_1.expect)(triggerNotice).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(triggerNotice).toHaveBeenCalledWith({ key: 'onboarding-autocomplete' });
            // Not called on second accept.
            await provider.handleDidAcceptCompletionItem(completions.items[0]);
            (0, vitest_1.expect)(triggerNotice).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('does not triggers notice the first time an inline complation is accepted if not a new install', async () => {
            await LocalStorageProvider_1.localStorage.setChatHistory(DUMMY_AUTH_STATUS, {
                chat: { a: null },
                input: [{ inputText: '', inputContextFiles: [] }],
            });
            const { document, position } = (0, test_helpers_1.documentAndPosition)('const foo = █', 'typescript');
            const logId = '1';
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId,
                items: [{ insertText: 'bar', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const triggerNotice = vitest_1.vi.fn();
            const provider = new MockableInlineCompletionItemProvider(fn, {
                triggerNotice,
            });
            const completions = await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            (0, vitest_1.expect)(completions).not.toBeNull();
            (0, vitest_1.expect)(completions?.items).not.toHaveLength(0);
            // Accepting completion should not have triggered the notice.
            await provider.handleDidAcceptCompletionItem(completions.items[0]);
            (0, vitest_1.expect)(triggerNotice).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('logger', () => {
        (0, vitest_1.it)('logs a completion as shown', async () => {
            const spy = vitest_1.vi.spyOn(CompletionLogger, 'suggested');
            const { document, position } = (0, test_helpers_1.documentAndPosition)('const foo = █', 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: 'bar', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            (0, vitest_1.expect)(spy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('does not log a completion when the abort handler was triggered after a network fetch', async () => {
            const spy = vitest_1.vi.spyOn(CompletionLogger, 'suggested');
            let onCancel = () => { };
            const token = {
                isCancellationRequested: false,
                onCancellationRequested(fn) {
                    onCancel = fn;
                    return { dispose: () => { } };
                },
            };
            function cancel() {
                token.isCancellationRequested = true;
                onCancel();
            }
            const { document, position } = (0, test_helpers_1.documentAndPosition)('const foo = █', 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockImplementation(() => {
                cancel();
                return Promise.resolve({
                    logId: '1',
                    items: [{ insertText: 'bar', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                    source: get_inline_completions_1.InlineCompletionsResultSource.Network,
                });
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT, token);
            (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('does not log a completion if it does not overlap the completion popup', async () => {
            const spy = vitest_1.vi.spyOn(CompletionLogger, 'suggested');
            const { document, position } = (0, test_helpers_1.documentAndPosition)('console.█', 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: 'log()', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            await provider.provideInlineCompletionItems(document, position, {
                triggerKind: mocks_1.vsCodeMocks.InlineCompletionTriggerKind.Automatic,
                selectedCompletionInfo: { text: 'dir', range: new mocks_1.vsCodeMocks.Range(0, 8, 0, 8) },
            });
            (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('log a completion if the suffix is inside the completion', async () => {
            const spy = vitest_1.vi.spyOn(CompletionLogger, 'suggested');
            const { document, position } = (0, test_helpers_1.documentAndPosition)('const a = [1, █];', 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: '2] ;', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            (0, vitest_1.expect)(spy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('log a completion if the suffix is inside the completion in CRLF format', async () => {
            const spy = vitest_1.vi.spyOn(CompletionLogger, 'suggested');
            const { document, position } = (0, test_helpers_1.documentAndPosition)('const a = [1, █];\r\nconsol.log(1234);\r\n', 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: '2] ;', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            (0, vitest_1.expect)(spy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('does not log a completion if the suffix does not match', async () => {
            const spy = vitest_1.vi.spyOn(CompletionLogger, 'suggested');
            const { document, position } = (0, test_helpers_1.documentAndPosition)('const a = [1, █)(123);', 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: '2];', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('completeSuggestWidgetSelection', () => {
        (0, vitest_1.it)('does not append the current selected widget item to the doc context on a new request', async () => {
            const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                    function foo() {
                        console.l█
                        console.foo()
                    }
                `, 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: "('hello world!')", range: new mocks_1.vsCodeMocks.Range(1, 12, 1, 13) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            const items = await provider.provideInlineCompletionItems(document, position, {
                triggerKind: mocks_1.vsCodeMocks.InlineCompletionTriggerKind.Automatic,
                selectedCompletionInfo: { text: 'log', range: new mocks_1.vsCodeMocks.Range(1, 12, 1, 13) },
            });
            (0, vitest_1.expect)(fn).toBeCalledWith(vitest_1.expect.objectContaining({
                docContext: vitest_1.expect.objectContaining({
                    prefix: 'function foo() {\n    console.l',
                    suffix: '\n    console.foo()\n}',
                    currentLinePrefix: '    console.l',
                    currentLineSuffix: '',
                    nextNonEmptyLine: '    console.foo()',
                    prevNonEmptyLine: 'function foo() {',
                }),
            }));
            (0, vitest_1.expect)(items).toBe(null);
        });
        (0, vitest_1.it)('appends the current selected widget item to the doc context for the completer from the result when the context item was changed', async () => {
            const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                    function foo() {
                        console.█
                        console.foo()
                    }
                `, 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [
                    { insertText: "log('hello world!')", range: new mocks_1.vsCodeMocks.Range(1, 12, 1, 12) },
                ],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            // Ignore the first call, it will not use the selected completion info
            await provider.provideInlineCompletionItems(document, position, {
                triggerKind: mocks_1.vsCodeMocks.InlineCompletionTriggerKind.Automatic,
                selectedCompletionInfo: { text: 'dir', range: new mocks_1.vsCodeMocks.Range(1, 12, 1, 12) },
            });
            const items = await provider.provideInlineCompletionItems(document, position, {
                triggerKind: mocks_1.vsCodeMocks.InlineCompletionTriggerKind.Automatic,
                selectedCompletionInfo: { text: 'log', range: new mocks_1.vsCodeMocks.Range(1, 12, 1, 12) },
            });
            (0, vitest_1.expect)(fn).toBeCalledWith(vitest_1.expect.objectContaining({
                docContext: vitest_1.expect.objectContaining({
                    prefix: 'function foo() {\n    console.log',
                    suffix: '\n    console.foo()\n}',
                    currentLinePrefix: '    console.log',
                    currentLineSuffix: '',
                    nextNonEmptyLine: '    console.foo()',
                    prevNonEmptyLine: 'function foo() {',
                }),
            }));
            (0, vitest_1.expect)(items?.items.map(item => item.analyticsItem)).toMatchInlineSnapshot(`
              [
                {
                  "insertText": "log('hello world!')",
                  "range": Range {
                    "end": Position {
                      "character": 12,
                      "line": 1,
                    },
                    "start": Position {
                      "character": 12,
                      "line": 1,
                    },
                  },
                },
              ]
            `);
        });
        (0, vitest_1.it)('does not trigger a completion request if the current document context would not allow a suggestion to be shown', async () => {
            // This case happens when the selected item in the dropdown does not start with the
            // exact characters that are already in the document.
            // Here, the user has `console.l` in the document but the selected item is `dir`. There
            // is no way to trigger an inline completion in VS Code for this scenario right now so
            // we skip the request entirely.
            const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                    function foo() {
                        console.l█
                        console.foo()
                    }
                `, 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: 'dir', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            const items = await provider.provideInlineCompletionItems(document, position, {
                triggerKind: mocks_1.vsCodeMocks.InlineCompletionTriggerKind.Automatic,
                selectedCompletionInfo: { text: 'dir', range: new mocks_1.vsCodeMocks.Range(1, 12, 1, 13) },
            });
            (0, vitest_1.expect)(fn).not.toHaveBeenCalled();
            (0, vitest_1.expect)(items).toBe(null);
        });
        (0, vitest_1.it)('passes forward the last accepted completion item', async () => {
            const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                    function foo() {
                        console.l█
                    }
                `, 'typescript');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockResolvedValue({
                logId: '1',
                items: [{ insertText: 'og();', range: new mocks_1.vsCodeMocks.Range(position, position) }],
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
            });
            const provider = new MockableInlineCompletionItemProvider(fn);
            const completions = await provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT);
            await provider.handleDidAcceptCompletionItem(completions.items[0]);
            const { document: updatedDocument, position: updatedPosition } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                    function foo() {
                        console.log();█
                    }
                `, 'typescript');
            await provider.provideInlineCompletionItems(updatedDocument, updatedPosition, DUMMY_CONTEXT);
            (0, vitest_1.expect)(fn).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                lastAcceptedCompletionItem: vitest_1.expect.objectContaining({
                    analyticsItem: vitest_1.expect.objectContaining({
                        insertText: 'og();',
                    }),
                }),
            }));
        });
    });
    (0, vitest_1.describe)('error reporting', () => {
        (0, vitest_1.beforeEach)(() => {
            vitest_1.vi.useFakeTimers();
            vitest_1.vi.setSystemTime(new Date(2000, 1, 1, 13, 0, 0, 0));
        });
        (0, vitest_1.afterEach)(() => {
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('reports standard rate limit errors to the user once', async () => {
            const { document, position } = (0, test_helpers_1.documentAndPosition)('█');
            const fn = vitest_1.vi
                .fn(get_inline_completions_1.getInlineCompletions)
                .mockRejectedValue(new cody_shared_1.RateLimitError('autocompletions', 'rate limited oh no', false, 1234, '86400'));
            const addError = vitest_1.vi.fn();
            const provider = new MockableInlineCompletionItemProvider(fn, {
                statusBar: { addError, hasError: () => addError.mock.calls.length },
            });
            await (0, vitest_1.expect)(provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT)).rejects.toThrow('rate limited oh no');
            (0, vitest_1.expect)(addError).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                title: 'Cody Autocomplete Disabled Due to Rate Limit',
                description: "You've used all autocompletions for today. Usage will reset tomorrow at 1:00 PM",
            }));
            await (0, vitest_1.expect)(provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT)).rejects.toThrow('rate limited oh no');
            (0, vitest_1.expect)(addError).toHaveBeenCalledTimes(1);
        });
        vitest_1.it.each([{ canUpgrade: true }, { canUpgrade: false }])('reports correct message when canUpgrade=$canUpgrade', async ({ canUpgrade }) => {
            const { document, position } = (0, test_helpers_1.documentAndPosition)('█');
            const fn = vitest_1.vi
                .fn(get_inline_completions_1.getInlineCompletions)
                .mockRejectedValue(new cody_shared_1.RateLimitError('autocompletions', 'rate limited oh no', canUpgrade, 1234));
            const addError = vitest_1.vi.fn();
            const provider = new MockableInlineCompletionItemProvider(fn, {
                statusBar: { addError, hasError: () => addError.mock.calls.length },
            });
            await (0, vitest_1.expect)(provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT)).rejects.toThrow('rate limited oh no');
            (0, vitest_1.expect)(addError).toHaveBeenCalledWith(canUpgrade
                ? vitest_1.expect.objectContaining({
                    title: 'Upgrade to Continue Using Cody Autocomplete',
                    description: "You've used all autocompletions for the month.",
                })
                : vitest_1.expect.objectContaining({
                    title: 'Cody Autocomplete Disabled Due to Rate Limit',
                    description: "You've used all autocompletions for today.",
                }));
            await (0, vitest_1.expect)(provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT)).rejects.toThrow('rate limited oh no');
            (0, vitest_1.expect)(addError).toHaveBeenCalledTimes(1);
        });
        vitest_1.it.skip('reports unexpected errors grouped by their message once', async () => {
            const { document, position } = (0, test_helpers_1.documentAndPosition)('█');
            let error = new Error('unexpected');
            const fn = vitest_1.vi.fn(get_inline_completions_1.getInlineCompletions).mockImplementation(() => Promise.reject(error));
            const addError = vitest_1.vi.fn();
            const provider = new MockableInlineCompletionItemProvider(fn, {
                statusBar: { addError, hasError: () => addError.mock.calls.length },
            });
            await (0, vitest_1.expect)(provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT)).rejects.toThrow('unexpected');
            (0, vitest_1.expect)(addError).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                title: 'Cody Autocomplete Encountered an Unexpected Error',
                description: 'unexpected',
            }));
            await (0, vitest_1.expect)(provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT)).rejects.toThrow('unexpected');
            (0, vitest_1.expect)(addError).toHaveBeenCalledTimes(1);
            error = new Error('different');
            await (0, vitest_1.expect)(provider.provideInlineCompletionItems(document, position, DUMMY_CONTEXT)).rejects.toThrow('different');
            (0, vitest_1.expect)(addError).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                title: 'Cody Autocomplete Encountered an Unexpected Error',
                description: 'different',
            }));
        });
    });
});
