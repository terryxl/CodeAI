import type { ModelVendorType } from '../models/types';
import type { Message } from '../sourcegraph-api';
import type { SourcegraphCompletionsClient } from '../sourcegraph-api/completions/client';
import type { CompletionGeneratorValue, CompletionParameters, MessageAzure } from '../sourcegraph-api/completions/types';
type ChatParameters = Omit<CompletionParameters, 'messages'>;
export declare class ChatClient {
    private completions;
    constructor(completions: SourcegraphCompletionsClient);
    chat(messages: Message[] | MessageAzure[], params: Partial<ChatParameters>, abortSignal?: AbortSignal, vendor?: ModelVendorType): AsyncGenerator<CompletionGeneratorValue>;
}
export {};
//# sourceMappingURL=chat.d.ts.map