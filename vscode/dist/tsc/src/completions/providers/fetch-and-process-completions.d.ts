import { type CompletionResponseGenerator } from '@sourcegraph/cody-shared';
import type { DocumentContext } from '../get-current-doc-context';
import { type InlineCompletionItemWithAnalytics } from '../text-processing/process-inline-completions';
import type { ProviderOptions } from './provider';
export interface FetchAndProcessCompletionsParams {
    abortController: AbortController;
    completionResponseGenerator: CompletionResponseGenerator;
    providerSpecificPostProcess: (insertText: string) => string;
    providerOptions: Readonly<ProviderOptions>;
}
/**
 * Uses the first line of the completion to figure out if it start the new multiline syntax node.
 * If it does, continues streaming until the completion is truncated or we reach the token sample limit.
 */
export declare function fetchAndProcessDynamicMultilineCompletions(params: FetchAndProcessCompletionsParams): FetchCompletionsGenerator;
export type FetchCompletionResult = {
    docContext: DocumentContext;
    completion: InlineCompletionItemWithAnalytics;
} | undefined;
type FetchCompletionsGenerator = AsyncGenerator<FetchCompletionResult>;
export declare function fetchAndProcessCompletions(params: FetchAndProcessCompletionsParams): FetchCompletionsGenerator;
export {};
//# sourceMappingURL=fetch-and-process-completions.d.ts.map