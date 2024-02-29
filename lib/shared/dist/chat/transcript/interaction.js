import { isCodyIgnoredFile } from '../../cody-ignore/context-filter';
export class Interaction {
    humanMessage;
    assistantMessage;
    fullContext;
    usedContextFiles;
    usedPreciseContext;
    timestamp;
    constructor(humanMessage, assistantMessage, fullContext, usedContextFiles, usedPreciseContext = [], timestamp = new Date().toISOString()) {
        this.humanMessage = humanMessage;
        this.assistantMessage = assistantMessage;
        this.fullContext = fullContext;
        this.usedContextFiles = usedContextFiles;
        this.usedPreciseContext = usedPreciseContext;
        this.timestamp = timestamp;
    }
    /**
     * Removes context messages for files that should be ignored.
     *
     * Loops through the context messages and builds a new array, omitting any
     * messages for files that match the CODY_IGNORE files filter.
     * Also omits the assistant message after any ignored human message.
     *
     * This ensures context from ignored files does not get used.
     */
    async removeCodyIgnoredFiles() {
        const contextMessages = await this.fullContext;
        const newMessages = [];
        for (let i = 0; i < contextMessages.length; i++) {
            const message = contextMessages[i];
            // Skips the assistant message if the human message is ignored
            if (message.speaker === 'human' && message.file) {
                if (isCodyIgnoredFile(message.file.uri)) {
                    i++;
                    continue;
                }
            }
            newMessages.push(message);
        }
        this.fullContext = Promise.resolve(newMessages);
        return newMessages;
    }
    getAssistantMessage() {
        return { ...this.assistantMessage };
    }
    setAssistantMessage(assistantMessage) {
        this.assistantMessage = { ...assistantMessage };
    }
    getHumanMessage() {
        return { ...this.humanMessage };
    }
    async getFullContext() {
        const msgs = await this.removeCodyIgnoredFiles();
        return msgs.map(msg => ({ ...msg }));
    }
    setUsedContext(usedContextFiles, usedPreciseContext) {
        this.usedContextFiles = usedContextFiles;
        this.usedPreciseContext = usedPreciseContext;
    }
    /**
     * Converts the interaction to chat message pair: one message from a human, one from an assistant.
     */
    toChat() {
        return [
            {
                ...this.humanMessage,
                contextFiles: this.usedContextFiles,
                preciseContext: this.usedPreciseContext,
            },
            {
                ...this.assistantMessage,
                contextFiles: this.usedContextFiles,
                preciseContext: this.usedPreciseContext,
            },
        ];
    }
}
//# sourceMappingURL=interaction.js.map