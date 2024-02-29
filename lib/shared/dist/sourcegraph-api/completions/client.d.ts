import type { Span } from '@opentelemetry/api';
import type { ConfigurationWithAccessToken } from '../../configuration';
import type { CompletionCallbacks, CompletionGeneratorValue, CompletionParameters, CompletionResponse, Event } from './types';
export interface CompletionLogger {
    startCompletion(params: CompletionParameters | unknown, endpoint: string): undefined | {
        onError: (error: string, rawError?: unknown) => void;
        onComplete: (response: string | CompletionResponse | string[] | CompletionResponse[]) => void;
        onEvents: (events: Event[]) => void;
    };
}
export type CompletionsClientConfig = Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'accessToken' | 'debugEnable' | 'customHeaders'>;
/**
 * Access the chat based LLM APIs via a Sourcegraph server instance.
 *
 * 🚨 SECURITY: It is the caller's responsibility to ensure context from
 * all cody ignored files are removed before sending requests to the server.
 */
export declare abstract class SourcegraphCompletionsClient {
    protected config: CompletionsClientConfig;
    protected logger?: CompletionLogger | undefined;
    private errorEncountered;
    constructor(config: CompletionsClientConfig, logger?: CompletionLogger | undefined);
    onConfigurationChange(newConfig: CompletionsClientConfig): void;
    protected get completionsEndpoint(): string;
    protected sendEvents(events: Event[], cb: CompletionCallbacks, span?: Span): void;
    protected abstract _streamWithCallbacks(params: CompletionParameters, cb: CompletionCallbacks, signal?: AbortSignal): void;
    stream(params: CompletionParameters, signal?: AbortSignal): AsyncGenerator<CompletionGeneratorValue>;
}
//# sourceMappingURL=client.d.ts.map