import { type CompletionParameters, type CompletionResponse, type CompletionResponseGenerator, type Configuration } from '@sourcegraph/cody-shared';
import { type InlineCompletionsParams, type InlineCompletionsResult } from '../get-inline-completions';
import type { ProviderOptions } from '../providers/provider';
export declare const T = "\t";
type Params = Partial<Omit<InlineCompletionsParams, 'document' | 'position' | 'docContext'>> & {
    languageId?: string;
    takeSuggestWidgetSelectionIntoAccount?: boolean;
    onNetworkRequest?: (params: CompletionParameters) => void;
    completionResponseGenerator?: (params: CompletionParameters) => CompletionResponseGenerator | Generator<CompletionResponse>;
    providerOptions?: Partial<ProviderOptions>;
    configuration?: Partial<Configuration>;
};
interface ParamsResult extends InlineCompletionsParams {
    /**
     * A promise that's resolved once `completionResponseGenerator` is done.
     * Used to wait for all the completion response chunks to be processed by the
     * request manager in autocomplete tests.
     */
    completionResponseGeneratorPromise: Promise<unknown>;
    configuration?: Partial<Configuration>;
}
/**
 * A test helper to create the parameters for {@link getInlineCompletions}.
 *
 * The code example must include a block character (█) to denote the current cursor position.
 */
export declare function params(code: string, responses: CompletionResponse[] | 'never-resolve', params?: Params): ParamsResult;
interface ParamsWithInlinedCompletion extends Params {
    delayBetweenChunks?: number;
}
/**
 * A test helper to create the parameters for {@link getInlineCompletions} with a completion
 * that's inlined in the code. Examples:
 *
 * 1. Params with prefix and suffix only and no completion response.
 *
 * function myFunction() {
 *   █
 * }
 *
 * E.g. { prefix: "function myFunction() {\n  ", suffix: "\n}" }
 *
 * 2. Params with prefix, suffix and the full completion response received with no intermediate chunks.
 *
 * function myFunction() {
 *   █const result = {
 *     value: 1,
 *     debug: true
 *   }
 *   return result█
 * }
 *
 * 3. Params with prefix, suffix and three completion chunks.
 *
 * function myFunction() {
 *   █const result = {
 *     value: 1,█
 *     debug: true
 *   }█
 *   return result█
 * }
 */
export declare function paramsWithInlinedCompletion(code: string, { delayBetweenChunks, ...completionParams }?: ParamsWithInlinedCompletion): ParamsResult;
interface GetInlineCompletionResult extends Omit<ParamsResult & InlineCompletionsResult, 'logId'> {
    acceptFirstCompletionAndPressEnter(): Promise<GetInlineCompletionResult>;
}
/**
 * A wrapper around `getInlineCompletions` helper with a few differences optimized for the
 * most popular test cases with the aim to reduce the boilerplate code:
 *
 * 1. Uses `paramsWithInlinedCompletion` internally to create arguments for `getInlineCompletions`
 * which allows the consumer to define prefix, suffix and completion chunks in one template literal.
 * 2. Throws an error is the returned result is `null`. We can still use a lower level.
 * 3. Returns `params` a part of the result too, allowing to use its values in tests.
 */
export declare function getInlineCompletionsWithInlinedChunks(code: string, completionParams?: ParamsWithInlinedCompletion): Promise<GetInlineCompletionResult>;
/**
 * Wraps the `getInlineCompletions` function to omit `logId` so that test expected values can omit
 * it and be stable.
 */
export declare function getInlineCompletions(params: ParamsResult): Promise<Omit<InlineCompletionsResult, 'logId'> | null>;
/** Test helper for when you just want to assert the completion strings. */
export declare function getInlineCompletionsInsertText(params: ParamsResult): Promise<string[]>;
export type V = Awaited<ReturnType<typeof getInlineCompletions>>;
export declare function initCompletionProviderConfig(config: Partial<Configuration>): Promise<void>;
export {};
//# sourceMappingURL=helpers.d.ts.map