import { type CodeCompletionsClient } from '@sourcegraph/cody-shared';
import { type ProviderConfig } from './provider';
interface UnstableOpenAIOptions {
    maxContextTokens?: number;
    client: Pick<CodeCompletionsClient, 'complete'>;
}
export declare function createProviderConfig({ model, maxContextTokens, ...otherOptions }: UnstableOpenAIOptions & {
    model?: string;
}): ProviderConfig;
export {};
//# sourceMappingURL=unstable-openai.d.ts.map