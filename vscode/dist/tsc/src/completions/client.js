"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logResponseHeadersToSpan = exports.createRateLimitErrorFromResponse = exports.createSSEIterator = exports.createClient = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const fetch_1 = require("../fetch");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
const api_1 = require("@opentelemetry/api");
/**
 * Access the code completion LLM APIs via a Sourcegraph server instance.
 */
function createClient(config, logger) {
    function complete(params, abortController) {
        if (config.modelsVendor === 'Azure')
            return;
        const url = new URL('/.api/completions/code', config.serverEndpoint).href;
        const log = logger?.startCompletion(params, url);
        const { signal } = abortController;
        return tracing_1.tracer.startActiveSpan(`POST ${url}`, async function* (span) {
            const tracingFlagEnabled = await cody_shared_1.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyAutocompleteTracing);
            const headers = new Headers(config.customHeaders);
            // Force HTTP connection reuse to reduce latency.
            // c.f. https://github.com/microsoft/vscode/issues/173861
            headers.set('Connection', 'keep-alive');
            headers.set('Content-Type', 'application/json; charset=utf-8');
            if (config.accessToken) {
                headers.set('Authorization', `token ${config.accessToken}`);
            }
            if (tracingFlagEnabled) {
                headers.set('X-Sourcegraph-Should-Trace', '1');
                (0, cody_shared_1.addTraceparent)(headers);
            }
            // We enable streaming only for Node environments right now because it's hard to make
            // the polyfilled fetch API work the same as it does in the browser.
            //
            // TODO(philipp-spiess): Feature test if the response is a Node or a browser stream and
            // implement SSE parsing for both.
            const isNode = typeof process !== 'undefined';
            const enableStreaming = !!isNode;
            span.setAttribute('enableStreaming', enableStreaming);
            // Disable gzip compression since the sg instance will start to batch
            // responses afterwards.
            if (enableStreaming) {
                headers.set('Accept-Encoding', 'gzip;q=0');
            }
            const response = await (0, fetch_1.fetch)(url, {
                method: 'POST',
                body: JSON.stringify({
                    ...params,
                    stream: enableStreaming,
                }),
                headers,
                signal,
            });
            logResponseHeadersToSpan(span, response);
            const traceId = (0, cody_shared_1.getActiveTraceAndSpanId)()?.traceId;
            // When rate-limiting occurs, the response is an error message
            if (response.status === 429) {
                // Check for explicit false, because if the header is not set, there is no upgrade
                // available.
                //
                // Note: This header is added only via the Sourcegraph instance and thus not added by
                //       the helper function.
                const upgradeIsAvailable = response.headers.get('x-is-cody-pro-user') === 'false' &&
                    typeof response.headers.get('x-is-cody-pro-user') !== 'undefined';
                throw (0, tracing_1.recordErrorToSpan)(span, await createRateLimitErrorFromResponse(response, upgradeIsAvailable));
            }
            if (!response.ok) {
                throw (0, tracing_1.recordErrorToSpan)(span, new cody_shared_1.NetworkError(response, await response.text(), traceId));
            }
            if (response.body === null) {
                throw (0, tracing_1.recordErrorToSpan)(span, new cody_shared_1.TracedError('No response body', traceId));
            }
            // For backward compatibility, we have to check if the response is an SSE stream or a
            // regular JSON payload. This ensures that the request also works against older backends
            const isStreamingResponse = response.headers.get('content-type') === 'text/event-stream';
            let completionResponse = undefined;
            try {
                if (isStreamingResponse && (0, cody_shared_1.isNodeResponse)(response)) {
                    const iterator = createSSEIterator(response.body, {
                        aggregatedCompletionEvent: true,
                    });
                    let chunkIndex = 0;
                    for await (const { event, data } of iterator) {
                        if (event === 'error') {
                            throw new cody_shared_1.TracedError(data, traceId);
                        }
                        if (signal.aborted) {
                            if (completionResponse) {
                                completionResponse.stopReason = cody_shared_1.CompletionStopReason.RequestAborted;
                            }
                            break;
                        }
                        if (event === 'completion') {
                            completionResponse = JSON.parse(data);
                            const stopReason = completionResponse.stopReason || cody_shared_1.CompletionStopReason.StreamingChunk;
                            span.addEvent('yield', { stopReason });
                            yield {
                                completion: completionResponse.completion,
                                stopReason,
                            };
                        }
                        chunkIndex += 1;
                    }
                    if (completionResponse === undefined) {
                        throw new cody_shared_1.TracedError('No completion response received', traceId);
                    }
                    if (!completionResponse.stopReason) {
                        completionResponse.stopReason = cody_shared_1.CompletionStopReason.RequestFinished;
                    }
                    return completionResponse;
                }
                // Handle non-streaming response
                const result = await response.text();
                completionResponse = JSON.parse(result);
                if (typeof completionResponse.completion !== 'string' ||
                    typeof completionResponse.stopReason !== 'string') {
                    const message = `response does not satisfy CodeCompletionResponse: ${result}`;
                    log?.onError(message);
                    throw new cody_shared_1.TracedError(message, traceId);
                }
                return completionResponse;
            }
            catch (error) {
                // Shared error handling for both streaming and non-streaming requests.
                // In case of the abort error and non-empty completion response, we can
                // consider the completion partially completed and want to log it to
                // the Cody output channel via `log.onComplete()` instead of erroring.
                if ((0, cody_shared_1.isAbortError)(error) && completionResponse) {
                    completionResponse.stopReason = cody_shared_1.CompletionStopReason.RequestAborted;
                    return;
                }
                (0, tracing_1.recordErrorToSpan)(span, error);
                if ((0, cody_shared_1.isRateLimitError)(error)) {
                    throw error;
                }
                const message = `error parsing CodeCompletionResponse: ${error}`;
                log?.onError(message, error);
                throw new cody_shared_1.TracedError(message, traceId);
            }
            finally {
                if (completionResponse) {
                    span.addEvent('return', { stopReason: completionResponse.stopReason });
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                    span.end();
                    log?.onComplete(completionResponse);
                }
            }
        });
    }
    return {
        complete,
        logger,
        onConfigurationChange(newConfig) {
            config = newConfig;
        },
    };
}
exports.createClient = createClient;
const SSE_TERMINATOR = '\n\n';
async function* createSSEIterator(iterator, options = {}) {
    let buffer = '';
    for await (const event of iterator) {
        const messages = [];
        buffer += event.toString();
        let index;
        // biome-ignore lint/suspicious/noAssignInExpressions: useful
        while ((index = buffer.indexOf(SSE_TERMINATOR)) >= 0) {
            const message = buffer.slice(0, index);
            buffer = buffer.slice(index + SSE_TERMINATOR.length);
            messages.push(parseSSEEvent(message));
        }
        for (let i = 0; i < messages.length; i++) {
            if (options.aggregatedCompletionEvent) {
                if (i + 1 < messages.length &&
                    messages[i].event === 'completion' &&
                    messages[i + 1].event === 'completion') {
                    continue;
                }
            }
            yield messages[i];
        }
    }
}
exports.createSSEIterator = createSSEIterator;
function parseSSEEvent(message) {
    const headers = message.split('\n');
    let event = '';
    let data = '';
    for (const header of headers) {
        const index = header.indexOf(': ');
        const title = header.slice(0, index);
        const rest = header.slice(index + 2);
        switch (title) {
            case 'event':
                event = rest;
                break;
            case 'data':
                data = rest;
                break;
            default:
                console.error(`Unknown SSE event type: ${event}`);
        }
    }
    return { event, data };
}
async function createRateLimitErrorFromResponse(response, upgradeIsAvailable) {
    const retryAfter = response.headers.get('retry-after');
    const limit = response.headers.get('x-ratelimit-limit');
    return new cody_shared_1.RateLimitError('autocompletions', await response.text(), upgradeIsAvailable, limit ? parseInt(limit, 10) : undefined, retryAfter);
}
exports.createRateLimitErrorFromResponse = createRateLimitErrorFromResponse;
function logResponseHeadersToSpan(span, response) {
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });
    span.addEvent('response');
    span.setAttributes({
        ...responseHeaders,
        status: response.status,
    });
}
exports.logResponseHeadersToSpan = logResponseHeadersToSpan;
