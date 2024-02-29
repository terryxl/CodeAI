import { SourcegraphCompletionsClient } from './client';
import type { CompletionCallbacks, CompletionParameters } from './types';
export declare class SourcegraphNodeCompletionsClient extends SourcegraphCompletionsClient {
    protected _streamWithCallbacks(params: CompletionParameters, cb: CompletionCallbacks, signal?: AbortSignal): void;
}
//# sourceMappingURL=nodeClient.d.ts.map