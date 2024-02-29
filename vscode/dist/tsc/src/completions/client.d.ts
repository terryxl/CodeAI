/// <reference types="node" />
import { RateLimitError, type CodeCompletionsClient, type CompletionLogger, type CompletionsClientConfig, type BrowserOrNodeResponse } from '@sourcegraph/cody-shared';
import { type Span } from '@opentelemetry/api';
/**
 * Access the code completion LLM APIs via a Sourcegraph server instance.
 */
export declare function createClient(config: CompletionsClientConfig, logger?: CompletionLogger): CodeCompletionsClient;
interface SSEMessage {
    event: string;
    data: string;
}
export declare function createSSEIterator(iterator: NodeJS.ReadableStream, options?: {
    aggregatedCompletionEvent?: boolean;
}): AsyncGenerator<SSEMessage>;
export declare function createRateLimitErrorFromResponse(response: BrowserOrNodeResponse, upgradeIsAvailable: boolean): Promise<RateLimitError>;
export declare function logResponseHeadersToSpan(span: Span, response: BrowserOrNodeResponse): void;
export {};
//# sourceMappingURL=client.d.ts.map