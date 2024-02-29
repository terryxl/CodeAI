"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const create_inline_completion_item_provider_1 = require("./create-inline-completion-item-provider");
(0, vitest_1.describe)('getInlineCompletionItemProviderFilters', () => {
    (0, vitest_1.it)('returns correct language filters if wildcard is true', async () => {
        const filters = await (0, create_inline_completion_item_provider_1.getInlineCompletionItemProviderFilters)({
            '*': true,
            go: false,
        });
        const enabledLanguages = filters.map(f => f.language);
        (0, vitest_1.expect)(enabledLanguages).not.include('go');
        (0, vitest_1.expect)(enabledLanguages).include('typescript');
        (0, vitest_1.expect)(enabledLanguages).include('javascript');
    });
    (0, vitest_1.it)('returns correct language filters if wildcard is false', async () => {
        const filters = await (0, create_inline_completion_item_provider_1.getInlineCompletionItemProviderFilters)({
            '*': false,
            go: true,
            typescript: true,
            rust: false,
            scminput: true,
        });
        const enabledLanguages = filters.map(f => f.language);
        (0, vitest_1.expect)(enabledLanguages).toEqual(['go', 'typescript']);
    });
});
