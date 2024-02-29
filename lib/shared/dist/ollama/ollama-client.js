import { isDefined } from '../common';
import { CompletionStopReason, } from '../inferenceClient/misc';
import { isAbortError } from '../sourcegraph-api/errors';
import { isNodeResponse } from '../sourcegraph-api/graphql/client';
import { isError } from '../utils';
const RESPONSE_SEPARATOR = /\r?\n/;
/**
 * The implementation is based on the `createClient` function from
 * `vscode/src/completions/client.ts` with some duplication.
 */
export function createOllamaClient(ollamaOptions, logger, logDebug) {
    async function* complete(params, abortController) {
        const url = new URL('/api/generate', ollamaOptions.url).href;
        const log = logger?.startCompletion(params, url);
        const { signal } = abortController;
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(params),
                headers: {
                    'Content-Type': 'application/json',
                },
                signal,
            });
            if (!response.ok) {
                const errorResponse = (await response.json());
                throw new Error(`ollama generation error: ${errorResponse?.error || 'unknown error'}`);
            }
            if (!response.body) {
                throw new Error('no response body');
            }
            const iterableBody = isNodeResponse(response)
                ? response.body
                : browserResponseToAsyncIterable(response.body);
            let insertText = '';
            let stopReason = '';
            for await (const chunk of iterableBody) {
                if (signal.aborted) {
                    stopReason = CompletionStopReason.RequestAborted;
                    break;
                }
                for (const chunkString of chunk.toString().split(RESPONSE_SEPARATOR).filter(Boolean)) {
                    const line = JSON.parse(chunkString);
                    if (line.response) {
                        insertText += line.response;
                        yield { completion: insertText, stopReason: CompletionStopReason.StreamingChunk };
                    }
                    if (line.done && line.total_duration) {
                        const timingInfo = formatOllamaTimingInfo(line);
                        // TODO(valery): yield debug message with timing info to a tracer
                        logDebug?.('ollama', 'generation done', timingInfo.join(' '));
                    }
                }
            }
            const completionResponse = {
                completion: insertText,
                stopReason: stopReason || CompletionStopReason.RequestFinished,
            };
            log?.onComplete(completionResponse);
            return completionResponse;
        }
        catch (error) {
            if (!isAbortError(error) && isError(error)) {
                log?.onError(error.message, error);
            }
            throw error;
        }
    }
    return {
        complete,
        logger,
        onConfigurationChange: () => undefined,
    };
}
function formatOllamaTimingInfo(response) {
    const timingMetricsKeys = [
        'total_duration',
        'load_duration',
        'prompt_eval_count',
        'prompt_eval_duration',
        'eval_count',
        'eval_duration',
        'sample_count',
        'sample_duration',
    ];
    const formattedMetrics = timingMetricsKeys
        .filter(key => response[key] !== undefined)
        .map(key => {
        const value = response[key];
        const formattedValue = key.endsWith('_duration') ? `${value / 1000000}ms` : value;
        return `${key}=${formattedValue}`;
    });
    const promptEvalSpeed = response.prompt_eval_count !== undefined && response.prompt_eval_duration !== undefined
        ? `prompt_eval_tok/sec=${response.prompt_eval_count / (response.prompt_eval_duration / 1000000000)}`
        : null;
    const responseEvalSpeed = response.eval_count !== undefined && response.eval_duration !== undefined
        ? `response_tok/sec=${response.eval_count / (response.eval_duration / 1000000000)}`
        : null;
    return [...formattedMetrics, promptEvalSpeed, responseEvalSpeed].filter(isDefined);
}
function browserResponseToAsyncIterable(body) {
    return {
        [Symbol.asyncIterator]: async function* () {
            const reader = body.getReader();
            const decoder = new TextDecoder('utf-8');
            while (true) {
                const { value, done } = await reader.read();
                const decoded = decoder.decode(value, { stream: true });
                if (done) {
                    return decoded;
                }
                yield decoded;
            }
        },
    };
}
//# sourceMappingURL=ollama-client.js.map