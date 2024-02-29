import type { ContextFile, ContextMessage, PreciseContext } from '../../codebase-context/messages';
import type { ChatMessage, InteractionMessage } from './messages';
export interface InteractionJSON {
    humanMessage: InteractionMessage;
    assistantMessage: InteractionMessage;
    fullContext: ContextMessage[];
    usedContextFiles: ContextFile[];
    usedPreciseContext: PreciseContext[];
    timestamp: string;
    context?: ContextMessage[];
}
export declare class Interaction {
    private readonly humanMessage;
    private assistantMessage;
    private fullContext;
    private usedContextFiles;
    private usedPreciseContext;
    readonly timestamp: string;
    constructor(humanMessage: InteractionMessage, assistantMessage: InteractionMessage, fullContext: Promise<ContextMessage[]>, usedContextFiles: ContextFile[], usedPreciseContext?: PreciseContext[], timestamp?: string);
    /**
     * Removes context messages for files that should be ignored.
     *
     * Loops through the context messages and builds a new array, omitting any
     * messages for files that match the CODY_IGNORE files filter.
     * Also omits the assistant message after any ignored human message.
     *
     * This ensures context from ignored files does not get used.
     */
    private removeCodyIgnoredFiles;
    getAssistantMessage(): InteractionMessage;
    setAssistantMessage(assistantMessage: InteractionMessage): void;
    getHumanMessage(): InteractionMessage;
    getFullContext(): Promise<ContextMessage[]>;
    setUsedContext(usedContextFiles: ContextFile[], usedPreciseContext: PreciseContext[]): void;
    /**
     * Converts the interaction to chat message pair: one message from a human, one from an assistant.
     */
    toChat(): ChatMessage[];
}
//# sourceMappingURL=interaction.d.ts.map