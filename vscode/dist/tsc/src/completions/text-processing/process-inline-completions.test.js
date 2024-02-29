"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const textDocument_1 = require("../../testutils/textDocument");
const test_helpers_1 = require("../test-helpers");
const process_inline_completions_1 = require("./process-inline-completions");
(0, vitest_1.describe)('adjustRangeToOverwriteOverlappingCharacters', () => {
    (0, vitest_1.it)('no adjustment at end of line', () => {
        const item = { insertText: 'array) {' };
        const { position } = (0, test_helpers_1.documentAndPosition)('function sort(█');
        (0, vitest_1.expect)((0, process_inline_completions_1.getRangeAdjustedForOverlappingCharacters)(item, {
            position,
            currentLineSuffix: '',
        })).toBeUndefined();
    });
    (0, vitest_1.it)('no adjustment if completion does not match current line suffix', () => {
        const item = { insertText: '"argument1", true' };
        const { position } = (0, test_helpers_1.documentAndPosition)('myFunction(█)');
        (0, vitest_1.expect)((0, process_inline_completions_1.getRangeAdjustedForOverlappingCharacters)(item, {
            position,
            currentLineSuffix: ')',
        })).toBeUndefined();
    });
    (0, vitest_1.it)('handles non-empty currentLineSuffix', () => {
        const item = { insertText: 'array) {' };
        const { position } = (0, test_helpers_1.documentAndPosition)('function sort(█)');
        (0, vitest_1.expect)((0, process_inline_completions_1.getRangeAdjustedForOverlappingCharacters)(item, {
            position,
            currentLineSuffix: ')',
        })).toEqual((0, textDocument_1.range)(0, 14, 0, 15));
    });
    (0, vitest_1.it)('handles partial currentLineSuffix match', () => {
        const item = { insertText: 'array) {' };
        const { document, position } = (0, test_helpers_1.documentAndPosition)('function sort(█) {}');
        const replaceRange = (0, process_inline_completions_1.getRangeAdjustedForOverlappingCharacters)(item, {
            position,
            currentLineSuffix: ') {}',
        });
        (0, vitest_1.expect)(document.getText(replaceRange)).toEqual(') {');
    });
    (0, vitest_1.it)('handles whitespace in currentLineSuffix', () => {
        const item = { insertText: 'array) {' };
        const { position } = (0, test_helpers_1.documentAndPosition)('function sort(█)');
        (0, vitest_1.expect)((0, process_inline_completions_1.getRangeAdjustedForOverlappingCharacters)(item, {
            position,
            currentLineSuffix: ') ',
        })).toEqual((0, textDocument_1.range)(0, 14, 0, 16));
    });
});
