"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const text_processing_1 = require("./text-processing");
(0, vitest_1.describe)('extractFromCodeBlock', () => {
    (0, vitest_1.it)('extracts value from code completion XML tags', () => {
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)(`hello world${text_processing_1.CLOSING_CODE_TAG}`)).toBe('hello world');
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)(`<randomTag>hello world</randomTag>${text_processing_1.CLOSING_CODE_TAG}`)).toBe('<randomTag>hello world</randomTag>');
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)(`const isEnabled = true${text_processing_1.CLOSING_CODE_TAG}something else`)).toBe('const isEnabled = true');
    });
    (0, vitest_1.it)('returns the whole string if the closing tag is not found', () => {
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)('hello world')).toBe('hello world');
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)('<randomTag>hello world</randomTag>')).toBe('<randomTag>hello world</randomTag>');
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)('const isEnabled = true // something else')).toBe('const isEnabled = true // something else');
    });
    (0, vitest_1.it)('returns an empty string if the opening tag is found', () => {
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)(`${text_processing_1.OPENING_CODE_TAG}hello world${text_processing_1.CLOSING_CODE_TAG}`)).toBe('');
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)(`hello world${text_processing_1.OPENING_CODE_TAG}`)).toBe('');
        (0, vitest_1.expect)((0, text_processing_1.extractFromCodeBlock)(text_processing_1.OPENING_CODE_TAG)).toBe('');
    });
});
(0, vitest_1.describe)('trimLeadingWhitespaceUntilNewline', () => {
    (0, vitest_1.test)('trims spaces', () => (0, vitest_1.expect)((0, text_processing_1.trimLeadingWhitespaceUntilNewline)('  \n  a')).toBe('\n  a'));
    (0, vitest_1.test)('preserves carriage returns', () => (0, vitest_1.expect)((0, text_processing_1.trimLeadingWhitespaceUntilNewline)('\t\r\n  a')).toBe('\r\n  a'));
});
(0, vitest_1.describe)('collapseDuplicativeWhitespace', () => {
    (0, vitest_1.test)('trims space', () => (0, vitest_1.expect)((0, text_processing_1.collapseDuplicativeWhitespace)('x = ', ' 7')).toBe('7'));
    (0, vitest_1.test)('trims identical duplicative whitespace chars', () => (0, vitest_1.expect)((0, text_processing_1.collapseDuplicativeWhitespace)('x =\t ', '\t 7')).toBe('7'));
    (0, vitest_1.test)('trims non-identical duplicative whitespace chars', () => (0, vitest_1.expect)((0, text_processing_1.collapseDuplicativeWhitespace)('x =\t ', '  7')).toBe('7'));
    (0, vitest_1.test)('trims more whitespace chars from completion than in prefix', () => {
        (0, vitest_1.expect)((0, text_processing_1.collapseDuplicativeWhitespace)('x = ', '  7')).toBe('7');
        (0, vitest_1.expect)((0, text_processing_1.collapseDuplicativeWhitespace)('x = ', '\t 7')).toBe('7');
    });
    (0, vitest_1.test)('does not trim newlines', () => {
        (0, vitest_1.expect)((0, text_processing_1.collapseDuplicativeWhitespace)('x = ', '\n7')).toBe('\n7');
    });
});
