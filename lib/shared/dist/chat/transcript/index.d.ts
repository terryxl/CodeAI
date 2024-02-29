import type { ContextFile, PreciseContext } from "../../codebase-context/messages";
import type { Message } from "../../sourcegraph-api";
import type { Interaction, InteractionJSON } from "./interaction";
import { type ChatMessage } from "./messages";
interface DeprecatedTranscriptJSONScope {
    includeInferredRepository: boolean;
    includeInferredFile: boolean;
    repositories: string[];
}
interface EnhancedContextJSON {
    selectedRepos: {
        id: string;
        name: string;
    }[];
}
export interface TranscriptJSON {
    id: string;
    chatModel?: string;
    chatTitle?: string;
    interactions: InteractionJSON[];
    lastInteractionTimestamp: string;
    scope?: DeprecatedTranscriptJSONScope;
    enhancedContext?: EnhancedContextJSON;
}
/**
 * The "model" class that tracks the call and response of the Cody chat box.
 * Any "controller" logic belongs outside of this class.
 */
export declare class Transcript {
    private interactions;
    chatModel: string | undefined;
    chatTitle: string | undefined;
    constructor(interactions?: Interaction[], chatModel?: string, title?: string);
    get isEmpty(): boolean;
    addInteraction(interaction: Interaction | null): void;
    getLastInteraction(): Interaction | null;
    addAssistantResponse(text: string, displayText?: string): void;
    /**
     * Adds an error div to the assistant response. If the assistant has collected
     * some response before, we will add the error message after it.
     * @param error The error to be displayed.
     */
    addErrorAsAssistantResponse(error: Error): void;
    getPromptForLastInteraction(preamble?: Message[], maxPromptLength?: number, onlyHumanMessages?: boolean): Promise<{
        prompt: Message[];
        contextFiles: ContextFile[];
        preciseContexts: PreciseContext[];
    }>;
    setUsedContextFilesForLastInteraction(contextFiles: ContextFile[], preciseContexts?: PreciseContext[]): void;
    toChat(): ChatMessage[];
    reset(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map