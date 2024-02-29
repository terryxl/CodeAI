import type { Message } from '../sourcegraph-api';
import type { SourcegraphCompletionsClient } from '../sourcegraph-api/completions/client';
import type { CompletionGeneratorValue, CompletionParameters } from '../sourcegraph-api/completions/types';
type ChatParameters = Omit<CompletionParameters, 'messages'>;
export declare class ChatClient {
    private completions;
    constructor(completions: SourcegraphCompletionsClient);
    chat(messages: Message[], params: Partial<ChatParameters>, abortSignal?: AbortSignal): AsyncGenerator<CompletionGeneratorValue>;
}
export {};
//# sourceMappingURL=chat.d.ts.map