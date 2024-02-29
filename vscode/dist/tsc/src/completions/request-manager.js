"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeIfRequestStillRelevant = exports.RequestManager = void 0;
const lodash_1 = require("lodash");
const lru_cache_1 = require("lru-cache");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const debug_utils_1 = require("../services/open-telemetry/debug-utils");
const get_inline_completions_1 = require("./get-inline-completions");
const logger_1 = require("./logger");
const hot_streak_1 = require("./providers/hot-streak");
const reuse_last_candidate_1 = require("./reuse-last-candidate");
const process_inline_completions_1 = require("./text-processing/process-inline-completions");
const text_processing_1 = require("./text-processing");
const log_1 = require("../log");
const experimental_ollama_1 = require("./providers/experimental-ollama");
const completion_provider_config_1 = require("./completion-provider-config");
const utils_1 = require("./utils");
/**
 * This class can handle concurrent requests for code completions. The idea is
 * that requests are not cancelled even when the user continues typing in the
 * document. This allows us to cache the results of expensive completions and
 * return them when the user triggers a completion again.
 *
 * It also retests the request against the completion result of an inflight
 * request that just resolved and uses the last candidate logic to synthesize
 * completions if possible.
 */
class RequestManager {
    cache = new RequestCache();
    inflightRequests = new Set();
    // Tracks the last request that the request manager is called with. We use this to evaluate
    // the relevance of existing requests (i.e to find out if the generations are still relevant)
    latestRequestParams = null;
    checkCache(params) {
        const { requestParams, isCacheEnabled } = params;
        const cachedCompletions = this.cache.get(requestParams);
        if (isCacheEnabled && cachedCompletions) {
            (0, debug_utils_1.addAutocompleteDebugEvent)('RequestManager.checkCache', { cachedCompletions });
            return cachedCompletions;
        }
        return null;
    }
    async request(params) {
        const eagerCancellation = completion_provider_config_1.completionProviderConfig.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteEagerCancellation);
        const smartThrottle = completion_provider_config_1.completionProviderConfig.smartThrottle;
        this.latestRequestParams = params;
        const { requestParams, provider, context, tracer } = params;
        (0, debug_utils_1.addAutocompleteDebugEvent)('RequestManager.request');
        const shouldHonorCancellation = eagerCancellation || smartThrottle;
        // When request recycling is enabled, we do not pass the original abort signal forward as to
        // not interrupt requests that are no longer relevant. Instead, we let all previous requests
        // complete and try to see if their results can be reused for other inflight requests.
        const abortController = shouldHonorCancellation && params.requestParams.abortSignal
            ? (0, utils_1.forkSignal)(params.requestParams.abortSignal)
            : new AbortController();
        const request = new InflightRequest(requestParams, abortController);
        this.inflightRequests.add(request);
        const generateCompletions = async () => {
            try {
                for await (const fetchCompletionResults of provider.generateCompletions(request.abortController.signal, context, tracer)) {
                    const [hotStreakCompletions, currentCompletions] = (0, lodash_1.partition)(fetchCompletionResults.filter(cody_shared_1.isDefined), result => result.completion.stopReason === hot_streak_1.STOP_REASON_HOT_STREAK);
                    (0, debug_utils_1.addAutocompleteDebugEvent)('RequestManager.request.yield', {
                        hotStreakCompletions: hotStreakCompletions.map(c => c.completion.insertText),
                        currentCompletions: currentCompletions.map(c => c.completion.insertText),
                    });
                    if (currentCompletions.length > 0) {
                        // Process regular completions that will shown to the user.
                        const completions = currentCompletions.map(result => result.completion);
                        // Shared post-processing logic
                        const processedCompletions = (0, cody_shared_1.wrapInActiveSpan)('autocomplete.shared-post-process', () => (0, process_inline_completions_1.processInlineCompletions)(completions, requestParams));
                        // Cache even if the request was aborted or already fulfilled.
                        this.cache.set(requestParams, {
                            completions: processedCompletions,
                            source: get_inline_completions_1.InlineCompletionsResultSource.Cache,
                        });
                        // A promise will never resolve twice, so we do not need to
                        // check if the request was already fulfilled.
                        request.resolve({
                            completions: processedCompletions,
                            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
                        });
                        request.lastCompletions = processedCompletions;
                        if (!eagerCancellation) {
                            this.testIfResultCanBeRecycledForInflightRequests(request, processedCompletions);
                        }
                    }
                    // Save hot streak completions for later use.
                    for (const result of hotStreakCompletions) {
                        request.lastRequestParams = {
                            ...request.lastRequestParams,
                            docContext: result.docContext,
                        };
                        request.lastCompletions = [result.completion];
                        this.cache.set({ docContext: result.docContext }, {
                            completions: [result.completion],
                            source: get_inline_completions_1.InlineCompletionsResultSource.HotStreak,
                        });
                    }
                    if (!eagerCancellation) {
                        this.cancelIrrelevantRequests();
                    }
                }
            }
            catch (error) {
                request.reject(error);
            }
            finally {
                this.inflightRequests.delete(request);
            }
        };
        if (!eagerCancellation) {
            this.cancelIrrelevantRequests();
        }
        void (0, cody_shared_1.wrapInActiveSpan)('autocomplete.generate', generateCompletions);
        return request.promise;
    }
    removeFromCache(params) {
        this.cache.delete(params);
    }
    /**
     * Test if the result can be used for inflight requests. This only works
     * if a completion is a forward-typed version of a previous completion.
     */
    testIfResultCanBeRecycledForInflightRequests(resolvedRequest, items) {
        const { document, position, docContext, selectedCompletionInfo } = resolvedRequest.params;
        const lastCandidate = {
            uri: document.uri,
            lastTriggerPosition: position,
            lastTriggerDocContext: docContext,
            lastTriggerSelectedCompletionInfo: selectedCompletionInfo,
            result: {
                logId: '',
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
                items,
            },
        };
        for (const request of this.inflightRequests) {
            if (request === resolvedRequest) {
                continue;
            }
            if (request.params.document.uri.toString() !== document.uri.toString()) {
                continue;
            }
            const synthesizedCandidate = (0, reuse_last_candidate_1.reuseLastCandidate)({
                document: request.params.document,
                position: request.params.position,
                lastCandidate,
                docContext: request.params.docContext,
                selectedCompletionInfo: request.params.selectedCompletionInfo,
            });
            if (synthesizedCandidate) {
                const synthesizedItems = synthesizedCandidate.items;
                (0, logger_1.logCompletionBookkeepingEvent)('synthesizedFromParallelRequest');
                request.resolve({
                    completions: synthesizedItems,
                    source: get_inline_completions_1.InlineCompletionsResultSource.CacheAfterRequestStart,
                });
                request.abortController.abort();
                this.inflightRequests.delete(request);
            }
        }
    }
    cancelIrrelevantRequests() {
        if (!this.latestRequestParams) {
            return;
        }
        const isLocalProvider = (0, experimental_ollama_1.isLocalCompletionsProvider)(this.latestRequestParams.provider.options.id);
        for (const request of this.inflightRequests) {
            let shouldAbort = !computeIfRequestStillRelevant(this.latestRequestParams.requestParams, request.lastRequestParams, request.lastCompletions);
            if (isLocalProvider) {
                shouldAbort =
                    this.latestRequestParams.requestParams.docContext.currentLinePrefix !==
                        request.params.docContext.currentLinePrefix;
            }
            if (shouldAbort) {
                (0, log_1.logDebug)('CodyCompletionProvider', 'Irrelevant request aborted');
                request.abortController.abort();
                this.inflightRequests.delete(request);
            }
        }
    }
}
exports.RequestManager = RequestManager;
class InflightRequest {
    params;
    abortController;
    promise;
    resolve;
    reject;
    // Remember the latest completion candidates emitted by an inflight request. This is necessary
    // since we want to detect when a completion generation is diverging from the current document
    // context in order to effectively abort it.
    lastCompletions = null;
    lastRequestParams;
    constructor(params, abortController) {
        this.params = params;
        this.abortController = abortController;
        // The promise constructor is called synchronously, so this is just to
        // make TS happy
        this.resolve = () => { };
        this.reject = () => { };
        this.lastRequestParams = params;
        this.promise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }
}
class RequestCache {
    cache = new lru_cache_1.LRUCache({
        max: 50,
    });
    toCacheKey(key) {
        return `${key.docContext.prefix}█${key.docContext.nextNonEmptyLine}`;
    }
    get(key) {
        return this.cache.get(this.toCacheKey(key));
    }
    set(key, item) {
        this.cache.set(this.toCacheKey(key), item);
    }
    delete(key) {
        this.cache.delete(this.toCacheKey(key));
    }
}
// Given the current document and a previous request with it's recommended completions, compute if
// the completion is still relevant for the current document.
//
// We define a completion suggestion as still relevant if the prefix still overlap with the new new
// completion while allowing for some slight changes to account for prefixes.
function computeIfRequestStillRelevant(currentRequest, previousRequest, completions) {
    if (currentRequest.document.uri.toString() !== previousRequest.document.uri.toString()) {
        return false;
    }
    const currentPrefixStartLine = currentRequest.docContext.position.line - ((0, text_processing_1.lines)(currentRequest.docContext.prefix).length - 1);
    const previousPrefixStartLine = previousRequest.docContext.position.line - ((0, text_processing_1.lines)(previousRequest.docContext.prefix).length - 1);
    const sharedStartLine = Math.max(currentPrefixStartLine, previousPrefixStartLine);
    // Truncate both prefixes to ensure they start at the same line
    const currentPrefixDiff = sharedStartLine - currentPrefixStartLine;
    const previousPrefixDiff = sharedStartLine - previousPrefixStartLine;
    if (currentPrefixDiff < 0 || previousPrefixDiff < 0) {
        // There is no overlap in prefixes, the completions are not relevant
        return false;
    }
    const currentPrefix = currentRequest.docContext.prefix
        .split('\n')
        .slice(currentPrefixDiff)
        .join('\n');
    const previousPrefix = previousRequest.docContext.prefix
        .split('\n')
        .slice(previousPrefixDiff)
        .join('\n');
    // Require some overlap in the prefixes
    if (currentPrefix === '' || previousPrefix === '') {
        return false;
    }
    const current = (0, text_processing_1.removeIndentation)(currentPrefix);
    for (const completion of completions ?? [{ insertText: '' }]) {
        const inserted = (0, text_processing_1.removeIndentation)(previousPrefix + completion.insertText);
        const isFullContinuation = inserted.startsWith(current) || current.startsWith(inserted);
        // We consider a completion still relevant if the prefixes and the continuation diverge up
        // to three characters. For this, we only consider typos in the last line (= the line at the
        // cursor position)
        const [insertedLines, insertedLastLine] = splitLastLine(inserted);
        const [currentLines, currentLastLine] = splitLastLine(current);
        const isTypo = insertedLines === currentLines && insertedLastLine.startsWith(currentLastLine.slice(0, -3));
        if (isFullContinuation || isTypo) {
            return true;
        }
    }
    return false;
}
exports.computeIfRequestStillRelevant = computeIfRequestStillRelevant;
function splitLastLine(text) {
    const lines = text.split('\n');
    const lastLine = lines.pop();
    return [lines.join('\n'), lastLine];
}
