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
exports.buildInteraction = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const context_1 = require("./context");
const openai_1 = require("./models/openai");
const claude_1 = require("./models/claude");
const prompt_builder_1 = require("../../prompt-builder");
const INTERACTION_MODELS = {
    'gpt-4': claude_1.claude,
    'anthropic/claude-2.0': claude_1.claude,
    'anthropic/claude-2.1': claude_1.claude,
    'anthropic/claude-instant-1.2': claude_1.claude,
    'openai/gpt-3.5-turbo': openai_1.openai,
    'openai/gpt-4-1106-preview': openai_1.openai,
};
const getInteractionArgsFromIntent = (intent, model, options) => {
    // Default to the generic Claude prompt if the model is unknown
    const interaction = INTERACTION_MODELS[model] || claude_1.claude;
    switch (intent) {
        case 'add':
            return interaction.getAdd(options);
        case 'fix':
            return interaction.getFix(options);
        case 'doc':
            return interaction.getDoc(options);
        case 'edit':
            return interaction.getEdit(options);
        case 'test':
            return interaction.getTest(options);
    }
};
const buildInteraction = async ({ model, contextWindow, task, editor, }) => {
    const document = await vscode.workspace.openTextDocument(task.fixupFile.uri);
    const precedingText = document.getText(new vscode.Range(task.selectionRange.start.translate({
        lineDelta: -Math.min(task.selectionRange.start.line, 50),
    }), task.selectionRange.start));
    const selectedText = document.getText(task.selectionRange);
    if (selectedText.length > contextWindow) {
        throw new Error("The amount of text selected exceeds Cody's current capacity.");
    }
    task.original = selectedText;
    const followingText = document.getText(new vscode.Range(task.selectionRange.end, task.selectionRange.end.translate({ lineDelta: 50 })));
    const { prompt, responseTopic, stopSequences, assistantText, assistantPrefix } = getInteractionArgsFromIntent(task.intent, model, {
        uri: task.fixupFile.uri,
        followingText,
        precedingText,
        selectedText,
        instruction: task.instruction,
    });
    const promptBuilder = new prompt_builder_1.PromptBuilder(contextWindow);
    const preamble = (0, cody_shared_1.getSimplePreamble)();
    promptBuilder.tryAddToPrefix(preamble);
    if (assistantText) {
        promptBuilder.tryAdd({ speaker: 'assistant', text: assistantText });
    }
    promptBuilder.tryAdd({ speaker: 'human', text: prompt });
    const contextItems = await (0, context_1.getContext)({
        intent: task.intent,
        uri: task.fixupFile.uri,
        selectionRange: task.selectionRange,
        userContextFiles: task.userContextFiles,
        contextMessages: task.contextMessages,
        editor,
        followingText,
        precedingText,
        selectedText,
    });
    promptBuilder.tryAddContext(contextItems);
    return {
        messages: promptBuilder.build(),
        stopSequences,
        responseTopic: responseTopic || cody_shared_1.BotResponseMultiplexer.DEFAULT_TOPIC,
        responsePrefix: assistantPrefix,
    };
};
exports.buildInteraction = buildInteraction;
