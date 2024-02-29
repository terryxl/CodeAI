"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const utils_1 = require("./utils");
const correctResponse = `export function getRerankWithLog(
    chatClient: ChatClient
): (query: string, results: ContextResult[]) => Promise<{ results: ContextResult[]; duration: number }> {
    if (TestSupport.instance) {
        const reranker = TestSupport.instance.getReranker()
        return (query: string, results: ContextResult[]): Promise<{ results: ContextResult[]; duration: number }> => {
            const start = Date.now()
            const rerankedResults = reranker.rerank(query, results)
            const duration = Date.now() - start
            return { results: rerankedResults, duration }
        }
    }

    const reranker = new LLMReranker(chatClient)
    return async (
        userQuery: string,
        results: ContextResult[]
    ): Promise<{ results: ContextResult[]; duration: number }> => {
        const start = Date.now()
        const rerankedResults = await reranker.rerank(userQuery, results)
        const duration = Date.now() - start
        logDebug('Reranker:rerank', JSON.stringify({ duration }))
        return { results: rerankedResults, duration }
    }
}`;
(0, vitest_1.describe)('contentSanitizer', () => {
    (0, vitest_1.it)('handles clean prompt correct', () => {
        const sanitizedPrompt = (0, utils_1.contentSanitizer)(correctResponse);
        (0, vitest_1.expect)(sanitizedPrompt).toBe(correctResponse);
    });
    (0, vitest_1.it)('handles problematic prompt correct', () => {
        const sanitizedPrompt = (0, utils_1.contentSanitizer)(`<SELECTEDCODE7662>${correctResponse}</SELECTEDCODE7662>`);
        (0, vitest_1.expect)(sanitizedPrompt).toBe(correctResponse);
    });
    (0, vitest_1.it)('handles problematic prompt correctly with whitespace', () => {
        const sanitizedPrompt = (0, utils_1.contentSanitizer)(`   <CODE5711>${correctResponse}</CODE5711>   `);
        (0, vitest_1.expect)(sanitizedPrompt).toBe(correctResponse);
    });
    (0, vitest_1.it)('handles problematic prompt correctly with whitespace across new lines', () => {
        const sanitizedPrompt = (0, utils_1.contentSanitizer)(`\n   <SELECTEDCODE7662>${correctResponse}</SELECTEDCODE7662>   \n`);
        (0, vitest_1.expect)(sanitizedPrompt).toBe(correctResponse);
    });
});
