import { CHARS_PER_TOKEN, MAX_AVAILABLE_PROMPT_LENGTH, } from "../../prompt/constants";
import { PromptMixin } from "../../prompt/prompt-mixin";
import { errorToChatError } from "./messages";
/**
 * The "model" class that tracks the call and response of the Cody chat box.
 * Any "controller" logic belongs outside of this class.
 */
export class Transcript {
    interactions = [];
    chatModel = undefined;
    chatTitle = undefined;
    constructor(interactions = [], chatModel, title) {
        this.interactions = interactions;
        this.chatModel = chatModel;
        this.chatTitle =
            title || this.getLastInteraction()?.getHumanMessage()?.displayText;
    }
    get isEmpty() {
        return this.interactions.length === 0;
    }
    addInteraction(interaction) {
        if (!interaction) {
            return;
        }
        this.interactions.push(interaction);
    }
    getLastInteraction() {
        return this.interactions.length > 0 ? this.interactions.at(-1) : null;
    }
    addAssistantResponse(text, displayText) {
        this.getLastInteraction()?.setAssistantMessage({
            speaker: "assistant",
            text,
            displayText,
        });
    }
    /**
     * Adds an error div to the assistant response. If the assistant has collected
     * some response before, we will add the error message after it.
     * @param error The error to be displayed.
     */
    addErrorAsAssistantResponse(error) {
        const lastInteraction = this.getLastInteraction();
        if (!lastInteraction) {
            return;
        }
        lastInteraction.setAssistantMessage({
            ...lastInteraction.getAssistantMessage(),
            text: "Failed to generate a response due to server error.",
            // Serializing normal errors will lose name/message so
            // just read them off manually and attach the rest of the fields.
            error: errorToChatError(error),
        });
    }
    async getPromptForLastInteraction(preamble = [], maxPromptLength = MAX_AVAILABLE_PROMPT_LENGTH, onlyHumanMessages = false) {
        if (this.interactions.length === 0) {
            return { prompt: [], contextFiles: [], preciseContexts: [] };
        }
        const messages = [];
        for (let index = 0; index < this.interactions.length; index++) {
            const interaction = this.interactions[index];
            const humanMessage = PromptMixin.mixInto(interaction.getHumanMessage());
            const assistantMessage = interaction.getAssistantMessage();
            const contextMessages = await interaction.getFullContext();
            if (index === this.interactions.length - 1 && !onlyHumanMessages) {
                messages.push(...contextMessages, humanMessage, assistantMessage);
            }
            else {
                messages.push(humanMessage, assistantMessage);
            }
        }
        const preambleTokensUsage = preamble.reduce((acc, message) => acc + estimateTokensUsage(message), 0);
        let truncatedMessages = truncatePrompt(messages, maxPromptLength - preambleTokensUsage);
        // Return what context fits in the window
        const contextFiles = [];
        const preciseContexts = [];
        for (const msg of truncatedMessages) {
            const contextFile = msg.file;
            if (contextFile) {
                contextFiles.push(contextFile);
            }
            const preciseContext = msg.preciseContext;
            if (preciseContext) {
                preciseContexts.push(preciseContext);
            }
        }
        // Filter out extraneous fields from ContextMessage instances
        truncatedMessages = truncatedMessages.map(({ speaker, text }) => ({
            speaker,
            text,
        }));
        return {
            prompt: [...preamble, ...truncatedMessages],
            contextFiles,
            preciseContexts,
        };
    }
    setUsedContextFilesForLastInteraction(contextFiles, preciseContexts = []) {
        const lastInteraction = this.interactions.at(-1);
        if (!lastInteraction) {
            throw new Error("Cannot set context files for empty transcript");
        }
        lastInteraction.setUsedContext(contextFiles, preciseContexts);
    }
    toChat() {
        return this.interactions.flatMap((interaction) => interaction.toChat());
    }
    reset() {
        this.interactions = [];
    }
}
/**
 * Truncates the given prompt messages to fit within the available tokens budget.
 * The truncation is done by removing the oldest pairs of messages first.
 * No individual message will be truncated. We just remove pairs of messages if they exceed the available tokens budget.
 */
function truncatePrompt(messages, maxTokens) {
    const newPromptMessages = [];
    let availablePromptTokensBudget = maxTokens;
    for (let i = messages.length - 1; i >= 1; i -= 2) {
        const humanMessage = messages[i - 1];
        const botMessage = messages[i];
        const combinedTokensUsage = estimateTokensUsage(humanMessage) + estimateTokensUsage(botMessage);
        // We stop adding pairs of messages once we exceed the available tokens budget.
        if (combinedTokensUsage <= availablePromptTokensBudget) {
            newPromptMessages.push(botMessage, humanMessage);
            availablePromptTokensBudget -= combinedTokensUsage;
        }
        else {
            break;
        }
    }
    // Reverse the prompt messages, so they appear in chat order (older -> newer).
    return newPromptMessages.reverse();
}
/**
 * Gives a rough estimate for the number of tokens used by the message.
 */
function estimateTokensUsage(message) {
    return Math.round((message.text || "").length / CHARS_PER_TOKEN);
}
//# sourceMappingURL=index.js.map