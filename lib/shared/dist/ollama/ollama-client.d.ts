import type { OllamaGenerateParameters, OllamaOptions } from '../configuration';
import { type CodeCompletionsClient } from '../inferenceClient/misc';
import type { CompletionLogger } from '../sourcegraph-api/completions/client';
/**
 * @see https://sourcegraph.com/github.com/jmorganca/ollama/-/blob/api/types.go?L35
 */
export interface OllamaGenerateParams {
    model: string;
    template: string;
    prompt: string;
    options?: OllamaGenerateParameters;
}
/**
 * The implementation is based on the `createClient` function from
 * `vscode/src/completions/client.ts` with some duplication.
 */
export declare function createOllamaClient(ollamaOptions: OllamaOptions, logger?: CompletionLogger, logDebug?: (filterLabel: string, text: string, ...args: unknown[]) => void): CodeCompletionsClient<OllamaGenerateParams>;
//# sourceMappingURL=ollama-client.d.ts.map