import { type Message } from '@sourcegraph/cody-shared';
import type { SimpleChatModel } from './SimpleChatModel';
import type { ContextItem } from '../../prompt-builder/types';
interface PromptInfo {
    prompt: Message[];
    newContextUsed: ContextItem[];
}
export interface IPrompter {
    makePrompt(chat: SimpleChatModel, charLimit: number): Promise<PromptInfo>;
}
export declare class CommandPrompter implements IPrompter {
    private getContextItems;
    constructor(getContextItems: (maxChars: number) => Promise<ContextItem[]>);
    makePrompt(chat: SimpleChatModel, charLimit: number): Promise<PromptInfo>;
}
export declare class DefaultPrompter implements IPrompter {
    private explicitContext;
    private getEnhancedContext?;
    constructor(explicitContext: ContextItem[], getEnhancedContext?: (query: string, charLimit: number) => Promise<ContextItem[]>);
    makePrompt(chat: SimpleChatModel, charLimit: number): Promise<{
        prompt: Message[];
        newContextUsed: ContextItem[];
    }>;
}
export {};
//# sourceMappingURL=prompt.d.ts.map