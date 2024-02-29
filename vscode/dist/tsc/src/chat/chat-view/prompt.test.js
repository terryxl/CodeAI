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
const vscode = __importStar(require("vscode"));
const vitest_1 = require("vitest");
const SimpleChatModel_1 = require("./SimpleChatModel");
const prompt_1 = require("./prompt");
const prompt_builder_1 = require("../../prompt-builder");
(0, vitest_1.describe)('DefaultPrompter', () => {
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('constructs a prompt with no context', async () => {
        const chat = new SimpleChatModel_1.SimpleChatModel('a-model-id');
        chat.addHumanMessage({ text: 'Hello' });
        const { prompt, newContextUsed } = await new prompt_1.DefaultPrompter([], () => Promise.resolve([])).makePrompt(chat, 100000);
        (0, vitest_1.expect)(prompt).toMatchInlineSnapshot(`
          [
            {
              "speaker": "human",
              "text": "You are Cody, an AI coding assistant from Sourcegraph.",
            },
            {
              "speaker": "assistant",
              "text": "I am Cody, an AI coding assistant from Sourcegraph.",
            },
            {
              "speaker": "human",
              "text": "Hello",
            },
          ]
        `);
        (0, vitest_1.expect)(newContextUsed).toMatchInlineSnapshot('[]');
    });
    (0, vitest_1.it)('adds the cody.chat.preInstruction vscode setting if set', async () => {
        const getConfig = vitest_1.vi.spyOn(vscode.workspace, 'getConfiguration');
        getConfig.mockImplementation((section, resource) => ({
            get: vitest_1.vi.fn(() => 'Always respond with 🧀 emojis'),
            has: vitest_1.vi.fn(() => true),
            inspect: vitest_1.vi.fn(() => ({ key: 'key' })),
            update: vitest_1.vi.fn(() => Promise.resolve()),
        }));
        const chat = new SimpleChatModel_1.SimpleChatModel('a-model-id');
        chat.addHumanMessage({ text: 'Hello' });
        const { prompt, newContextUsed } = await new prompt_1.DefaultPrompter([], () => Promise.resolve([])).makePrompt(chat, 100000);
        (0, vitest_1.expect)(prompt).toMatchInlineSnapshot(`
          [
            {
              "speaker": "human",
              "text": "You are Cody, an AI coding assistant from Sourcegraph. Always respond with 🧀 emojis",
            },
            {
              "speaker": "assistant",
              "text": "I am Cody, an AI coding assistant from Sourcegraph.",
            },
            {
              "speaker": "human",
              "text": "Hello",
            },
          ]
        `);
        (0, vitest_1.expect)(newContextUsed).toMatchInlineSnapshot('[]');
    });
    (0, vitest_1.it)('tryAddContext limit should not allow prompt to exceed overall limit', async () => {
        const overallLimit = 1;
        const promptBuilder = new prompt_builder_1.PromptBuilder(overallLimit);
        const contextItems = [
            {
                uri: vscode.Uri.file('/foo/bar'),
                text: 'foobar',
            },
        ];
        const { limitReached, ignored, duplicate, used } = promptBuilder.tryAddContext(contextItems, 10_000_000);
        (0, vitest_1.expect)(limitReached).toBeTruthy();
        (0, vitest_1.expect)(ignored).toEqual(contextItems);
        (0, vitest_1.expect)(duplicate).toEqual([]);
        (0, vitest_1.expect)(used).toEqual([]);
        const prompt = promptBuilder.build();
        (0, vitest_1.expect)(prompt).toMatchInlineSnapshot('[]');
    });
});
