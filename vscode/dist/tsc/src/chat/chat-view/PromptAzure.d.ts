import type { MessageAzure } from '@sourcegraph/cody-shared';
import type { SimpleChatModel } from './SimpleChatModel';
import type { ContextItem } from '../../prompt-builder/types';
import type { IPrompter } from './prompt';
export declare class AzuerPrompter implements IPrompter<MessageAzure> {
    private explicitContext;
    private submitType?;
    private getEnhancedContext?;
    constructor(explicitContext: ContextItem[], submitType?: string, getEnhancedContext?: (query: string, charLimit: number) => Promise<ContextItem[]>);
    makePrompt(chat: SimpleChatModel, charLimit: number): Promise<{
        prompt: MessageAzure[];
        newContextUsed: ContextItem[];
    }>;
    private transfer;
}
//# sourceMappingURL=PromptAzure.d.ts.map