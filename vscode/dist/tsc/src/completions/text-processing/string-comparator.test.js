"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const string_comparator_1 = require("./string-comparator");
(0, vitest_1.describe)('isAlmostTheSameString', () => {
    vitest_1.it.each([
        [true, '', ''],
        [true, 'return []', ' return []'],
        [
            true,
            'const abortController = new AbortController()',
            'const networkController = new AbortController()',
        ],
        [
            true,
            'const currentFilePath = path.normalize(document.fileName)',
            'const filePath = path.normalize(document.fileName)',
        ],
        [
            false,
            "console.log('Hello world', getSumAAndB(a, b))",
            "console.error('Error log', getDBConnection(context))",
        ],
        [false, '    chatId: z.string(),', '    prompt: z.string(),'],
        [
            false,
            '    public get(key: RequestParams): InlineCompletionItemWithAnalytics[] | undefined {',
            '    public set(key: RequestParams, entry: InlineCompletionItemWithAnalytics[]): void {',
        ],
    ])('should return %s for strings %j and %j', (expected, stringA, stringB) => {
        (0, vitest_1.expect)((0, string_comparator_1.isAlmostTheSameString)(stringA, stringB)).toBe(expected);
    });
});
