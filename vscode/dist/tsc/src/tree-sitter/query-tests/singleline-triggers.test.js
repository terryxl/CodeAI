"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const grammars_1 = require("../grammars");
const query_sdk_1 = require("../query-sdk");
const test_helpers_1 = require("../test-helpers");
const annotate_and_match_snapshot_1 = require("./annotate-and-match-snapshot");
(0, vitest_1.describe)('singlelineTriggers', () => {
    (0, vitest_1.it)('typescript', async () => {
        await (0, test_helpers_1.initTreeSitterParser)(grammars_1.SupportedLanguage.TypeScript);
        const { language, parser, queries } = (0, query_sdk_1.getDocumentQuerySDK)(grammars_1.SupportedLanguage.TypeScript);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getSinglelineTrigger,
            sourcesPath: 'test-data/singleline-triggers.ts',
        });
    });
    (0, vitest_1.it)('go', async () => {
        await (0, test_helpers_1.initTreeSitterParser)(grammars_1.SupportedLanguage.Go);
        const { language, parser, queries } = (0, query_sdk_1.getDocumentQuerySDK)(grammars_1.SupportedLanguage.Go);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getSinglelineTrigger,
            sourcesPath: 'test-data/singleline-triggers.go',
        });
    });
});
