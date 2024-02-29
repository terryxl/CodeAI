"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const code_count_1 = require("./code-count");
(0, vitest_1.describe)('countCode', () => {
    (0, vitest_1.it)('counts lines correctly', () => {
        const code = `line1
  line2
  line3`;
        const result = (0, code_count_1.countCode)(code);
        (0, vitest_1.expect)(result.lineCount).toBe(3);
    });
    (0, vitest_1.it)('counts characters correctly', () => {
        const code = 'foo bar';
        const result = (0, code_count_1.countCode)(code);
        (0, vitest_1.expect)(result.charCount).toBe(7);
    });
    (0, vitest_1.it)('handles windows line endings', () => {
        const code = 'line1\r\nline2\r\nline3';
        const result = (0, code_count_1.countCode)(code);
        (0, vitest_1.expect)(result.lineCount).toBe(3);
    });
    (0, vitest_1.it)('handles empty string', () => {
        const code = '';
        const result = (0, code_count_1.countCode)(code);
        (0, vitest_1.expect)(result.lineCount).toBe(1);
        (0, vitest_1.expect)(result.charCount).toBe(0);
    });
});
(0, vitest_1.describe)('matchCodeSnippets', () => {
    (0, vitest_1.it)('returns false if either input is empty', () => {
        (0, vitest_1.expect)((0, code_count_1.matchCodeSnippets)('', 'foo')).toBe(false);
        (0, vitest_1.expect)((0, code_count_1.matchCodeSnippets)('foo', '')).toBe(false);
    });
    (0, vitest_1.it)('returns true if inputs match without whitespace', () => {
        const copied = 'foo\nbar';
        const changed = 'foobar';
        (0, vitest_1.expect)((0, code_count_1.matchCodeSnippets)(copied, changed)).toBe(true);
    });
    (0, vitest_1.it)('returns false if inputs do not match without whitespace', () => {
        const copied = 'foo\nbar';
        const changed = 'foobaz';
        (0, vitest_1.expect)((0, code_count_1.matchCodeSnippets)(copied, changed)).toBe(false);
    });
    (0, vitest_1.it)('handles trailing whitespace correctly', () => {
        const copied = 'foo ';
        const changed = 'foo';
        (0, vitest_1.expect)((0, code_count_1.matchCodeSnippets)(copied, changed)).toBe(true);
    });
});
