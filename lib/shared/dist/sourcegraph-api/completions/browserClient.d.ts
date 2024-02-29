import { SourcegraphCompletionsClient } from './client';
import type { CompletionCallbacks, CompletionParameters } from './types';
export declare class SourcegraphBrowserCompletionsClient extends SourcegraphCompletionsClient {
    protected _streamWithCallbacks(params: CompletionParameters, cb: CompletionCallbacks, signal?: AbortSignal): void;
}
//# sourceMappingURL=browserClient.d.ts.map