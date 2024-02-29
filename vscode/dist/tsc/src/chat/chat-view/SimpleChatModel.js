"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toViewMessage = exports.SimpleChatModel = void 0;
const lodash_1 = require("lodash");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const chat_helpers_1 = require("./chat-helpers");
class SimpleChatModel {
    modelID;
    messagesWithContext;
    sessionID;
    customChatTitle;
    selectedRepos;
    constructor(modelID, messagesWithContext = [], sessionID = new Date(Date.now()).toUTCString(), customChatTitle, selectedRepos) {
        this.modelID = modelID;
        this.messagesWithContext = messagesWithContext;
        this.sessionID = sessionID;
        this.customChatTitle = customChatTitle;
        this.selectedRepos = selectedRepos;
    }
    isEmpty() {
        return this.messagesWithContext.length === 0;
    }
    setNewContextUsed(newContextUsed) {
        const lastMessage = this.messagesWithContext.at(-1);
        if (!lastMessage) {
            throw new Error('no last message');
        }
        if (lastMessage.message.speaker !== 'human') {
            throw new Error('Cannot set new context used for bot message');
        }
        lastMessage.newContextUsed = newContextUsed.filter(c => !(0, cody_shared_1.isCodyIgnoredFile)(c.uri));
    }
    addHumanMessage(message, displayText) {
        if (this.messagesWithContext.at(-1)?.message.speaker === 'human') {
            throw new Error('Cannot add a user message after a user message');
        }
        this.messagesWithContext.push({
            displayText,
            message: {
                ...message,
                speaker: 'human',
            },
        });
    }
    addBotMessage(message, displayText) {
        const lastMessage = this.messagesWithContext.at(-1)?.message;
        let error;
        // If there is no text, it could be a placeholder message for an error
        if (lastMessage?.speaker === 'assistant') {
            if (lastMessage?.text) {
                throw new Error('Cannot add a bot message after a bot message');
            }
            error = this.messagesWithContext.pop()?.error;
        }
        this.messagesWithContext.push({
            displayText,
            error,
            message: {
                ...message,
                speaker: 'assistant',
            },
        });
    }
    addErrorAsBotMessage(error) {
        const lastMessage = this.messagesWithContext.at(-1)?.message;
        // Remove the last assistant message if any
        const lastAssistantMessage = lastMessage?.speaker === 'assistant' && this.messagesWithContext.pop();
        const assistantMessage = lastAssistantMessage || { speaker: 'assistant' };
        // Then add a new assistant message with error added
        this.messagesWithContext.push({
            error: (0, cody_shared_1.errorToChatError)(error),
            message: {
                ...assistantMessage,
                speaker: 'assistant',
            },
        });
    }
    getLastHumanMessage() {
        return (0, lodash_1.findLast)(this.messagesWithContext, message => message.message.speaker === 'human');
    }
    getLastSpeakerMessageIndex(speaker) {
        return this.messagesWithContext.findLastIndex(message => message.message.speaker === speaker);
    }
    /**
     * Removes all messages from the given index when it matches the expected speaker.
     *
     * expectedSpeaker must match the speaker of the message at the given index.
     * This helps ensuring the intented messages are being removed.
     */
    removeMessagesFromIndex(index, expectedSpeaker) {
        if (this.isEmpty()) {
            throw new Error('SimpleChatModel.removeMessagesFromIndex: not message to remove');
        }
        const speakerAtIndex = this.messagesWithContext.at(index)?.message?.speaker;
        if (speakerAtIndex !== expectedSpeaker) {
            throw new Error(`SimpleChatModel.removeMessagesFromIndex: expected ${expectedSpeaker}, got ${speakerAtIndex}`);
        }
        // Removes everything from the index to the last element
        this.messagesWithContext.splice(index);
    }
    updateLastHumanMessage(message, displayText) {
        const lastMessage = this.messagesWithContext.at(-1);
        if (!lastMessage) {
            return;
        }
        if (lastMessage.message.speaker === 'human') {
            this.messagesWithContext.pop();
        }
        else if (lastMessage.message.speaker === 'assistant') {
            this.messagesWithContext.splice(-2, 2);
        }
        this.addHumanMessage(message, displayText);
    }
    getMessagesWithContext() {
        return this.messagesWithContext;
    }
    getChatTitle() {
        if (this.customChatTitle) {
            return this.customChatTitle;
        }
        const text = this.getLastHumanMessage()?.displayText;
        if (text) {
            return (0, chat_helpers_1.getChatPanelTitle)(text);
        }
        return 'New Chat';
    }
    getCustomChatTitle() {
        return this.customChatTitle;
    }
    setCustomChatTitle(title) {
        this.customChatTitle = title;
    }
    getSelectedRepos() {
        return this.selectedRepos ? this.selectedRepos.map(r => ({ ...r })) : undefined;
    }
    setSelectedRepos(repos) {
        this.selectedRepos = repos ? repos.map(r => ({ ...r })) : undefined;
    }
    /**
     * Serializes to the legacy transcript JSON format
     */
    toTranscriptJSON() {
        const interactions = [];
        for (let i = 0; i < this.messagesWithContext.length; i += 2) {
            const humanMessage = this.messagesWithContext[i];
            const botMessage = this.messagesWithContext[i + 1];
            interactions.push(messageToInteractionJSON(humanMessage, botMessage));
        }
        const result = {
            id: this.sessionID,
            chatModel: this.modelID,
            chatTitle: this.getCustomChatTitle(),
            lastInteractionTimestamp: this.sessionID,
            interactions,
        };
        if (this.selectedRepos) {
            result.enhancedContext = {
                selectedRepos: this.selectedRepos.map(r => ({ ...r })),
            };
        }
        return result;
    }
}
exports.SimpleChatModel = SimpleChatModel;
function messageToInteractionJSON(humanMessage, botMessage) {
    if (humanMessage?.message?.speaker !== 'human') {
        throw new Error('SimpleChatModel.toTranscriptJSON: expected human message, got bot');
    }
    return {
        humanMessage: messageToInteractionMessage(humanMessage),
        assistantMessage: botMessage?.message?.speaker === 'assistant'
            ? messageToInteractionMessage(botMessage)
            : { speaker: 'assistant' },
        usedContextFiles: (0, chat_helpers_1.contextItemsToContextFiles)(humanMessage.newContextUsed ?? []),
        // These fields are unused on deserialization
        fullContext: [],
        usedPreciseContext: [],
        timestamp: new Date().toISOString(),
    };
}
function messageToInteractionMessage(message) {
    return {
        speaker: message.message.speaker,
        text: message.message.text,
        displayText: getDisplayText(message),
    };
}
function toViewMessage(mwc) {
    const displayText = getDisplayText(mwc);
    return {
        ...mwc.message,
        error: mwc.error,
        displayText,
        contextFiles: (0, chat_helpers_1.contextItemsToContextFiles)(mwc.newContextUsed || []),
    };
}
exports.toViewMessage = toViewMessage;
function getDisplayText(mwc) {
    if (mwc.displayText) {
        return mwc.displayText;
    }
    if (mwc.message.speaker === 'assistant' && mwc.message.text) {
        return (0, cody_shared_1.reformatBotMessageForChat)(mwc.message.text, '');
    }
    return mwc.message.text;
}
