"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const grammars_1 = require("../grammars");
const test_helpers_1 = require("../test-helpers");
const annotate_and_match_snapshot_1 = require("./annotate-and-match-snapshot");
(0, vitest_1.describe)('getIntent', () => {
    (0, vitest_1.it)('typescript', async () => {
        const { language, parser, queries } = await (0, test_helpers_1.initTreeSitterSDK)(grammars_1.SupportedLanguage.TypeScript);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getCompletionIntent,
            sourcesPath: 'test-data/intents.ts',
        });
    });
    (0, vitest_1.it)('typescript incomplete code', async () => {
        const { language, parser, queries } = await (0, test_helpers_1.initTreeSitterSDK)(grammars_1.SupportedLanguage.TypeScript);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getCompletionIntent,
            sourcesPath: 'test-data/intents-partial.ts',
        });
    });
    (0, vitest_1.it)('javascriptreact', async () => {
        const { language, parser, queries } = await (0, test_helpers_1.initTreeSitterSDK)(grammars_1.SupportedLanguage.JSX);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getCompletionIntent,
            sourcesPath: 'test-data/intents.jsx',
        });
    });
    (0, vitest_1.it)('typescriptreact', async () => {
        const { language, parser, queries } = await (0, test_helpers_1.initTreeSitterSDK)(grammars_1.SupportedLanguage.TSX);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getCompletionIntent,
            sourcesPath: 'test-data/intents.tsx',
        });
    });
    (0, vitest_1.it)('python', async () => {
        const { language, parser, queries } = await (0, test_helpers_1.initTreeSitterSDK)(grammars_1.SupportedLanguage.Python);
        await (0, annotate_and_match_snapshot_1.annotateAndMatchSnapshot)({
            parser,
            language,
            captures: queries.getCompletionIntent,
            sourcesPath: 'test-data/intents.py',
        });
    });
});
