import type { AutocompleteTimeouts, CodeCompletionsParams } from '@sourcegraph/cody-shared';
import { fetchAndProcessCompletions } from './fetch-and-process-completions';
import type { ProviderOptions } from './provider';
type LineNumberDependentCompletionParams = Pick<CodeCompletionsParams, 'maxTokensToSample' | 'stopSequences' | 'timeoutMs'>;
interface LineNumberDependentCompletionParamsByType {
    singlelineParams: LineNumberDependentCompletionParams;
    multilineParams: LineNumberDependentCompletionParams;
    dynamicMultilineParams: LineNumberDependentCompletionParams;
}
interface Params {
    singlelineStopSequences: string[];
    multilineStopSequences: string[];
}
export declare function getLineNumberDependentCompletionParams(params: Params): LineNumberDependentCompletionParamsByType;
interface GetCompletionParamsAndFetchImplParams {
    providerOptions: Readonly<ProviderOptions>;
    lineNumberDependentCompletionParams: LineNumberDependentCompletionParamsByType;
    timeouts?: AutocompleteTimeouts | undefined;
}
interface GetRequestParamsAndFetchImplResult {
    partialRequestParams: Omit<CodeCompletionsParams, 'messages'>;
    fetchAndProcessCompletionsImpl: typeof fetchAndProcessCompletions;
}
export declare function getCompletionParamsAndFetchImpl(params: GetCompletionParamsAndFetchImplParams): GetRequestParamsAndFetchImplResult;
export {};
//# sourceMappingURL=get-completion-params.d.ts.map