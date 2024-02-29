import { type ChatError, type ChatMessage, type Message, type TranscriptJSON } from '@sourcegraph/cody-shared';
import type { Repo } from '../../context/repo-fetcher';
import type { ContextItem } from '../../prompt-builder/types';
/**
 * Interface for a chat message with additional context.
 *
 * 🚨 SECURITY: Cody ignored files must be excluded from all context items.
 */
export interface MessageWithContext {
    message: Message;
    displayText?: string;
    newContextUsed?: ContextItem[];
    error?: ChatError;
}
export declare class SimpleChatModel {
    modelID: string;
    private messagesWithContext;
    readonly sessionID: string;
    private customChatTitle?;
    private selectedRepos?;
    constructor(modelID: string, messagesWithContext?: MessageWithContext[], sessionID?: string, customChatTitle?: string, selectedRepos?: Repo[]);
    isEmpty(): boolean;
    setNewContextUsed(newContextUsed: ContextItem[]): void;
    addHumanMessage(message: Omit<Message, 'speaker'>, displayText?: string): void;
    addBotMessage(message: Omit<Message, 'speaker'>, displayText?: string): void;
    addErrorAsBotMessage(error: Error): void;
    getLastHumanMessage(): MessageWithContext | undefined;
    getLastSpeakerMessageIndex(speaker: 'human' | 'assistant'): number | undefined;
    /**
     * Removes all messages from the given index when it matches the expected speaker.
     *
     * expectedSpeaker must match the speaker of the message at the given index.
     * This helps ensuring the intented messages are being removed.
     */
    removeMessagesFromIndex(index: number, expectedSpeaker: 'human' | 'assistant'): void;
    updateLastHumanMessage(message: Omit<Message, 'speaker'>, displayText?: string): void;
    getMessagesWithContext(): MessageWithContext[];
    getChatTitle(): string;
    getCustomChatTitle(): string | undefined;
    setCustomChatTitle(title: string): void;
    getSelectedRepos(): Repo[] | undefined;
    setSelectedRepos(repos: Repo[] | undefined): void;
    /**
     * Serializes to the legacy transcript JSON format
     */
    toTranscriptJSON(): TranscriptJSON;
}
export declare function toViewMessage(mwc: MessageWithContext): ChatMessage;
//# sourceMappingURL=SimpleChatModel.d.ts.map