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
exports.logError = exports.reset_testOnly = exports.flushActiveSuggestionRequests = exports.noResponse = exports.getCompletionEvent = exports.partiallyAccept = exports.accepted = exports.suggested = exports.loaded = exports.networkRequestStarted = exports.start = exports.create = exports.logCompletionBookkeepingEvent = exports.logCompletionFormatEvent = exports.logCompletionPersistenceRemovedEvent = exports.logCompletionPersistencePresentEvent = void 0;
const lru_cache_1 = require("lru-cache");
const uuid = __importStar(require("uuid"));
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const configuration_1 = require("../configuration");
const sentry_1 = require("../services/sentry/sentry");
const telemetry_1 = require("../services/telemetry");
const telemetry_v2_1 = require("../services/telemetry-v2");
const persistence_tracker_1 = require("./persistence-tracker");
const statistics = __importStar(require("./statistics"));
const utils_1 = require("./text-processing/utils");
const completion_provider_config_1 = require("./completion-provider-config");
/**
 * hasInteractionID helps extracting analytics interaction ID from parameters
 * that extend SharedEventPayload.
 */
function hasInteractionID(params) {
    return 'id' in params;
}
function logCompletionSuggestedEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('suggested', {
        version: 0,
        metadata,
        privateMetadata,
    }, params);
}
function logCompletionAcceptedEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('accepted', {
        version: 0,
        metadata,
        privateMetadata,
    }, params);
}
function logCompletionPartiallyAcceptedEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('partiallyAccepted', {
        version: 0,
        metadata,
        privateMetadata,
    }, params);
}
function logCompletionPersistencePresentEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('persistence:present', {
        version: 0,
        metadata,
        privateMetadata,
    }, params);
}
exports.logCompletionPersistencePresentEvent = logCompletionPersistencePresentEvent;
function logCompletionPersistenceRemovedEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('persistence:removed', {
        version: 0,
        metadata,
        privateMetadata,
    }, params);
}
exports.logCompletionPersistenceRemovedEvent = logCompletionPersistenceRemovedEvent;
function logCompletionNoResponseEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('noResponse', { version: 0, metadata, privateMetadata }, params);
}
function logCompletionErrorEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('error', { version: 0, metadata, privateMetadata }, params);
}
function logCompletionFormatEvent(params) {
    // Use automatic splitting for now - make this manual as needed
    const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(params);
    writeCompletionEvent('format', { version: 0, metadata, privateMetadata }, params);
}
exports.logCompletionFormatEvent = logCompletionFormatEvent;
/**
 * The following events are added to ensure the logging bookkeeping works as expected in production
 * and should not happen under normal circumstances.
 */
function logCompletionBookkeepingEvent(name) {
    writeCompletionEvent(name);
}
exports.logCompletionBookkeepingEvent = logCompletionBookkeepingEvent;
/**
 * writeCompletionEvent is the underlying helper for various logCompletion*
 * functions. It writes telemetry in the appropriate format to both the v1
 * and v2 telemetry.
 */
function writeCompletionEvent(name, params, 
/**
 * legacyParams are passed through as-is the legacy event logger for backwards
 * compatibility. All relevant arguments should also be set on the params
 * object.
 */
legacyParams) {
    const extDetails = (0, telemetry_1.getExtensionDetails)((0, configuration_1.getConfiguration)(vscode.workspace.getConfiguration()));
    telemetry_1.telemetryService.log(`${(0, telemetry_1.logPrefix)(extDetails.ide)}:completion:${name}`, legacyParams, {
        agent: true,
        hasV2Event: true, // this helper translates the event for us
    });
    /**
     * Extract interaction ID from the full legacy params for convenience
     */
    if (params && hasInteractionID(legacyParams)) {
        params.interactionID = legacyParams.id?.toString();
    }
    /**
     * New telemetry automatically adds extension context - we do not need to
     * include platform in the name of the event. However, we MUST prefix the
     * event with 'cody.' to have the event be categorized as a Cody event.
     */
    telemetry_v2_1.telemetryRecorder.recordEvent('cody.completion', name, params);
}
const READ_TIMEOUT_MS = 750;
// Maintain a cache of active suggestion requests
const activeSuggestionRequests = new lru_cache_1.LRUCache({
    max: 20,
});
// Maintain a history of the last n displayed completions and their generated completion IDs. This
// allows us to reuse the completion ID across multiple suggestions.
const recentCompletions = new lru_cache_1.LRUCache({
    max: 20,
});
function getRecentCompletionsKey(params, completion) {
    return `${params.docContext.prefix}█${completion}█${params.docContext.nextNonEmptyLine}`;
}
// On our analytics dashboards, we apply a distinct count on the completion ID to count unique
// completions as suggested. Since we don't have want to maintain a list of all completion IDs in
// the client, we instead retain the last few completion IDs that were marked as suggested to
// prevent local over counting.
const completionIdsMarkedAsSuggested = new lru_cache_1.LRUCache({
    max: 50,
});
let persistenceTracker = null;
let completionsStartedSinceLastSuggestion = 0;
function create(inputParams) {
    const id = uuid.v4();
    const params = {
        ...inputParams,
        multilineMode: inputParams.multiline ? 'block' : null,
        id: null,
    };
    activeSuggestionRequests.set(id, {
        id,
        params,
        startedAt: performance.now(),
        networkRequestStartedAt: null,
        startLoggedAt: null,
        loadedAt: null,
        suggestedAt: null,
        suggestionLoggedAt: null,
        suggestionAnalyticsLoggedAt: null,
        acceptedAt: null,
        items: [],
        loggedPartialAcceptedLength: 0,
    });
    return id;
}
exports.create = create;
function start(id) {
    const event = activeSuggestionRequests.get(id);
    if (event && !event.startLoggedAt) {
        event.startLoggedAt = performance.now();
        completionsStartedSinceLastSuggestion++;
    }
}
exports.start = start;
function networkRequestStarted(id, contextSummary) {
    const event = activeSuggestionRequests.get(id);
    if (event && !event.networkRequestStartedAt) {
        event.networkRequestStartedAt = performance.now();
        event.params.contextSummary = contextSummary;
    }
}
exports.networkRequestStarted = networkRequestStarted;
function loaded(id, params, items, source, isDotComUser) {
    const event = activeSuggestionRequests.get(id);
    if (!event) {
        return;
    }
    event.params.source = source;
    // Check if we already have a completion id for the loaded completion item
    const key = items.length > 0 ? getRecentCompletionsKey(params, items[0].insertText) : '';
    const completionId = recentCompletions.get(key) ?? uuid.v4();
    recentCompletions.set(key, completionId);
    event.params.id = completionId;
    if (!event.loadedAt) {
        event.loadedAt = performance.now();
    }
    if (event.items.length === 0) {
        event.items = items.map(item => completionItemToItemInfo(item, isDotComUser));
    }
}
exports.loaded = loaded;
// Suggested completions will not be logged immediately. Instead, we log them when we either hide
// them again (they are NOT accepted) or when they ARE accepted. This way, we can calculate the
// duration they were actually visible for.
//
// For statistics logging we start a timeout matching the READ_TIMEOUT_MS so we can increment the
// suggested completion count as soon as we count it as such.
function suggested(id, span) {
    const event = activeSuggestionRequests.get(id);
    if (!event) {
        return;
    }
    const completionId = event.params.id;
    if (!completionId) {
        throw new Error('Completion ID not set, make sure to call loaded() first');
    }
    if (!event.suggestedAt) {
        event.suggestedAt = performance.now();
        span?.setAttributes(getSharedParams(event));
        span?.addEvent('suggested');
        // Mark the completion as sampled if tracing is enable for this user
        const shouldSample = completion_provider_config_1.completionProviderConfig.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteTracing);
        if (shouldSample && span) {
            span.setAttribute('sampled', true);
        }
        setTimeout(() => {
            const event = activeSuggestionRequests.get(id);
            if (!event) {
                return;
            }
            // We can assume that this completion will be marked as `read: true` because
            // READ_TIMEOUT_MS has passed without the completion being logged yet.
            if (event.suggestedAt && !event.suggestionAnalyticsLoggedAt && !event.suggestionLoggedAt) {
                if (completionIdsMarkedAsSuggested.has(completionId)) {
                    return;
                }
                statistics.logSuggested();
                completionIdsMarkedAsSuggested.set(completionId, true);
                event.suggestionAnalyticsLoggedAt = performance.now();
            }
        }, READ_TIMEOUT_MS);
    }
}
exports.suggested = suggested;
function accepted(id, document, completion, trackedRange, isDotComUser) {
    const completionEvent = activeSuggestionRequests.get(id);
    if (!completionEvent || completionEvent.acceptedAt) {
        // Log a debug event, this case should not happen in production
        logCompletionBookkeepingEvent('acceptedUntrackedCompletion');
        return;
    }
    // Some additional logging to ensure the invariant is correct. I expect these branches to never
    // hit but if they do, they might help debug analytics issues
    if (!completionEvent.loadedAt) {
        logCompletionBookkeepingEvent('unexpectedNotLoaded');
    }
    if (!completionEvent.startLoggedAt) {
        logCompletionBookkeepingEvent('unexpectedNotStarted');
    }
    if (!completionEvent.suggestedAt) {
        logCompletionBookkeepingEvent('unexpectedNotSuggested');
    }
    // It is still possible to accept a completion before it was logged as suggested. This is
    // because we do not have direct access to know when a completion is being shown or hidden from
    // VS Code. Instead, we rely on subsequent completion callbacks and other heuristics to know
    // when the current one is rejected.
    //
    // One such condition is when using backspace. In VS Code, we create completions such that they
    // always start at the binning of the line. This means when backspacing past the initial trigger
    // point, we keep showing the currently rendered completion until the next request is finished.
    // However, we do log the completion as rejected with the keystroke leaving a small window where
    // the completion can be accepted after it was marked as suggested.
    if (completionEvent.suggestionLoggedAt) {
        logCompletionBookkeepingEvent('unexpectedAlreadySuggested');
    }
    if (!completionEvent.params.id) {
        throw new Error('Completion ID not set, make sure to call loaded() first');
    }
    // Ensure the CompletionID is never reused by removing it from the recent completions cache
    let key = null;
    recentCompletions.forEach((v, k) => {
        if (v === completionEvent.params.id) {
            key = k;
        }
    });
    if (key) {
        recentCompletions.delete(key);
    }
    completionEvent.acceptedAt = performance.now();
    logSuggestionEvents();
    logCompletionAcceptedEvent({
        ...getSharedParams(completionEvent),
        acceptedItem: completionItemToItemInfo(completion, isDotComUser),
    });
    statistics.logAccepted();
    if (trackedRange === undefined || isRunningInsideAgent()) {
        return;
    }
    if (persistenceTracker === null) {
        persistenceTracker = new persistence_tracker_1.PersistenceTracker();
    }
    persistenceTracker.track({
        id: completionEvent.params.id,
        insertedAt: Date.now(),
        insertText: completion.insertText,
        insertRange: trackedRange,
        document,
    });
}
exports.accepted = accepted;
function partiallyAccept(id, completion, acceptedLength, isDotComUser) {
    const completionEvent = activeSuggestionRequests.get(id);
    // Only log partial acceptances if the completion was not yet fully accepted
    if (!completionEvent || completionEvent.acceptedAt) {
        return;
    }
    const loggedPartialAcceptedLength = completionEvent.loggedPartialAcceptedLength;
    // Do not log partial acceptances if the length of the accepted completion is not increasing
    if (acceptedLength <= loggedPartialAcceptedLength) {
        return;
    }
    const acceptedLengthDelta = acceptedLength - loggedPartialAcceptedLength;
    completionEvent.loggedPartialAcceptedLength = acceptedLength;
    logCompletionPartiallyAcceptedEvent({
        ...getSharedParams(completionEvent),
        acceptedItem: completionItemToItemInfo(completion, isDotComUser),
        acceptedLength,
        acceptedLengthDelta,
    });
}
exports.partiallyAccept = partiallyAccept;
/** @deprecated */
function getCompletionEvent(id) {
    return activeSuggestionRequests.get(id);
}
exports.getCompletionEvent = getCompletionEvent;
function noResponse(id) {
    const completionEvent = activeSuggestionRequests.get(id);
    if (!completionEvent) {
        return;
    }
    logCompletionNoResponseEvent(getSharedParams(completionEvent));
}
exports.noResponse = noResponse;
/**
 * This callback should be triggered whenever VS Code tries to highlight a new completion and it's
 * used to measure how long previous completions were visible.
 */
function flushActiveSuggestionRequests() {
    logSuggestionEvents();
}
exports.flushActiveSuggestionRequests = flushActiveSuggestionRequests;
function logSuggestionEvents() {
    const now = performance.now();
    // biome-ignore lint/complexity/noForEach: LRUCache#forEach has different typing than #entries, so just keeping it for now
    activeSuggestionRequests.forEach(completionEvent => {
        const { params, loadedAt, suggestedAt, suggestionLoggedAt, startedAt, startLoggedAt, acceptedAt, suggestionAnalyticsLoggedAt, } = completionEvent;
        // Only log suggestion events that were already shown to the user and
        // have not been logged yet.
        if (!loadedAt || !startLoggedAt || !suggestedAt || suggestionLoggedAt || !params.id) {
            return;
        }
        completionEvent.suggestionLoggedAt = now;
        const latency = loadedAt - startedAt;
        const displayDuration = now - suggestedAt;
        const seen = displayDuration >= READ_TIMEOUT_MS;
        const accepted = acceptedAt !== null;
        const read = accepted || seen;
        if (!suggestionAnalyticsLoggedAt) {
            completionEvent.suggestionAnalyticsLoggedAt = now;
            if (read && !completionIdsMarkedAsSuggested.has(params.id)) {
                statistics.logSuggested();
                completionIdsMarkedAsSuggested.set(params.id, true);
            }
        }
        logCompletionSuggestedEvent({
            ...getSharedParams(completionEvent),
            latency,
            displayDuration,
            read,
            accepted,
            completionsStartedSinceLastSuggestion,
        });
        completionsStartedSinceLastSuggestion = 0;
    });
    // Completions are kept in the LRU cache for longer. This is because they
    // can still become visible if e.g. they are served from the cache and we
    // need to retain the ability to mark them as seen
}
// Restores the logger's internals to a pristine state§
function reset_testOnly() {
    activeSuggestionRequests.clear();
    completionIdsMarkedAsSuggested.clear();
    recentCompletions.clear();
    completionsStartedSinceLastSuggestion = 0;
}
exports.reset_testOnly = reset_testOnly;
function lineAndCharCount({ insertText }) {
    const lineCount = (0, utils_1.lines)(insertText).length;
    const charCount = insertText.length;
    return { lineCount, charCount };
}
/**
 * To avoid overflowing our analytics pipeline, errors are throttled and logged as a cumulative
 * count grouped by message every 10 minutes (with the first event being logged immediately so we
 * can detect new errors faster)
 *
 * To do this, the first time an error is encountered it will be immediately logged and stored in
 * the map with a count of `0`. Then for subsequent errors of the same type, the count is
 * incremented and logged periodically. The count is reset to `0` after each log interval.
 */
const TEN_MINUTES = 1000 * 60 * 10;
const errorCounts = new Map();
function logError(error) {
    if (!(0, sentry_1.shouldErrorBeReported)(error)) {
        return;
    }
    (0, sentry_1.captureException)(error);
    const message = error.message;
    const traceId = (0, cody_shared_1.isNetworkError)(error) ? error.traceId : undefined;
    if (!errorCounts.has(message)) {
        errorCounts.set(message, 0);
        logCompletionErrorEvent({ message, traceId, count: 1 });
    }
    const count = errorCounts.get(message);
    if (count === 0) {
        // Start a new flush interval
        setTimeout(() => {
            const count = errorCounts.get(message);
            logCompletionErrorEvent({ message, traceId, count });
            errorCounts.set(message, 0);
        }, TEN_MINUTES);
    }
    errorCounts.set(message, count + 1);
}
exports.logError = logError;
function getSharedParams(event) {
    const otherCompletionProviders = getOtherCompletionProvider();
    return {
        ...event.params,
        items: event.items.map(i => ({ ...i })),
        otherCompletionProviderEnabled: otherCompletionProviders.length > 0,
        otherCompletionProviders,
    };
}
function completionItemToItemInfo(item, isDotComUser) {
    const { lineCount, charCount } = lineAndCharCount(item);
    const completionItemInfo = {
        lineCount,
        charCount,
        stopReason: item.stopReason,
        parseErrorCount: item.parseErrorCount,
        lineTruncatedCount: item.lineTruncatedCount,
        truncatedWith: item.truncatedWith,
        nodeTypes: item.nodeTypes,
        nodeTypesWithCompletion: item.nodeTypesWithCompletion,
    };
    // Do not log long insert text.
    // 200 is a char_count limit based on the 98 percentile from the last 14 days.
    if (isDotComUser && charCount < 200) {
        // 🚨 SECURITY: included only for DotCom users.
        completionItemInfo.insertText = item.insertText;
    }
    return completionItemInfo;
}
const otherCompletionProviders = [
    'GitHub.copilot',
    'GitHub.copilot-nightly',
    'TabNine.tabnine-vscode',
    'TabNine.tabnine-vscode-self-hosted-updater',
    'AmazonWebServices.aws-toolkit-vscode', // Includes CodeWhisperer
    'Codeium.codeium',
    'Codeium.codeium-enterprise-updater',
    'CodeComplete.codecomplete-vscode',
    'Venthe.fauxpilot',
    'TabbyML.vscode-tabby',
    'blackboxapp.blackbox',
    'devsense.intelli-php-vscode',
    'aminer.codegeex',
    'svipas.code-autocomplete',
    'mutable-ai.mutable-ai',
];
function getOtherCompletionProvider() {
    return otherCompletionProviders.filter(id => vscode.extensions.getExtension(id)?.isActive);
}
function isRunningInsideAgent() {
    const config = (0, configuration_1.getConfiguration)(vscode.workspace.getConfiguration());
    return !!config.isRunningInsideAgent;
}
