"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const truncate_parsed_completion_1 = require("./truncate-parsed-completion");
(0, vitest_1.describe)('insertAllMissingBrackets', () => {
    (0, vitest_1.it)('handles an empty string', () => {
        (0, vitest_1.expect)((0, truncate_parsed_completion_1.insertMissingBrackets)('')).toEqual('');
    });
    (0, vitest_1.it)('returns original string if brackets are balanced', () => {
        const text = 'function balanced() { return [1, 2, 3]; }';
        (0, vitest_1.expect)((0, truncate_parsed_completion_1.insertMissingBrackets)(text)).toEqual(text);
    });
    (0, vitest_1.it)('inserts missing single type of bracket', () => {
        const text = 'function missingCurly() { return [1, 2, 3;';
        (0, vitest_1.expect)((0, truncate_parsed_completion_1.insertMissingBrackets)(text)).toEqual(`${text}]}`);
    });
    (0, vitest_1.it)('correctly handles nested brackets', () => {
        const text = 'function nested() { if (true) { return [1, 2, 3; ';
        (0, vitest_1.expect)((0, truncate_parsed_completion_1.insertMissingBrackets)(text)).toEqual(`${text}]}}`);
    });
    (0, vitest_1.it)('handles mixed types of brackets', () => {
        const text = 'function mixed() { return [1, 2, 3;';
        (0, vitest_1.expect)((0, truncate_parsed_completion_1.insertMissingBrackets)(text)).toEqual(`${text}]}`);
    });
    (0, vitest_1.it)('returns original string if no brackets are present', () => {
        const text = 'function noBrackets() return 123;';
        (0, vitest_1.expect)((0, truncate_parsed_completion_1.insertMissingBrackets)(text)).toEqual(text);
    });
    (0, vitest_1.it)('does not correct incorrectly ordered brackets', () => {
        const text = 'function wrongOrder() } return [1, 2, 3; {';
        (0, vitest_1.expect)((0, truncate_parsed_completion_1.insertMissingBrackets)(text)).toEqual(`${text}}]`);
    });
});
