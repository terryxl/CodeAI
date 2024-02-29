"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const diff_1 = require("./diff");
// Note, computeDiff does not treat its arguments symmetrically
// because we present *Cody's* edits as the "foreign" ones an the
// human edits as benign. The arguments are:
// computeDiff(original text, cody text, human text, ...)
(0, vitest_1.describe)('computeDiff', () => {
    (0, vitest_1.it)('should merge trivial Cody insertions', () => {
        const diff = (0, diff_1.computeDiff)('hello, world!', 'hello, worldly humans of earth!', 'hello, world!', {
            line: 42,
            character: 7,
        });
        (0, vitest_1.expect)(diff.clean).toBe(true);
        (0, vitest_1.expect)(diff.conflicts).toStrictEqual([]);
        (0, vitest_1.expect)(diff.edits).toStrictEqual([
            {
                kind: 'insert',
                text: 'ly humans of earth',
                range: {
                    start: { line: 42, character: 7 + 'hello, world'.length },
                    end: { line: 42, character: 7 + 'hello, world'.length },
                },
            },
        ]);
    });
    (0, vitest_1.it)('should merge non-overlapping human and Cody insertions', () => {
        const diff = (0, diff_1.computeDiff)('hello, world!', 'hello, worldly humans of earth!', 'hello, salutations world!', {
            line: 42,
            character: 7,
        });
        (0, vitest_1.expect)(diff.clean).toBe(true);
        (0, vitest_1.expect)(diff.conflicts).toStrictEqual([]);
        (0, vitest_1.expect)(diff.edits).toStrictEqual([
            {
                kind: 'insert',
                text: 'ly humans of earth',
                range: {
                    start: { line: 42, character: 7 + 'hello, salutations world'.length },
                    end: { line: 42, character: 7 + 'hello, salutations world'.length },
                },
            },
        ]);
    });
    (0, vitest_1.it)('should merge overlapping, identical human and Cody edits', () => {
        const diff = (0, diff_1.computeDiff)('hello, world!', 'hello, puny earthlings', 'hello, puny earthlings', {
            line: 42,
            character: 7,
        });
        (0, vitest_1.expect)(diff.clean).toBe(true);
        (0, vitest_1.expect)(diff.conflicts).toStrictEqual([]);
        (0, vitest_1.expect)(diff.edits).toStrictEqual([]);
    });
    (0, vitest_1.it)('should report conflicts', () => {
        const diff = (0, diff_1.computeDiff)('hello, world!', 'hello, WORLD!', 'hello, earth!', {
            line: 42,
            character: 7,
        });
        (0, vitest_1.expect)(diff.clean).toBe(false);
    });
});
(0, vitest_1.describe)('longestCommonSubsequence', () => {
    (0, vitest_1.it)('identical strings should use themselves', () => {
        const palindrome = 'amanaplanacanalpanama';
        const lcs = (0, diff_1.longestCommonSubsequence)(palindrome, palindrome);
        // Because the strings are identical, this should be a diagonal
        // matrix indicating every character is used.
        (0, diff_1.dumpUse)(lcs, palindrome, palindrome);
        for (let v = 0; v < palindrome.length; v++) {
            for (let u = 0; u < palindrome.length; u++) {
                (0, vitest_1.expect)(lcs[(v + 1) * (palindrome.length + 1) + (u + 1)]).toBe(u === v ? 1 : 0);
            }
        }
    });
    (0, vitest_1.it)('prefixes should use the prefix', () => {
        const prefix = 'hello, ';
        const a = `${prefix}world!`;
        const b = `${prefix}peeps...`;
        const lcs = (0, diff_1.longestCommonSubsequence)(a, b);
        for (let v = 0; v < b.length; v++) {
            for (let u = 0; u < a.length; u++) {
                const entry = lcs[(v + 1) * (a.length + 1) + (u + 1)];
                if (u === v && u < prefix.length) {
                    // Because the prefix is identical, the prefix
                    // should be used in its entirety.
                    (0, vitest_1.expect)(entry).toBe(1);
                }
                else {
                    // There is nothing else in common.
                    (0, vitest_1.expect)(entry).toBe(0);
                }
            }
        }
    });
    (0, vitest_1.it)('subsequences should be used', () => {
        const a = '.a...bc....d...e...';
        const b = '~~~ab~cde~~~';
        const lcs = (0, diff_1.longestCommonSubsequence)(a, b);
        (0, diff_1.dumpUse)(lcs, a, b);
        for (let v = 0; v < b.length; v++) {
            for (let u = 0; u < a.length; u++) {
                const entry = lcs[(v + 1) * (a.length + 1) + (u + 1)];
                // Note, this condition is not true *in general*, but
                // because of the way these inputs are constructed:
                // a and b have a common subsequence, abcde, and
                // nothing else in common
                (0, vitest_1.expect)(entry).toBe(a[u] === b[v] ? 1 : 0);
            }
        }
    });
});
