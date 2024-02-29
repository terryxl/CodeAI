"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const textDocument_1 = require("../testutils/textDocument");
const parse_tree_cache_1 = require("../tree-sitter/parse-tree-cache");
const parser_1 = require("../tree-sitter/parser");
const doc_context_getters_1 = require("./doc-context-getters");
const get_current_doc_context_1 = require("./get-current-doc-context");
const test_helpers_1 = require("./test-helpers");
function testGetCurrentDocContext(code, context) {
    const { document, position } = (0, test_helpers_1.documentAndPosition)(code);
    return (0, get_current_doc_context_1.getCurrentDocContext)({
        document,
        position,
        maxPrefixLength: 100,
        maxSuffixLength: 100,
        context,
        dynamicMultilineCompletions: false,
    });
}
(0, vitest_1.describe)('getCurrentDocContext', () => {
    (0, vitest_1.it)('returns `docContext` for a function block', () => {
        const result = testGetCurrentDocContext('function myFunction() {\n  █');
        (0, vitest_1.expect)(result).toEqual({
            prefix: 'function myFunction() {\n  ',
            suffix: '',
            currentLinePrefix: '  ',
            currentLineSuffix: '',
            prevNonEmptyLine: 'function myFunction() {',
            nextNonEmptyLine: '',
            multilineTrigger: '{',
            multilineTriggerPosition: {
                character: 22,
                line: 0,
            },
            injectedPrefix: null,
            position: { character: 2, line: 1 },
        });
    });
    (0, vitest_1.it)('returns `docContext` for an if block', () => {
        const result = testGetCurrentDocContext('const x = 1\nif (true) {\n  █\n}');
        (0, vitest_1.expect)(result).toEqual({
            prefix: 'const x = 1\nif (true) {\n  ',
            suffix: '\n}',
            currentLinePrefix: '  ',
            currentLineSuffix: '',
            prevNonEmptyLine: 'if (true) {',
            nextNonEmptyLine: '}',
            multilineTrigger: '{',
            multilineTriggerPosition: {
                character: 10,
                line: 1,
            },
            injectedPrefix: null,
            position: { character: 2, line: 2 },
        });
    });
    (0, vitest_1.it)('returns correct multi-line trigger', () => {
        const result = testGetCurrentDocContext('const arr = [█\n];');
        (0, vitest_1.expect)(result).toEqual({
            prefix: 'const arr = [',
            suffix: '\n];',
            currentLinePrefix: 'const arr = [',
            currentLineSuffix: '',
            prevNonEmptyLine: '',
            nextNonEmptyLine: '];',
            multilineTrigger: '[',
            multilineTriggerPosition: {
                character: 12,
                line: 0,
            },
            injectedPrefix: null,
            position: { character: 13, line: 0 },
        });
    });
    (0, vitest_1.it)('removes \\r from the same current line suffix, prefix, and suffix', () => {
        const result = testGetCurrentDocContext('console.log(1337);\r\nconst arr = [█\r\n];');
        (0, vitest_1.expect)(result).toEqual({
            prefix: 'console.log(1337);\nconst arr = [',
            suffix: '\n];',
            currentLinePrefix: 'const arr = [',
            currentLineSuffix: '',
            prevNonEmptyLine: 'console.log(1337);',
            nextNonEmptyLine: '];',
            multilineTrigger: '[',
            multilineTriggerPosition: {
                character: 12,
                line: 1,
            },
            injectedPrefix: null,
            position: { character: 13, line: 1 },
        });
    });
    (0, vitest_1.it)('injects the selected item from the suggestions widget into the prompt when it overlaps', () => {
        const result = testGetCurrentDocContext((0, dedent_1.default) `
                console.a█
            `, {
            triggerKind: 0,
            selectedCompletionInfo: {
                range: (0, textDocument_1.range)(0, 7, 0, 9),
                text: '.assert',
            },
        });
        (0, vitest_1.expect)(result).toEqual({
            prefix: 'console.assert',
            suffix: '',
            currentLinePrefix: 'console.assert',
            currentLineSuffix: '',
            prevNonEmptyLine: '',
            nextNonEmptyLine: '',
            multilineTrigger: null,
            multilineTriggerPosition: null,
            injectedPrefix: 'ssert',
            position: { character: 9, line: 0 },
        });
    });
    (0, vitest_1.it)('injects the selected item from the suggestions widget into the prompt when it does not overlap', () => {
        const result = testGetCurrentDocContext((0, dedent_1.default) `
                // some line before
                console.█
            `, {
            triggerKind: 0,
            selectedCompletionInfo: {
                range: (0, textDocument_1.range)(1, 8, 1, 8),
                text: 'log',
            },
        });
        (0, vitest_1.expect)(result).toEqual({
            prefix: '// some line before\nconsole.log',
            suffix: '',
            currentLinePrefix: 'console.log',
            currentLineSuffix: '',
            prevNonEmptyLine: '// some line before',
            nextNonEmptyLine: '',
            multilineTrigger: null,
            multilineTriggerPosition: null,
            injectedPrefix: 'log',
            position: { character: 8, line: 1 },
        });
    });
    (0, vitest_1.it)('handles suggestion widget items at the end of the word', () => {
        const result = testGetCurrentDocContext((0, dedent_1.default) `
                console█
            `, {
            triggerKind: 0,
            selectedCompletionInfo: {
                range: (0, textDocument_1.range)(0, 0, 0, 7),
                text: 'console',
            },
        });
        (0, vitest_1.expect)(result).toEqual({
            prefix: 'console',
            suffix: '',
            currentLinePrefix: 'console',
            currentLineSuffix: '',
            prevNonEmptyLine: '',
            nextNonEmptyLine: '',
            multilineTrigger: null,
            multilineTriggerPosition: null,
            injectedPrefix: null,
            position: { character: 7, line: 0 },
        });
    });
    (0, vitest_1.describe)('multiline triggers', () => {
        let parser;
        function prepareTest(params) {
            const { dynamicMultilineCompletions, code, langaugeId } = params;
            const { document, position } = (0, test_helpers_1.documentAndPosition)(code, langaugeId);
            const tree = parser.parse(document.getText());
            const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
                document,
                position,
                maxPrefixLength: 100,
                maxSuffixLength: 100,
                dynamicMultilineCompletions,
            });
            return { tree, docContext };
        }
        (0, vitest_1.beforeAll)(async () => {
            const initializedParser = await (0, test_helpers_1.initTreeSitterParser)();
            if (initializedParser === undefined) {
                throw new Error('Could not initialize tree-sitter parser');
            }
            parser = initializedParser;
        });
        (0, vitest_1.afterAll)(() => {
            (0, parser_1.resetParsersCache)();
        });
        (0, vitest_1.describe)('with enabled dynamicMultilineCompletions', () => {
            vitest_1.it.each([
                (0, dedent_1.default) `
                    def greatest_common_divisor(a, b):█
                `,
                (0, dedent_1.default) `
                    def greatest_common_divisor(a, b):
                        if a == 0:█
                `,
                (0, dedent_1.default) `
                    def bubbleSort(arr):
                        n = len(arr)
                        for i in range(n-1):
                            █
                `,
            ])('detects the multiline trigger for python', code => {
                const { tree, docContext: { multilineTrigger, multilineTriggerPosition }, } = prepareTest({ code, dynamicMultilineCompletions: true, langaugeId: 'python' });
                const triggerNode = tree.rootNode.descendantForPosition((0, parse_tree_cache_1.asPoint)(multilineTriggerPosition));
                (0, vitest_1.expect)(multilineTrigger).toBe(triggerNode.text);
            });
            vitest_1.it.each([
                'const results = {█',
                'const result = {\n  █',
                'const result = {\n    █',
                'const something = true\nfunction bubbleSort(█)',
            ])('returns correct multiline trigger position', code => {
                const { tree, docContext: { multilineTrigger, multilineTriggerPosition }, } = prepareTest({ code, dynamicMultilineCompletions: true });
                const triggerNode = tree.rootNode.descendantForPosition((0, parse_tree_cache_1.asPoint)(multilineTriggerPosition));
                (0, vitest_1.expect)(multilineTrigger).toBe(triggerNode.text);
            });
            vitest_1.it.each([
                (0, dedent_1.default) `
                    detectMultilineTrigger(
                        █
                    )
                `,
                (0, dedent_1.default) `
                    const oddNumbers = [
                        █
                    ]
                `,
                (0, dedent_1.default) `
                    type Whatever = {
                        █
                    }
                `,
            ])('detects the multiline trigger on the new line inside of parentheses', code => {
                const { tree, docContext: { multilineTrigger, multilineTriggerPosition }, } = prepareTest({ code, dynamicMultilineCompletions: true });
                const triggerNode = tree.rootNode.descendantForPosition((0, parse_tree_cache_1.asPoint)(multilineTriggerPosition));
                (0, vitest_1.expect)(triggerNode.text).toBe(multilineTrigger);
            });
        });
        (0, vitest_1.describe)('with disabled dynamicMultilineCompletions', () => {
            vitest_1.it.each([
                (0, dedent_1.default) `
                    detectMultilineTrigger(
                        █
                    )
                `,
                (0, dedent_1.default) `
                    const oddNumbers = [
                        █
                    ]
                `,
            ])('does not detect the multiline trigger on the new line inside of parentheses', code => {
                const { multilineTrigger } = prepareTest({
                    code,
                    dynamicMultilineCompletions: false,
                }).docContext;
                (0, vitest_1.expect)(multilineTrigger).toBeNull();
            });
            vitest_1.it.each(['detectMultilineTrigger(█)', 'const oddNumbers = [█]', 'const result = {█}'])('detects the multiline trigger on the current line inside of parentheses', code => {
                const { tree, docContext: { multilineTrigger, multilineTriggerPosition }, } = prepareTest({ code, dynamicMultilineCompletions: true });
                const triggerNode = tree.rootNode.descendantForPosition((0, parse_tree_cache_1.asPoint)(multilineTriggerPosition));
                (0, vitest_1.expect)(triggerNode.text).toBe(multilineTrigger);
            });
        });
    });
});
(0, vitest_1.describe)('getContextRange', () => {
    (0, vitest_1.it)('returns the right range for the document context', () => {
        const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                function bubbleSort(arr) {
                    for (let i = 0; i < arr.length; i++) {
                        for (let j = 0; j < arr.length; j++) {
                            if (arr[i] > arr[j]) {

                                let temp = █;

                                arr[i] = arr[j];
                                arr[j] = temp;
                            }
                        }
                    }
                }
            `);
        const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
            document,
            position,
            maxPrefixLength: 140,
            maxSuffixLength: 60,
            dynamicMultilineCompletions: false,
        });
        const contextRange = (0, doc_context_getters_1.getContextRange)(document, docContext);
        (0, vitest_1.expect)(contextRange).toMatchInlineSnapshot(`
          Range {
            "end": Position {
              "character": 32,
              "line": 7,
            },
            "start": Position {
              "character": 0,
              "line": 2,
            },
          }
        `);
    });
});
(0, vitest_1.describe)('insertCompletionIntoDocContext', () => {
    (0, vitest_1.it)('inserts the completion and updates document prefix/suffix and cursor position', () => {
        const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                function helloWorld() {
                    █
                }
            `);
        const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
            document,
            position,
            maxPrefixLength: 140,
            maxSuffixLength: 60,
            dynamicMultilineCompletions: false,
        });
        const insertText = "console.log('hello')\n    console.log('world')";
        const updatedDocContext = (0, get_current_doc_context_1.insertIntoDocContext)({
            docContext,
            insertText,
            languageId: document.languageId,
            dynamicMultilineCompletions: false,
        });
        (0, vitest_1.expect)(updatedDocContext).toEqual({
            prefix: (0, dedent_1.default) `
                function helloWorld() {
                    console.log('hello')
                    console.log('world')`,
            suffix: '\n}',
            currentLinePrefix: "    console.log('world')",
            currentLineSuffix: '',
            injectedCompletionText: insertText,
            prevNonEmptyLine: "    console.log('hello')",
            nextNonEmptyLine: '}',
            multilineTrigger: null,
            multilineTriggerPosition: null,
            injectedPrefix: null,
            position: { character: 24, line: 2 },
            positionWithoutInjectedCompletionText: docContext.position,
        });
    });
    (0, vitest_1.it)('does not duplicate the insertion characters when an existing suffix is being replaced by the single-line completion', () => {
        const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                function helloWorld() {
                    console.log(█, 'world')
                }
            `);
        const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
            document,
            position,
            maxPrefixLength: 140,
            maxSuffixLength: 60,
            dynamicMultilineCompletions: false,
        });
        const insertText = "'hello', 'world')";
        const updatedDocContext = (0, get_current_doc_context_1.insertIntoDocContext)({
            docContext,
            insertText,
            languageId: document.languageId,
            dynamicMultilineCompletions: false,
        });
        (0, vitest_1.expect)(updatedDocContext).toEqual({
            prefix: (0, dedent_1.default) `
                function helloWorld() {
                    console.log('hello', 'world')`,
            suffix: '\n}',
            currentLinePrefix: "    console.log('hello', 'world')",
            currentLineSuffix: '',
            injectedCompletionText: insertText,
            prevNonEmptyLine: 'function helloWorld() {',
            nextNonEmptyLine: '}',
            multilineTrigger: null,
            multilineTriggerPosition: null,
            injectedPrefix: null,
            // Note: The position is always moved at the end of the line that the text was inserted
            position: { character: "    console.log('hello', 'world')".length, line: 1 },
            positionWithoutInjectedCompletionText: docContext.position,
        });
    });
    (0, vitest_1.it)('does not duplicate the insertion characters when an existing suffix is being replaced by the multi-line completion', () => {
        const { document, position } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                function helloWorld() {
                    f(1, {█2)
                }
            `);
        const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
            document,
            position,
            maxPrefixLength: 140,
            maxSuffixLength: 60,
            dynamicMultilineCompletions: false,
        });
        const insertText = '\n        propA: foo,\n        propB: bar,\n    }, 2)';
        const updatedDocContext = (0, get_current_doc_context_1.insertIntoDocContext)({
            docContext,
            insertText,
            languageId: document.languageId,
            dynamicMultilineCompletions: false,
        });
        (0, vitest_1.expect)(updatedDocContext).toEqual({
            prefix: (0, dedent_1.default) `
                function helloWorld() {
                    f(1, {
                        propA: foo,
                        propB: bar,
                    }, 2)
            `,
            suffix: '\n}',
            currentLinePrefix: '    }, 2)',
            currentLineSuffix: '',
            injectedCompletionText: insertText,
            prevNonEmptyLine: '        propB: bar,',
            nextNonEmptyLine: '}',
            multilineTrigger: null,
            multilineTriggerPosition: null,
            injectedPrefix: null,
            // Note: The position is always moved at the end of the line that the text was inserted
            position: { character: '    }, 2)'.length, line: 4 },
            positionWithoutInjectedCompletionText: docContext.position,
        });
    });
});
