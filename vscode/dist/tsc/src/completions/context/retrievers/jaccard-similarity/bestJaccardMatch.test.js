"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const bestJaccardMatch_1 = require("./bestJaccardMatch");
const targetSnippet = `
import { bestJaccardMatch, getWords } from './context'

describe('getWords', () => {
    it('works with regular text', () => {
        expect(getWords('foo bar baz')).toEqual(
            new Map<string, number>([
                ['foo', 1],
                ['bar', 1],
                ['baz', 1],
            ])
        )
        expect(getWords('running rocks slipped over')).toEqual(
            new Map<string, number>([
                ['run', 1],
                ['rock', 1],
                ['slip', 1],
            ])
        )
    })
})
`;
const MAX_MATCHES = 50;
(0, vitest_1.describe)('getWords', () => {
    (0, vitest_1.it)('works with regular text', () => {
        (0, vitest_1.expect)((0, bestJaccardMatch_1.getWordOccurrences)('foo bar baz')).toEqual(new Map([
            ['foo', 1],
            ['bar', 1],
            ['baz', 1],
        ]));
        (0, vitest_1.expect)((0, bestJaccardMatch_1.getWordOccurrences)('running rocks slipped over')).toEqual(new Map([
            ['run', 1],
            ['rock', 1],
            ['slip', 1],
        ]));
    });
    (0, vitest_1.it)('works with code snippets', () => {
        (0, vitest_1.expect)((0, bestJaccardMatch_1.getWordOccurrences)(targetSnippet)).toEqual(new Map([
            ['import', 1],
            ['bestjaccardmatch', 1],
            ['getword', 4],
            ['context', 1],
            ['describ', 1],
            ['work', 1],
            ['regular', 1],
            ['text', 1],
            ['expect', 2],
            ['foo', 2],
            ['bar', 2],
            ['baz', 2],
            ['toequal', 2],
            ['new', 2],
            ['map', 2],
            ['string', 2],
            ['number', 2],
            ['1', 6],
            ['run', 2],
            ['rock', 2],
            ['slip', 2],
        ]));
    });
});
(0, vitest_1.describe)('bestJaccardMatch', () => {
    (0, vitest_1.it)('should return the best match', () => {
        const matchText = (0, dedent_1.default) `
            foo
            bar
            baz
            qux
            quux
            quuz
            corge
            grault
            garply
            waldo
            fred
            plugh
            xyzzy
            thud
        `;
        (0, vitest_1.expect)((0, bestJaccardMatch_1.bestJaccardMatches)('foo\nbar\nbaz', matchText, 3, MAX_MATCHES)[0]).toEqual({
            score: 1,
            content: 'foo\nbar\nbaz',
            endLine: 2,
            startLine: 0,
        });
        (0, vitest_1.expect)((0, bestJaccardMatch_1.bestJaccardMatches)('bar\nquux', matchText, 4, MAX_MATCHES)[0]).toEqual({
            score: 0.5,
            content: 'bar\nbaz\nqux\nquux',
            endLine: 4,
            startLine: 1,
        });
        (0, vitest_1.expect)((0, bestJaccardMatch_1.bestJaccardMatches)(['grault', 'notexist', 'garply', 'notexist', 'waldo', 'notexist', 'notexist'].join('\n'), matchText, 6, MAX_MATCHES)[0]).toEqual({
            score: 0.3,
            startLine: 4,
            endLine: 9,
            content: ['quux', 'quuz', 'corge', 'grault', 'garply', 'waldo'].join('\n'),
        });
    });
    (0, vitest_1.it)('returns more than one match', () => {
        const matchText = (0, dedent_1.default) `
            foo
            bar
            baz
            qux
            foo
            quuz
            corge
            grault
            garply
            waldo
            fred
            plugh
            xyzzy
            thud`;
        const matches = (0, bestJaccardMatch_1.bestJaccardMatches)('foo\nbar\nbaz', matchText, 3, MAX_MATCHES);
        (0, vitest_1.expect)(matches).toHaveLength(4);
        (0, vitest_1.expect)(matches.map(match => match.content.split('\n'))).toEqual([
            ['foo', 'bar', 'baz'],
            ['qux', 'foo', 'quuz'],
            ['corge', 'grault', 'garply'],
            ['waldo', 'fred', 'plugh'],
        ]);
    });
    (0, vitest_1.it)('works with code snippets', () => {
        (0, vitest_1.expect)((0, bestJaccardMatch_1.bestJaccardMatches)(targetSnippet, (0, dedent_1.default) `
                    describe('bestJaccardMatch', () => {
                        it('should return the best match', () => {
                            const matchText = [
                                'foo',
                                'bar',
                                'baz',
                                'qux',
                                'quux',
                            ].join('\n')
                        })
                    })
                `, 5, MAX_MATCHES)[0]).toMatchInlineSnapshot(`
          {
            "content": "describe('bestJaccardMatch', () => {
              it('should return the best match', () => {
                  const matchText = [
                      'foo',
                      'bar',",
            "endLine": 4,
            "score": 0.08695652173913043,
            "startLine": 0,
          }
        `);
    });
    (0, vitest_1.it)('works for input texts that are shorter than the window size', () => {
        (0, vitest_1.expect)((0, bestJaccardMatch_1.bestJaccardMatches)('foo', 'foo', 10, MAX_MATCHES)[0]).toEqual({
            content: 'foo',
            endLine: 0,
            score: 1,
            startLine: 0,
        });
    });
    (0, vitest_1.it)('skips over windows with empty start lines', () => {
        const matches = (0, bestJaccardMatch_1.bestJaccardMatches)('foo', (0, dedent_1.default) `
                // foo
                // unrelated 1
                // unrelated 2


                // foo
                // unrelated 3
                // unrelated 4
            `, 3, MAX_MATCHES);
        (0, vitest_1.expect)(matches[0].content).toBe('// foo\n// unrelated 1\n// unrelated 2');
        (0, vitest_1.expect)(matches[1].content).toBe('// foo\n// unrelated 3\n// unrelated 4');
    });
    (0, vitest_1.it)("does not skips over windows with empty start lines if we're at the en", () => {
        const matches = (0, bestJaccardMatch_1.bestJaccardMatches)(targetSnippet, (0, dedent_1.default) `
                // foo
                // unrelated
                // unrelated


                // foo
            `, 3, MAX_MATCHES);
        (0, vitest_1.expect)(matches[0].content).toBe('\n\n// foo');
        (0, vitest_1.expect)(matches[1].content).toBe('// foo\n// unrelated\n// unrelated');
    });
});
