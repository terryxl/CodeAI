"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInlineCompletions = exports.TriggerKind = exports.InlineCompletionsResultSource = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../log");
const get_current_doc_context_1 = require("./get-current-doc-context");
const CompletionLogger = __importStar(require("./logger"));
const reuse_last_candidate_1 = require("./reuse-last-candidate");
const test_commands_1 = require("../commands/utils/test-commands");
const completion_provider_config_1 = require("./completion-provider-config");
const utils_1 = require("./utils");
/**
 * The source of the inline completions result.
 */
var InlineCompletionsResultSource;
(function (InlineCompletionsResultSource) {
    InlineCompletionsResultSource["Network"] = "Network";
    InlineCompletionsResultSource["Cache"] = "Cache";
    InlineCompletionsResultSource["HotStreak"] = "HotStreak";
    InlineCompletionsResultSource["CacheAfterRequestStart"] = "CacheAfterRequestStart";
    /**
     * The user is typing as suggested by the currently visible ghost text. For example, if the
     * user's editor shows ghost text `abc` ahead of the cursor, and the user types `ab`, the
     * original completion should be reused because it is still relevant.
     *
     * The last suggestion is passed in {@link InlineCompletionsParams.lastCandidate}.
     */
    InlineCompletionsResultSource["LastCandidate"] = "LastCandidate";
})(InlineCompletionsResultSource || (exports.InlineCompletionsResultSource = InlineCompletionsResultSource = {}));
/**
 * Extends the default VS Code trigger kind to distinguish between manually invoking a completion
 * via the keyboard shortcut and invoking a completion via hovering over ghost text.
 */
var TriggerKind;
(function (TriggerKind) {
    /** Completion was triggered explicitly by a user hovering over ghost text. */
    TriggerKind["Hover"] = "Hover";
    /** Completion was triggered automatically while editing. */
    TriggerKind["Automatic"] = "Automatic";
    /** Completion was triggered manually by the user invoking the keyboard shortcut. */
    TriggerKind["Manual"] = "Manual";
    /** When the user uses the suggest widget to cycle through different completions. */
    TriggerKind["SuggestWidget"] = "SuggestWidget";
})(TriggerKind || (exports.TriggerKind = TriggerKind = {}));
async function getInlineCompletions(params) {
    try {
        const result = await doGetInlineCompletions(params);
        params.tracer?.({ result });
        return result;
    }
    catch (unknownError) {
        const error = unknownError instanceof Error ? unknownError : new Error(unknownError);
        params.tracer?.({ error: error.toString() });
        if ((0, cody_shared_1.isAbortError)(error)) {
            return null;
        }
        if (process.env.NODE_ENV === 'development') {
            // Log errors to the console in the development mode to see the stack traces with source maps
            // in Chrome dev tools.
            console.error(error);
        }
        (0, log_1.logError)('getInlineCompletions:error', error.message, error.stack, { verbose: { error } });
        CompletionLogger.logError(error);
        throw error;
    }
    finally {
        params.setIsLoading?.(false);
    }
}
exports.getInlineCompletions = getInlineCompletions;
async function doGetInlineCompletions(params) {
    const { document, position, triggerKind, selectedCompletionInfo, docContext, docContext: { multilineTrigger, currentLineSuffix, currentLinePrefix }, providerConfig, contextMixer, requestManager, smartThrottleService, lastCandidate, debounceInterval, setIsLoading, abortSignal, tracer, handleDidAcceptCompletionItem, handleDidPartiallyAcceptCompletionItem, artificialDelay, completionIntent, lastAcceptedCompletionItem, isDotComUser, } = params;
    tracer?.({ params: { document, position, triggerKind, selectedCompletionInfo } });
    // If we have a suffix in the same line as the cursor and the suffix contains any word
    // characters, do not attempt to make a completion. This means we only make completions if
    // we have a suffix in the same line for special characters like `)]}` etc.
    //
    // VS Code will attempt to merge the remainder of the current line by characters but for
    // words this will easily get very confusing.
    if (triggerKind !== TriggerKind.Manual && /\w/.test(currentLineSuffix)) {
        return null;
    }
    // Do not trigger when the last character is a closing symbol
    if (triggerKind !== TriggerKind.Manual && /[);\]}]$/.test(currentLinePrefix.trim())) {
        return null;
    }
    // Do not trigger when cursor is at the start of the file ending line and the line above is empty
    if (triggerKind !== TriggerKind.Manual &&
        position.line !== 0 &&
        position.line === document.lineCount - 1) {
        const lineAbove = Math.max(position.line - 1, 0);
        if (document.lineAt(lineAbove).isEmptyOrWhitespace && !position.character) {
            return null;
        }
    }
    // Do not trigger when the user just accepted a single-line completion
    if (triggerKind !== TriggerKind.Manual &&
        lastAcceptedCompletionItem &&
        lastAcceptedCompletionItem.requestParams.document.uri.toString() === document.uri.toString() &&
        lastAcceptedCompletionItem.requestParams.docContext.multilineTrigger === null) {
        const docContextOfLastAcceptedAndInsertedCompletionItem = (0, get_current_doc_context_1.insertIntoDocContext)({
            docContext: lastAcceptedCompletionItem.requestParams.docContext,
            insertText: lastAcceptedCompletionItem.analyticsItem.insertText,
            languageId: lastAcceptedCompletionItem.requestParams.document.languageId,
            dynamicMultilineCompletions: false,
        });
        if (docContext.prefix === docContextOfLastAcceptedAndInsertedCompletionItem.prefix &&
            docContext.suffix === docContextOfLastAcceptedAndInsertedCompletionItem.suffix &&
            docContext.position.isEqual(docContextOfLastAcceptedAndInsertedCompletionItem.position)) {
            return null;
        }
    }
    // Check if the user is typing as suggested by the last candidate completion (that is shown as
    // ghost text in the editor), and reuse it if it is still valid.
    const resultToReuse = triggerKind !== TriggerKind.Manual && lastCandidate
        ? (0, reuse_last_candidate_1.reuseLastCandidate)({
            document,
            position,
            lastCandidate,
            docContext,
            selectedCompletionInfo,
            handleDidAcceptCompletionItem,
            handleDidPartiallyAcceptCompletionItem,
        })
        : null;
    if (resultToReuse) {
        return resultToReuse;
    }
    // Only log a completion as started if it's either served from cache _or_ the debounce interval
    // has passed to ensure we don't log too many start events where we end up not doing any work at
    // all.
    CompletionLogger.flushActiveSuggestionRequests();
    const multiline = Boolean(multilineTrigger);
    const logId = CompletionLogger.create({
        multiline,
        triggerKind,
        providerIdentifier: providerConfig.identifier,
        providerModel: providerConfig.model,
        languageId: document.languageId,
        testFile: (0, test_commands_1.isValidTestFile)(document.uri),
        completionIntent,
        artificialDelay,
        traceId: (0, cody_shared_1.getActiveTraceAndSpanId)()?.traceId,
    });
    let requestParams = {
        document,
        docContext,
        position,
        selectedCompletionInfo,
        abortSignal,
    };
    const cachedResult = requestManager.checkCache({
        requestParams,
        isCacheEnabled: triggerKind !== TriggerKind.Manual,
    });
    if (cachedResult) {
        const { completions, source } = cachedResult;
        CompletionLogger.loaded(logId, requestParams, completions, source, isDotComUser);
        return {
            logId,
            items: completions,
            source,
        };
    }
    if (smartThrottleService) {
        const throttledRequest = await smartThrottleService.throttle(requestParams, triggerKind);
        if (throttledRequest === null) {
            return null;
        }
        requestParams = throttledRequest;
    }
    const debounceTime = smartThrottleService
        ? 0
        : triggerKind !== TriggerKind.Automatic
            ? 0
            : ((multiline ? debounceInterval?.multiLine : debounceInterval?.singleLine) ?? 0) +
                (artificialDelay ?? 0);
    // We split the desired debounceTime into two chunks. One that is at most 25ms where every
    // further execution is halted...
    const waitInterval = Math.min(debounceTime, 25);
    // ...and one for the remaining time where we can already start retrieving context in parallel.
    const remainingInterval = debounceTime - waitInterval;
    if (waitInterval > 0) {
        await (0, cody_shared_1.wrapInActiveSpan)('autocomplete.debounce.wait', () => (0, utils_1.sleep)(waitInterval));
        if (abortSignal?.aborted) {
            return null;
        }
    }
    setIsLoading?.(true);
    CompletionLogger.start(logId);
    // Fetch context and apply remaining debounce time
    const [contextResult] = await Promise.all([
        (0, cody_shared_1.wrapInActiveSpan)('autocomplete.retrieve', () => contextMixer.getContext({
            document,
            position,
            docContext,
            abortSignal,
            maxChars: providerConfig.contextSizeHints.totalChars,
        })),
        remainingInterval > 0
            ? (0, cody_shared_1.wrapInActiveSpan)('autocomplete.debounce.remaining', () => (0, utils_1.sleep)(remainingInterval))
            : null,
    ]);
    if (abortSignal?.aborted) {
        return null;
    }
    tracer?.({ context: contextResult });
    const completionProvider = getCompletionProvider({
        document,
        position,
        triggerKind,
        providerConfig,
        docContext,
    });
    tracer?.({
        completers: [
            {
                ...completionProvider.options,
                completionIntent,
            },
        ],
    });
    CompletionLogger.networkRequestStarted(logId, contextResult?.logSummary);
    // Get the processed completions from providers
    const { completions, source } = await requestManager.request({
        requestParams,
        provider: completionProvider,
        context: contextResult?.context ?? [],
        isCacheEnabled: triggerKind !== TriggerKind.Manual,
        tracer: tracer ? createCompletionProviderTracer(tracer) : undefined,
    });
    CompletionLogger.loaded(logId, requestParams, completions, source, isDotComUser);
    return {
        logId,
        items: completions,
        source,
    };
}
function getCompletionProvider(params) {
    const { document, position, triggerKind, providerConfig, docContext } = params;
    const sharedProviderOptions = {
        docContext,
        document,
        position,
        dynamicMultilineCompletions: completion_provider_config_1.completionProviderConfig.dynamicMultilineCompletions,
        hotStreak: completion_provider_config_1.completionProviderConfig.hotStreak,
        // For the now the value is static and based on the average multiline completion latency.
        firstCompletionTimeout: 1900,
    };
    // Show more if manually triggered (but only showing 1 is faster, so we use it
    // in the automatic trigger case).
    const n = triggerKind === TriggerKind.Automatic ? 1 : 3;
    if (docContext.multilineTrigger) {
        return providerConfig.create({
            ...sharedProviderOptions,
            n,
            multiline: true,
        });
    }
    return providerConfig.create({
        ...sharedProviderOptions,
        n,
        multiline: false,
    });
}
function createCompletionProviderTracer(tracer) {
    return (tracer && {
        params: data => tracer({ completionProviderCallParams: data }),
        result: data => tracer({ completionProviderCallResult: data }),
    });
}
