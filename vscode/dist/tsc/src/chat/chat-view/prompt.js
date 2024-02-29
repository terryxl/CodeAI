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
exports.DefaultPrompter = exports.CommandPrompter = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../../log");
const prompt_builder_1 = require("../../prompt-builder");
const agentContextSorting_1 = require("./agentContextSorting");
const ENHANCED_CONTEXT_ALLOCATION = 0.6; // Enhanced context should take up 60% of the context window
class CommandPrompter {
    getContextItems;
    constructor(getContextItems) {
        this.getContextItems = getContextItems;
    }
    async makePrompt(chat, charLimit) {
        const enhancedContextCharLimit = Math.floor(charLimit * ENHANCED_CONTEXT_ALLOCATION);
        const promptBuilder = new prompt_builder_1.PromptBuilder(charLimit);
        const newContextUsed = [];
        const preInstruction = vscode.workspace
            .getConfiguration('cody.chat')
            .get('preInstruction');
        const preambleMessages = (0, cody_shared_1.getSimplePreamble)(preInstruction);
        const preambleSucceeded = promptBuilder.tryAddToPrefix(preambleMessages);
        if (!preambleSucceeded) {
            throw new Error(`Preamble length exceeded context window size ${charLimit}`);
        }
        // Add existing transcript messages
        const reverseTranscript = [...chat.getMessagesWithContext()].reverse();
        for (let i = 0; i < reverseTranscript.length; i++) {
            const messageWithContext = reverseTranscript[i];
            const contextLimitReached = promptBuilder.tryAdd(messageWithContext.message);
            if (!contextLimitReached) {
                (0, log_1.logDebug)('CommandPrompter.makePrompt', `Ignored ${reverseTranscript.length - i} transcript messages due to context limit`);
                return {
                    prompt: promptBuilder.build(),
                    newContextUsed,
                };
            }
        }
        const contextItems = await this.getContextItems(enhancedContextCharLimit);
        const { limitReached, used, ignored } = promptBuilder.tryAddContext(contextItems, enhancedContextCharLimit);
        newContextUsed.push(...used);
        if (limitReached) {
            // TODO(beyang): we're masking this error (repro: try /explain),
            // we should improve the commands context selection process
            (0, log_1.logDebug)('CommandPrompter', 'makePrompt', `context limit reached, ignored ${ignored.length} items`);
        }
        return {
            prompt: promptBuilder.build(),
            newContextUsed,
        };
    }
}
exports.CommandPrompter = CommandPrompter;
class DefaultPrompter {
    explicitContext;
    getEnhancedContext;
    constructor(explicitContext, getEnhancedContext) {
        this.explicitContext = explicitContext;
        this.getEnhancedContext = getEnhancedContext;
    }
    // Constructs the raw prompt to send to the LLM, with message order reversed, so we can construct
    // an array with the most important messages (which appear most important first in the reverse-prompt.
    //
    // Returns the reverse prompt and the new context that was used in the
    // prompt for the current message.
    async makePrompt(chat, charLimit) {
        return (0, cody_shared_1.wrapInActiveSpan)('chat.prompter', async () => {
            const enhancedContextCharLimit = Math.floor(charLimit * ENHANCED_CONTEXT_ALLOCATION);
            const promptBuilder = new prompt_builder_1.PromptBuilder(charLimit);
            const newContextUsed = [];
            const preInstruction = vscode.workspace
                .getConfiguration('cody.chat')
                .get('preInstruction');
            const preambleMessages = (0, cody_shared_1.getSimplePreamble)(preInstruction);
            const preambleSucceeded = promptBuilder.tryAddToPrefix(preambleMessages);
            if (!preambleSucceeded) {
                throw new Error(`Preamble length exceeded context window size ${charLimit}`);
            }
            // Add existing transcript messages
            const reverseTranscript = [...chat.getMessagesWithContext()].reverse();
            for (let i = 0; i < reverseTranscript.length; i++) {
                const messageWithContext = reverseTranscript[i];
                const contextLimitReached = promptBuilder.tryAdd(messageWithContext.message);
                if (!contextLimitReached) {
                    (0, log_1.logDebug)('DefaultPrompter.makePrompt', `Ignored ${reverseTranscript.length - i} transcript messages due to context limit`);
                    return {
                        prompt: promptBuilder.build(),
                        newContextUsed,
                    };
                }
            }
            {
                // Add context from new user-specified context items
                const { limitReached, used } = promptBuilder.tryAddContext(this.explicitContext);
                newContextUsed.push(...used);
                if (limitReached) {
                    (0, log_1.logDebug)('DefaultPrompter.makePrompt', 'Ignored current user-specified context items due to context limit');
                    return { prompt: promptBuilder.build(), newContextUsed };
                }
            }
            // TODO(beyang): Decide whether context from previous messages is less
            // important than user added context, and if so, reorder this.
            {
                // Add context from previous messages
                const { limitReached } = promptBuilder.tryAddContext(reverseTranscript.flatMap((message) => message.newContextUsed || []));
                if (limitReached) {
                    (0, log_1.logDebug)('DefaultPrompter.makePrompt', 'Ignored prior context items due to context limit');
                    return { prompt: promptBuilder.build(), newContextUsed };
                }
            }
            const lastMessage = reverseTranscript[0];
            if (!lastMessage?.message.text) {
                throw new Error('No last message or last message text was empty');
            }
            if (lastMessage.message.speaker === 'assistant') {
                throw new Error('Last message in prompt needs speaker "human", but was "assistant"');
            }
            if (this.getEnhancedContext) {
                // Add additional context from current editor or broader search
                const additionalContextItems = await this.getEnhancedContext(lastMessage.message.text, enhancedContextCharLimit);
                (0, agentContextSorting_1.sortContextItems)(additionalContextItems);
                const { limitReached, used, ignored } = promptBuilder.tryAddContext(additionalContextItems, enhancedContextCharLimit);
                newContextUsed.push(...used);
                if (limitReached) {
                    (0, log_1.logDebug)('DefaultPrompter.makePrompt', `Ignored ${ignored.length} additional context items due to limit reached`);
                }
            }
            return {
                prompt: promptBuilder.build(),
                newContextUsed,
            };
        });
    }
}
exports.DefaultPrompter = DefaultPrompter;
