"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const grammars_1 = require("../grammars");
const test_helpers_1 = require("../test-helpers");
const annotate_and_match_snapshot_1 = require("./annotate-and-match-snapshot");
(0, vitest_1.describe)('getDocumentableNode', () => {
    (0, vitest_1.it)('typescript', async () => {
        const { language, parser, queries } = await (0, test_helpers_1.initTreeSitterSDK)(grammars_1.SupportedLanguage.TypeScript);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getDocumentableNode,
            sourcesPath: 'test-data/documentable-node.ts',
        });
    });
});
