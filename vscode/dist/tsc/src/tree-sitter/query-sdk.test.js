"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const grammars_1 = require("./grammars");
const parser_1 = require("./parser");
const query_sdk_1 = require("./query-sdk");
const test_helpers_1 = require("./test-helpers");
(0, vitest_1.describe)('getDocumentQuerySDK', () => {
    (0, vitest_1.afterEach)(() => {
        (0, parser_1.resetParsersCache)();
    });
    vitest_1.it.each([
        { languageId: grammars_1.SupportedLanguage.JavaScript },
        { languageId: grammars_1.SupportedLanguage.TypeScript },
        { languageId: grammars_1.SupportedLanguage.JSX },
        { languageId: grammars_1.SupportedLanguage.TSX },
        { languageId: grammars_1.SupportedLanguage.Go },
        { languageId: grammars_1.SupportedLanguage.Python },
    ])('returns valid SDK for $languageId', async ({ languageId }) => {
        const nonInitializedSDK = (0, query_sdk_1.getDocumentQuerySDK)(languageId);
        (0, vitest_1.expect)(nonInitializedSDK).toBeNull();
        const parser = await (0, test_helpers_1.initTreeSitterParser)(languageId);
        (0, vitest_1.expect)(parser).toBeTruthy();
        const sdk = (0, query_sdk_1.getDocumentQuerySDK)(languageId);
        (0, vitest_1.expect)(sdk?.queries.intents).toBeTruthy();
    });
    vitest_1.it.each([
        { languageId: grammars_1.SupportedLanguage.CSharp },
        { languageId: grammars_1.SupportedLanguage.Cpp },
        { languageId: grammars_1.SupportedLanguage.Dart },
        { languageId: grammars_1.SupportedLanguage.Php },
    ])('returns null for $languageId because queries are not defined', async ({ languageId }) => {
        const nonInitializedSDK = (0, query_sdk_1.getDocumentQuerySDK)(languageId);
        (0, vitest_1.expect)(nonInitializedSDK).toBeNull();
        const parser = await (0, test_helpers_1.initTreeSitterParser)(languageId);
        (0, vitest_1.expect)(parser).toBeTruthy();
        const sdk = (0, query_sdk_1.getDocumentQuerySDK)(languageId);
        (0, vitest_1.expect)(sdk).toBeNull();
    });
});
