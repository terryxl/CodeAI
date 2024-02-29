import { type CodeCompletionsClient } from '@sourcegraph/cody-shared';
import { type ProviderConfig, type ProviderOptions } from './provider';
export declare const SINGLE_LINE_STOP_SEQUENCES: string[];
export declare const MULTI_LINE_STOP_SEQUENCES: string[];
interface AnthropicOptions {
    model?: string;
    maxContextTokens?: number;
    client: Pick<CodeCompletionsClient, 'complete'>;
}
export declare function createProviderConfig({ maxContextTokens, model, 
/**
 * Expose provider options here too to set the from the integration tests.
 * TODO(valery): simplify this API and remove the need to expose it only for tests.
 */
providerOptions, ...otherOptions }: AnthropicOptions & {
    providerOptions?: Partial<ProviderOptions>;
}): ProviderConfig;
export {};
//# sourceMappingURL=anthropic.d.ts.map