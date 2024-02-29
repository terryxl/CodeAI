"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const test_helpers_1 = require("../../completions/test-helpers");
const mocks_1 = require("../../testutils/mocks");
const textDocument_1 = require("../../testutils/textDocument");
const document_sections_1 = require("./document-sections");
(0, vitest_1.describe)('getDocumentSections', () => {
    (0, vitest_1.it)('filters out top level classes for languages with closing braces and symbols', async () => {
        const doc = (0, test_helpers_1.document)((0, dedent_1.default) `
            class Foo {
                bar() {
                    function baz() {
                        // Oh no
                    }
                    return 1
                }
            }
        `);
        // Note: folding ranges do not span over the closing brace
        const foldingRanges = [
            { start: 0, end: 6 },
            { start: 1, end: 5 },
            { start: 2, end: 3 },
        ];
        const symbols = [
            {
                kind: mocks_1.vsCodeMocks.SymbolKind.Class,
                location: {
                    range: (0, textDocument_1.range)(0, 0, 7, 1),
                },
            },
        ];
        (0, vitest_1.expect)(await (0, document_sections_1.getDocumentSections)(doc, () => Promise.resolve(foldingRanges), () => Promise.resolve(symbols))).toMatchInlineSnapshot(`
              [
                Range {
                  "end": Position {
                    "character": 5,
                    "line": 6,
                  },
                  "start": Position {
                    "character": 0,
                    "line": 1,
                  },
                },
              ]
            `);
    });
    (0, vitest_1.it)('filters out top level classes for languages without closing braces and symbols', async () => {
        const doc = (0, test_helpers_1.document)((0, dedent_1.default) `
            class Foo {
                bar() {
                    function baz() {
                        // Oh no
                    }
                    return 1
                }
            }
        `);
        // Note: folding ranges do not span over the closing brace
        const foldingRanges = [
            { start: 0, end: 6 },
            { start: 1, end: 5 },
            { start: 2, end: 3 },
        ];
        const symbols = [
            {
                kind: mocks_1.vsCodeMocks.SymbolKind.Class,
                location: {
                    range: (0, textDocument_1.range)(0, 0, 7, 1),
                },
            },
        ];
        (0, vitest_1.expect)(await (0, document_sections_1.getDocumentSections)(doc, () => Promise.resolve(foldingRanges), () => Promise.resolve(symbols))).toMatchInlineSnapshot(`
          [
            Range {
              "end": Position {
                "character": 5,
                "line": 6,
              },
              "start": Position {
                "character": 0,
                "line": 1,
              },
            },
          ]
        `);
    });
    (0, vitest_1.it)('filters out large folding ranges from the top level', async () => {
        const doc = (0, test_helpers_1.document)((0, dedent_1.default) `
            describe('foo', () => {
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                // long
                it('is awesome', () => {
                    // Oh so awesome!
                })
            })
        `);
        // Note: folding ranges do not span over the closing brace
        const foldingRanges = [
            { start: 0, end: 104 },
            { start: 102, end: 103 },
        ];
        (0, vitest_1.expect)(await (0, document_sections_1.getDocumentSections)(doc, () => Promise.resolve(foldingRanges), () => Promise.resolve([]))).toMatchInlineSnapshot(`
              [
                Range {
                  "end": Position {
                    "character": 6,
                    "line": 104,
                  },
                  "start": Position {
                    "character": 0,
                    "line": 102,
                  },
                },
              ]
            `);
    });
    (0, vitest_1.it)('filters out what appears like classes for languages with no symbol support', async () => {
        const doc = (0, test_helpers_1.document)((0, dedent_1.default) `
                class Foo {
                    bar() {
                        function baz() {
                            // Oh no
                        }
                        return 1
                    }
                }
            `, 'plaintext');
        // Note: folding ranges do not span over the closing brace
        const foldingRanges = [
            { start: 0, end: 6 },
            { start: 1, end: 5 },
            { start: 2, end: 3 },
        ];
        (0, vitest_1.expect)(await (0, document_sections_1.getDocumentSections)(doc, () => Promise.resolve(foldingRanges), () => Promise.resolve([]))).toMatchInlineSnapshot(`
              [
                Range {
                  "end": Position {
                    "character": 5,
                    "line": 6,
                  },
                  "start": Position {
                    "character": 0,
                    "line": 1,
                  },
                },
              ]
            `);
    });
});
(0, vitest_1.describe)('findRangeByLine', () => {
    (0, vitest_1.it)('returns range containing target', () => {
        const first = (0, textDocument_1.range)(0, 0, 10, 10);
        const second = (0, textDocument_1.range)(20, 0, 30, 10);
        const ranges = [first, second];
        const target = 5;
        const result = (0, document_sections_1.findRangeByLine)(ranges, target);
        (0, vitest_1.expect)(result).toBe(first);
    });
    (0, vitest_1.it)('returns undefined if no range contains target', () => {
        const first = (0, textDocument_1.range)(0, 0, 10, 10);
        const second = (0, textDocument_1.range)(20, 0, 30, 10);
        const ranges = [first, second];
        const target = 15;
        const result = (0, document_sections_1.findRangeByLine)(ranges, target);
        (0, vitest_1.expect)(result).toBe(undefined);
    });
});
