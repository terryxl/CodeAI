"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ast_getters_1 = require("../ast-getters");
const grammars_1 = require("../grammars");
const query_sdk_1 = require("../query-sdk");
const test_helpers_1 = require("../test-helpers");
const annotate_and_match_snapshot_1 = require("./annotate-and-match-snapshot");
(0, vitest_1.describe)('getNodeAtCursorAndParents', () => {
    (0, vitest_1.beforeAll)(async () => {
        await (0, test_helpers_1.initTreeSitterParser)(grammars_1.SupportedLanguage.TypeScript);
    });
    (0, vitest_1.it)('typescript', async () => {
        const { language, parser } = (0, query_sdk_1.getDocumentQuerySDK)(grammars_1.SupportedLanguage.TypeScript);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: ast_getters_1.getNodeAtCursorAndParents,
            sourcesPath: 'test-data/parents.ts',
        });
    });
});
