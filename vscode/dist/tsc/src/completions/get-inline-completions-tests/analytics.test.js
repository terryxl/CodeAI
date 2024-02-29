"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const uuid = __importStar(require("uuid"));
const vitest_1 = require("vitest");
const parser_1 = require("../../tree-sitter/parser");
const CompletionLogger = __importStar(require("../logger"));
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] completion event', () => {
    (0, vitest_1.beforeAll)(async () => {
        await (0, test_helpers_1.initTreeSitterParser)();
    });
    (0, vitest_1.afterAll)(() => {
        (0, parser_1.resetParsersCache)();
    });
    async function getAnalyticsEvent(code, completion, additionalParams = {}) {
        vitest_1.vi.spyOn(uuid, 'v4').mockImplementation(() => 'stable-uuid');
        const spy = vitest_1.vi.spyOn(CompletionLogger, 'loaded');
        await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(code, [
            {
                completion,
                stopReason: 'unit-test',
            },
        ], additionalParams));
        // Get `suggestionId` from `CompletionLogger.loaded` call.
        const suggestionId = spy.mock.calls[0][0];
        const completionEvent = CompletionLogger.getCompletionEvent(suggestionId);
        return (0, lodash_1.omit)(completionEvent, [
            'acceptedAt',
            'loadedAt',
            'networkRequestStartedAt',
            'startLoggedAt',
            'startedAt',
            'suggestedAt',
            'suggestionAnalyticsLoggedAt',
            'suggestionLoggedAt',
            'params.contextSummary.duration',
        ]);
    }
    (0, vitest_1.describe)('fills all the expected fields on `CompletionLogger.loaded` calls', () => {
        (0, vitest_1.it)('for multiLine completions', async () => {
            const eventWithoutTimestamps = await getAnalyticsEvent('function foo() {█}', 'console.log(bar)\nreturn false}');
            (0, vitest_1.expect)(eventWithoutTimestamps).toMatchInlineSnapshot(`
              {
                "id": "stable-uuid",
                "items": [
                  {
                    "charCount": 30,
                    "lineCount": 2,
                    "lineTruncatedCount": 0,
                    "nodeTypes": {
                      "atCursor": "{",
                      "grandparent": "function_declaration",
                      "greatGrandparent": "program",
                      "lastAncestorOnTheSameLine": "function_declaration",
                      "parent": "statement_block",
                    },
                    "nodeTypesWithCompletion": {
                      "atCursor": "{",
                      "grandparent": "function_declaration",
                      "greatGrandparent": "program",
                      "lastAncestorOnTheSameLine": "function_declaration",
                      "parent": "statement_block",
                    },
                    "parseErrorCount": 0,
                    "stopReason": "unit-test",
                    "truncatedWith": "tree-sitter",
                  },
                ],
                "loggedPartialAcceptedLength": 0,
                "params": {
                  "artificialDelay": undefined,
                  "completionIntent": "function.body",
                  "contextSummary": {
                    "retrieverStats": {},
                    "strategy": "none",
                    "totalChars": 0,
                  },
                  "id": "stable-uuid",
                  "languageId": "typescript",
                  "multiline": true,
                  "multilineMode": "block",
                  "providerIdentifier": "anthropic",
                  "providerModel": "claude-instant-1.2",
                  "source": "Network",
                  "testFile": false,
                  "traceId": undefined,
                  "triggerKind": "Automatic",
                },
              }
            `);
        });
        (0, vitest_1.it)('for singleline completions', async () => {
            const eventWithoutTimestamps = await getAnalyticsEvent('function foo() {\n  return█}', '"foo"');
            (0, vitest_1.expect)(eventWithoutTimestamps).toMatchInlineSnapshot(`
              {
                "id": "stable-uuid",
                "items": [
                  {
                    "charCount": 5,
                    "lineCount": 1,
                    "lineTruncatedCount": undefined,
                    "nodeTypes": {
                      "atCursor": "return",
                      "grandparent": "statement_block",
                      "greatGrandparent": "function_declaration",
                      "lastAncestorOnTheSameLine": "function_declaration",
                      "parent": "return_statement",
                    },
                    "nodeTypesWithCompletion": {
                      "atCursor": "return",
                      "grandparent": "statement_block",
                      "greatGrandparent": "function_declaration",
                      "lastAncestorOnTheSameLine": "return_statement",
                      "parent": "return_statement",
                    },
                    "parseErrorCount": 0,
                    "stopReason": "unit-test",
                    "truncatedWith": undefined,
                  },
                ],
                "loggedPartialAcceptedLength": 0,
                "params": {
                  "artificialDelay": undefined,
                  "completionIntent": "return_statement",
                  "contextSummary": {
                    "retrieverStats": {},
                    "strategy": "none",
                    "totalChars": 0,
                  },
                  "id": "stable-uuid",
                  "languageId": "typescript",
                  "multiline": false,
                  "multilineMode": null,
                  "providerIdentifier": "anthropic",
                  "providerModel": "claude-instant-1.2",
                  "source": "Network",
                  "testFile": false,
                  "traceId": undefined,
                  "triggerKind": "Automatic",
                },
              }
            `);
        });
        (0, vitest_1.it)('logs `insertText` only for DotCom users', async () => {
            const eventWithoutTimestamps = await getAnalyticsEvent('function foo() {\n  return█}', '"foo"');
            (0, vitest_1.expect)(eventWithoutTimestamps.items?.some(item => item.insertText)).toBe(false);
        });
        (0, vitest_1.it)('does not log `insertText` for enterprise users', async () => {
            const eventWithoutTimestamps = await getAnalyticsEvent('function foo() {\n  return█}', '"foo"', {
                isDotComUser: true,
            });
            (0, vitest_1.expect)(eventWithoutTimestamps.items?.some(item => item.insertText)).toBe(true);
        });
    });
});
