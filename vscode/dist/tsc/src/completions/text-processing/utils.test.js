"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const utils_1 = require("./utils");
(0, vitest_1.describe)('getNextNonEmptyLine', () => {
    vitest_1.it.each(withCRLFExamples([
        ['foo\nbar', 'bar'],
        ['foo\nbar\nbaz', 'bar'],
        ['foo\n\nbar', 'bar'],
        ['foo\n  \nbar', 'bar'],
        ['\nbar', 'bar'],
        ['foo', ''],
        ['foo\n', ''],
        ['', ''],
    ]))('should work for %j', (suffix, expected) => {
        (0, vitest_1.expect)((0, utils_1.getNextNonEmptyLine)(suffix)).toBe(expected);
    });
});
(0, vitest_1.describe)('getPrevNonEmptyLine', () => {
    vitest_1.it.each(withCRLFExamples([
        ['foo\nbar', 'foo'],
        ['foo\nbar\nbaz', 'bar'],
        ['foo\n\nbar', 'foo'],
        ['foo\n  \nbar', 'foo'],
        ['bar', ''],
        ['bar\n', 'bar'],
        ['\nbar', ''],
        ['', ''],
    ]))('should work for %j', (suffix, expected) => {
        (0, vitest_1.expect)((0, utils_1.getPrevNonEmptyLine)(suffix)).toBe(expected);
    });
});
(0, vitest_1.describe)('lines', () => {
    vitest_1.it.each([
        ['foo\nbar\nbaz', ['foo', 'bar', 'baz']],
        ['foo\r\nbar\r\nbaz', ['foo', 'bar', 'baz']],
        ['foo\rbar\r\nbaz', ['foo\rbar', 'baz']],
        ['\n\r\n\r\n\r\n', ['', '', '', '', '']],
        ['\n\n\n', ['', '', '', '']],
    ])('should work for %j', (text, expected) => {
        (0, vitest_1.expect)((0, utils_1.lines)(text)).toEqual(expected);
    });
});
(0, vitest_1.describe)('getFirstLine', () => {
    vitest_1.it.each(withCRLFExamples([
        ['foo\nbar', 'foo'],
        ['foo\nbar\nbaz', 'foo'],
        ['foo\n\nbar', 'foo'],
        ['foo\n  \nbar', 'foo'],
        ['bar', 'bar'],
        ['bar\n', 'bar'],
        ['\nbar', ''],
        ['', ''],
    ]))('should work for %j', (text, expected) => {
        (0, vitest_1.expect)((0, utils_1.getFirstLine)(text)).toEqual(expected);
    });
});
(0, vitest_1.describe)('getLastLine', () => {
    vitest_1.it.each(withCRLFExamples([
        ['foo\nbar', 'bar'],
        ['foo\nbar\nbaz', 'baz'],
        ['foo\n\nbar', 'bar'],
        ['foo\n  \nbar', 'bar'],
        ['bar', 'bar'],
        ['bar\n', ''],
        ['\nbar', 'bar'],
        ['', ''],
    ]))('should work for %j', (text, expected) => {
        (0, vitest_1.expect)((0, utils_1.getLastLine)(text)).toEqual(expected);
    });
});
function withCRLFExamples(examples) {
    const crlfExample = [];
    for (const example of examples) {
        crlfExample.push(example.map(line => line.replaceAll('\n', '\r\n')));
    }
    return examples.concat(crlfExample);
}
(0, vitest_1.describe)('removeIndentation', () => {
    vitest_1.it.each([
        ['  foo', 'foo'],
        ['    bar', 'bar'],
        ['\tfoo', 'foo'],
        ['foo', 'foo'],
        ['\tfoo\n  bar', 'foo\nbar'],
        ['\tfoo\r\n  bar', 'foo\r\nbar'],
        ['', ''],
    ])('should work for %j', (text, expected) => {
        (0, vitest_1.expect)((0, utils_1.removeIndentation)(text)).toEqual(expected);
    });
});
