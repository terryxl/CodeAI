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
exports.InlineCompletionItemProvider = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../log");
const LocalStorageProvider_1 = require("../services/LocalStorageProvider");
const telemetry_1 = require("../services/telemetry");
const artificial_delay_1 = require("./artificial-delay");
const context_mixer_1 = require("./context/context-mixer");
const context_strategy_1 = require("./context/context-strategy");
const doc_context_getters_1 = require("./doc-context-getters");
const first_completion_decoration_handler_1 = require("./first-completion-decoration-handler");
const format_completion_1 = require("./format-completion");
const get_current_doc_context_1 = require("./get-current-doc-context");
const get_inline_completions_1 = require("./get-inline-completions");
const is_completion_visible_1 = require("./is-completion-visible");
const CompletionLogger = __importStar(require("./logger"));
const request_manager_1 = require("./request-manager");
const reuse_last_candidate_1 = require("./reuse-last-candidate");
const suggested_autocomplete_items_cache_1 = require("./suggested-autocomplete-items-cache");
const experimental_ollama_1 = require("./providers/experimental-ollama");
const completion_provider_config_1 = require("./completion-provider-config");
const utils_1 = require("../services/open-telemetry/utils");
const smart_throttle_1 = require("./smart-throttle");
class InlineCompletionItemProvider {
    lastCompletionRequest = null;
    // This field is going to be set if you use the keyboard shortcut to manually trigger a
    // completion. Since VS Code does not provide a way to distinguish manual vs automatic
    // completions, we use consult this field inside the completion callback instead.
    lastManualCompletionTimestamp = null;
    // private reportedErrorMessages: Map<string, number> = new Map()
    config;
    requestManager;
    contextMixer;
    smartThrottleService = null;
    /** Mockable (for testing only). */
    getInlineCompletions = get_inline_completions_1.getInlineCompletions;
    /** Accessible for testing only. */
    lastCandidate;
    lastAcceptedCompletionItem;
    disposables = [];
    isProbablyNewInstall = true;
    firstCompletionDecoration = new first_completion_decoration_handler_1.FirstCompletionDecorationHandler();
    constructor({ completeSuggestWidgetSelection = true, formatOnAccept = true, disableInsideComments = false, tracer = null, createBfgRetriever, ...config }) {
        this.config = {
            ...config,
            completeSuggestWidgetSelection,
            formatOnAccept,
            disableInsideComments,
            tracer,
            isRunningInsideAgent: config.isRunningInsideAgent ?? false,
            isDotComUser: config.isDotComUser ?? false,
        };
        if (this.config.completeSuggestWidgetSelection) {
            // This must be set to true, or else the suggest widget showing will suppress inline
            // completions. Note that the VS Code proposed API inlineCompletionsAdditions contains
            // an InlineCompletionList#suppressSuggestions field that lets an inline completion
            // provider override this on a per-completion basis. Because that API is proposed, we
            // can't use it and must instead resort to writing to the user's VS Code settings.
            //
            // The cody.autocomplete.experimental.completeSuggestWidgetSelection setting is
            // experimental and off by default. Before turning it on by default, we need to try to
            // find a workaround that is not silently updating the user's VS Code settings.
            void vscode.workspace
                .getConfiguration()
                .update('editor.inlineSuggest.suppressSuggestions', true, vscode.ConfigurationTarget.Global);
        }
        this.requestManager = new request_manager_1.RequestManager();
        this.contextMixer = new context_mixer_1.ContextMixer(new context_strategy_1.DefaultContextStrategyFactory(completion_provider_config_1.completionProviderConfig.contextStrategy, createBfgRetriever));
        if (completion_provider_config_1.completionProviderConfig.smartThrottle) {
            this.smartThrottleService = new smart_throttle_1.SmartThrottleService();
            this.disposables.push(this.smartThrottleService);
        }
        const chatHistory = LocalStorageProvider_1.localStorage.getChatHistory(this.config.authStatus)?.chat;
        this.isProbablyNewInstall = !chatHistory || Object.entries(chatHistory).length === 0;
        (0, log_1.logDebug)('CodyCompletionProvider:initialized', [this.config.providerConfig.identifier, this.config.providerConfig.model].join('/'));
        this.disposables.push(this.contextMixer, vscode.commands.registerCommand('cody.autocomplete.inline.accepted', ({ codyCompletion }) => {
            void this.handleDidAcceptCompletionItem(codyCompletion);
        }));
        // Warm caches for the config feature configuration to avoid the first completion call
        // having to block on this.
        void cody_shared_1.ConfigFeaturesSingleton.getInstance().getConfigFeatures();
    }
    /** Set the tracer (or unset it with `null`). */
    setTracer(value) {
        this.config.tracer = value;
    }
    lastCompletionRequestTimestamp = 0;
    async provideInlineCompletionItems(document, position, context, 
    // Making it optional here to execute multiple suggestion in parallel from the CLI script.
    token) {
        // Do not create item for files that are on the cody ignore list
        if ((0, cody_shared_1.isCodyIgnoredFile)(document.uri)) {
            return null;
        }
        return (0, cody_shared_1.wrapInActiveSpan)('autocomplete.provideInlineCompletionItems', async (span) => {
            // Update the last request
            const lastCompletionRequest = this.lastCompletionRequest;
            const completionRequest = {
                document,
                position,
                context,
            };
            this.lastCompletionRequest = completionRequest;
            const configFeatures = await cody_shared_1.ConfigFeaturesSingleton.getInstance().getConfigFeatures();
            if (!configFeatures.autoComplete) {
                // If Configfeatures exists and autocomplete is disabled then raise
                // the error banner for autocomplete config turned off
                const error = new Error('AutocompleteConfigTurnedOff');
                this.onError(error);
                throw error;
            }
            const start = performance.now();
            if (!this.lastCompletionRequestTimestamp) {
                this.lastCompletionRequestTimestamp = start;
            }
            const tracer = this.config.tracer ? createTracerForInvocation(this.config.tracer) : undefined;
            let stopLoading;
            const setIsLoading = (isLoading) => {
                if (isLoading) {
                    // We do not want to show a loading spinner when the user is rate limited to
                    // avoid visual churn.
                    //
                    // We still make the request to find out if the user is still rate limited.
                    const hasRateLimitError = this.config.statusBar.hasError(cody_shared_1.RateLimitError.errorName);
                    if (!hasRateLimitError) {
                        stopLoading = this.config.statusBar.startLoading('Completions are being generated', {
                            timeoutMs: 30_000,
                        });
                    }
                }
                else {
                    stopLoading?.();
                }
            };
            const abortController = new AbortController();
            if (token) {
                if (token.isCancellationRequested) {
                    abortController.abort();
                }
                token.onCancellationRequested(() => abortController.abort());
            }
            // When the user has the completions popup open and an item is selected that does not match
            // the text that is already in the editor, VS Code will never render the completion.
            if (!currentEditorContentMatchesPopupItem(document, context)) {
                return null;
            }
            let takeSuggestWidgetSelectionIntoAccount = false;
            // Only take the completion widget selection into account if the selection was actively changed
            // by the user
            if (this.config.completeSuggestWidgetSelection &&
                lastCompletionRequest &&
                onlyCompletionWidgetSelectionChanged(lastCompletionRequest, completionRequest)) {
                takeSuggestWidgetSelectionIntoAccount = true;
            }
            const triggerKind = this.lastManualCompletionTimestamp &&
                this.lastManualCompletionTimestamp > Date.now() - 500
                ? get_inline_completions_1.TriggerKind.Manual
                : context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic
                    ? get_inline_completions_1.TriggerKind.Automatic
                    : takeSuggestWidgetSelectionIntoAccount
                        ? get_inline_completions_1.TriggerKind.SuggestWidget
                        : get_inline_completions_1.TriggerKind.Hover;
            this.lastManualCompletionTimestamp = null;
            const docContext = (0, get_current_doc_context_1.getCurrentDocContext)({
                document,
                position,
                maxPrefixLength: this.config.providerConfig.contextSizeHints.prefixChars,
                maxSuffixLength: this.config.providerConfig.contextSizeHints.suffixChars,
                // We ignore the current context selection if completeSuggestWidgetSelection is not enabled
                context: takeSuggestWidgetSelectionIntoAccount ? context : undefined,
                dynamicMultilineCompletions: completion_provider_config_1.completionProviderConfig.dynamicMultilineCompletions,
            });
            const completionIntent = (0, doc_context_getters_1.getCompletionIntent)({
                document,
                position,
                prefix: docContext.prefix,
            });
            if (this.config.disableInsideComments && completionIntent === 'comment') {
                return null;
            }
            const latencyFeatureFlags = {
                user: completion_provider_config_1.completionProviderConfig.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteUserLatency),
            };
            const artificialDelay = (0, artificial_delay_1.getArtificialDelay)(latencyFeatureFlags, document.uri.toString(), document.languageId, completionIntent);
            const isLocalProvider = (0, experimental_ollama_1.isLocalCompletionsProvider)(this.config.providerConfig.identifier);
            const isEagerCancellationEnabled = completion_provider_config_1.completionProviderConfig.getPrefetchedFlag(cody_shared_1.FeatureFlag.CodyAutocompleteEagerCancellation);
            const debounceInterval = isLocalProvider ? 125 : isEagerCancellationEnabled ? 10 : 75;
            try {
                const result = await this.getInlineCompletions({
                    document,
                    position,
                    triggerKind,
                    selectedCompletionInfo: context.selectedCompletionInfo,
                    docContext,
                    providerConfig: this.config.providerConfig,
                    contextMixer: this.contextMixer,
                    requestManager: this.requestManager,
                    smartThrottleService: this.smartThrottleService,
                    lastCandidate: this.lastCandidate,
                    debounceInterval: {
                        singleLine: debounceInterval,
                        multiLine: debounceInterval,
                    },
                    setIsLoading,
                    abortSignal: abortController.signal,
                    tracer,
                    handleDidAcceptCompletionItem: this.handleDidAcceptCompletionItem.bind(this),
                    handleDidPartiallyAcceptCompletionItem: this.unstable_handleDidPartiallyAcceptCompletionItem.bind(this),
                    completeSuggestWidgetSelection: takeSuggestWidgetSelectionIntoAccount,
                    artificialDelay,
                    completionIntent,
                    lastAcceptedCompletionItem: this.lastAcceptedCompletionItem,
                    isDotComUser: this.config.isDotComUser,
                });
                // Avoid any further work if the completion is invalidated already.
                if (abortController.signal.aborted) {
                    return null;
                }
                if (!result) {
                    // Returning null will clear any existing suggestions, thus we need to reset the
                    // last candidate.
                    this.lastCandidate = undefined;
                    return null;
                }
                // Checks if the current line prefix length is less than or equal to the last triggered prefix length
                // If true, that means user has backspaced/deleted characters to trigger a new completion request,
                // meaning the previous result is unwanted/rejected.
                // In that case, we mark the last candidate as "unwanted", remove it from cache, and clear the last candidate
                const currentPrefix = docContext.currentLinePrefix;
                const lastTriggeredPrefix = this.lastCandidate?.lastTriggerDocContext.currentLinePrefix;
                if (this.lastCandidate &&
                    lastTriggeredPrefix !== undefined &&
                    currentPrefix.length < lastTriggeredPrefix.length) {
                    this.handleUnwantedCompletionItem((0, reuse_last_candidate_1.getRequestParamsFromLastCandidate)(document, this.lastCandidate));
                }
                const visibleItems = result.items.filter(item => (0, is_completion_visible_1.isCompletionVisible)(item, document, position, docContext, context, takeSuggestWidgetSelectionIntoAccount, abortController.signal));
                // A completion that won't be visible in VS Code will not be returned and not be logged.
                if (visibleItems.length === 0) {
                    // Returning null will clear any existing suggestions, thus we need to reset the
                    // last candidate.
                    this.lastCandidate = undefined;
                    CompletionLogger.noResponse(result.logId);
                    return null;
                }
                // Since we now know that the completion is going to be visible in the UI, we save the
                // completion as the last candidate (that is shown as ghost text in the editor) so that
                // we can reuse it if the user types in such a way that it is still valid (such as by
                // typing `ab` if the ghost text suggests `abcd`).
                if (result.source !== get_inline_completions_1.InlineCompletionsResultSource.LastCandidate) {
                    this.lastCandidate = {
                        uri: document.uri,
                        lastTriggerPosition: position,
                        lastTriggerDocContext: docContext,
                        lastTriggerSelectedCompletionInfo: context?.selectedCompletionInfo,
                        result,
                    };
                }
                const autocompleteItems = (0, suggested_autocomplete_items_cache_1.analyticsItemToAutocompleteItem)(result.logId, document, docContext, position, visibleItems, context, span);
                // Store the log ID for each completion item so that we can later map to the selected
                // item from the ID alone
                for (const item of autocompleteItems) {
                    suggested_autocomplete_items_cache_1.suggestedAutocompleteItemsCache.add(item);
                }
                // return `CompletionEvent` telemetry data to the agent command `autocomplete/execute`.
                const autocompleteResult = {
                    logId: result.logId,
                    items: (0, suggested_autocomplete_items_cache_1.updateInsertRangeForVSCode)(autocompleteItems),
                    completionEvent: CompletionLogger.getCompletionEvent(result.logId),
                };
                if (!this.config.isRunningInsideAgent) {
                    // Since VS Code has no callback as to when a completion is shown, we assume
                    // that if we pass the above visibility tests, the completion is going to be
                    // rendered in the UI
                    this.unstable_handleDidShowCompletionItem(autocompleteItems[0]);
                }
                (0, utils_1.recordExposedExperimentsToSpan)(span);
                return autocompleteResult;
            }
            catch (error) {
                this.onError(error);
                throw error;
            }
        });
    }
    /**
     * Callback to be called when the user accepts a completion. For VS Code, this is part of the
     * action inside the `AutocompleteItem`. Agent needs to call this callback manually.
     */
    async handleDidAcceptCompletionItem(completionOrItemId) {
        const completion = suggested_autocomplete_items_cache_1.suggestedAutocompleteItemsCache.get(completionOrItemId);
        if (!completion) {
            return;
        }
        if (this.config.formatOnAccept && !this.config.isRunningInsideAgent) {
            await (0, format_completion_1.formatCompletion)(completion);
        }
        (0, artificial_delay_1.resetArtificialDelay)();
        // When a completion is accepted, the lastCandidate should be cleared. This makes sure the
        // log id is never reused if the completion is accepted.
        this.clearLastCandidate();
        // Remove the completion from the network cache
        this.requestManager.removeFromCache(completion.requestParams);
        this.handleFirstCompletionOnboardingNotices(completion.requestParams);
        this.lastAcceptedCompletionItem = completion;
        CompletionLogger.accepted(completion.logId, completion.requestParams.document, completion.analyticsItem, completion.trackedRange, this.config.isDotComUser);
    }
    /**
     * Handles showing a notification on the first completion acceptance.
     */
    handleFirstCompletionOnboardingNotices(request) {
        const key = 'completion.inline.hasAcceptedFirstCompletion';
        if (LocalStorageProvider_1.localStorage.get(key)) {
            return; // Already seen notice.
        }
        // Mark as seen, so we don't show again after this.
        void LocalStorageProvider_1.localStorage.set(key, 'true');
        if (!this.isProbablyNewInstall) {
            // Only trigger for new installs for now, to avoid existing users from
            // seeing this. Consider removing this check in future, because existing
            // users would have had the key set above.
            return;
        }
        // Trigger external notice (chat sidebar)
        if (this.config.triggerNotice) {
            this.config.triggerNotice({ key: 'onboarding-autocomplete' });
        }
        // Show inline decoration.
        this.firstCompletionDecoration.show(request);
    }
    /**
     * Called when a suggestion is shown. This API is inspired by the proposed VS Code API of the
     * same name, it's prefixed with `unstable_` to avoid a clash when the new API goes GA.
     */
    unstable_handleDidShowCompletionItem(completionOrItemId) {
        const completion = suggested_autocomplete_items_cache_1.suggestedAutocompleteItemsCache.get(completionOrItemId);
        if (!completion) {
            return;
        }
        CompletionLogger.suggested(completion.logId, completion.span);
    }
    /**
     * Called when the user partially accepts a completion. This API is inspired by the proposed VS
     * Code API of the same name, it's prefixed with `unstable_` to avoid a clash when the new API
     * goes GA.
     */
    unstable_handleDidPartiallyAcceptCompletionItem(completion, acceptedLength) {
        CompletionLogger.partiallyAccept(completion.logId, completion.analyticsItem, acceptedLength, this.config.isDotComUser);
    }
    async manuallyTriggerCompletion() {
        await vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        this.lastManualCompletionTimestamp = Date.now();
        await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    }
    /**
     * Handles when a completion item was rejected by the user.
     *
     * A completion item is marked as rejected/unwanted when:
     * - pressing backspace on a visible suggestion
     */
    handleUnwantedCompletionItem(reqContext) {
        const completionItem = this.lastCandidate?.result.items[0];
        if (!completionItem) {
            return;
        }
        this.clearLastCandidate();
        this.requestManager.removeFromCache(reqContext);
    }
    /**
     * The user no longer wishes to see the last candidate and requests a new completion. Note this
     * is reset by heuristics when new completion requests are triggered and completions are
     * rejected as a result of that.
     */
    clearLastCandidate() {
        this.lastCandidate = undefined;
    }
    /**
     * A callback that is called whenever an error happens. We do not want to flood a users UI with
     * error messages so every unexpected error is deduplicated by its message and rate limit errors
     * are only shown once during the rate limit period.
     */
    onError(error) {
        if (error instanceof cody_shared_1.RateLimitError) {
            // If there's already an existing error, don't add another one.
            const hasRateLimitError = this.config.statusBar.hasError(error.name);
            if (hasRateLimitError) {
                return;
            }
            const isEnterpriseUser = this.config.isDotComUser !== true;
            const canUpgrade = error.upgradeIsAvailable;
            const tier = isEnterpriseUser ? 'enterprise' : canUpgrade ? 'free' : 'pro';
            let errorTitle;
            let pageName;
            if (canUpgrade) {
                errorTitle = 'Upgrade to Continue Using Cody Autocomplete';
                pageName = 'upgrade';
            }
            else {
                errorTitle = 'Cody Autocomplete Disabled Due to Rate Limit';
                pageName = 'rate-limits';
            }
            let shown = false;
            this.config.statusBar.addError({
                title: errorTitle,
                description: `${error.userMessage} ${error.retryMessage ?? ''}`.trim(),
                errorType: error.name,
                onSelect: () => {
                    if (canUpgrade) {
                        telemetry_1.telemetryService.log('CodyVSCodeExtension:upsellUsageLimitCTA:clicked', {
                            limit_type: 'suggestions',
                        });
                    }
                    void vscode.commands.executeCommand('cody.show-page', pageName);
                },
                onShow: () => {
                    if (shown) {
                        return;
                    }
                    shown = true;
                    telemetry_1.telemetryService.log(canUpgrade
                        ? 'CodyVSCodeExtension:upsellUsageLimitCTA:shown'
                        : 'CodyVSCodeExtension:abuseUsageLimitCTA:shown', {
                        limit_type: 'suggestions',
                        tier,
                    });
                },
            });
            telemetry_1.telemetryService.log(canUpgrade
                ? 'CodyVSCodeExtension:upsellUsageLimitStatusBar:shown'
                : 'CodyVSCodeExtension:abuseUsageLimitStatusBar:shown', {
                limit_type: 'suggestions',
                tier,
            });
            return;
        }
        if (error.message === 'AutocompleteConfigTurnedOff') {
            const errorTitle = 'Cody Autocomplete Disabled by Site Admin';
            // If there's already an existing error, don't add another one.
            const hasAutocompleteDisabledBanner = this.config.statusBar.hasError('AutoCompleteDisabledByAdmin');
            if (hasAutocompleteDisabledBanner) {
                return;
            }
            let shown = false;
            this.config.statusBar.addError({
                title: errorTitle,
                description: 'Contact your Sourcegraph site admin to enable autocomplete',
                errorType: 'AutoCompleteDisabledByAdmin',
                onShow: () => {
                    if (shown) {
                        return;
                    }
                    shown = true;
                },
            });
        }
        // TODO(philipp-spiess): Bring back this code once we have fewer uncaught errors
        //
        // c.f. https://sourcegraph.slack.com/archives/C05AGQYD528/p1693471486690459
        //
        // const now = Date.now()
        // if (
        //    this.reportedErrorMessages.has(error.message) &&
        //    this.reportedErrorMessages.get(error.message)! + ONE_HOUR >= now
        // ) {
        //    return
        // }
        // this.reportedErrorMessages.set(error.message, now)
        // this.config.statusBar.addError({
        //    title: 'Cody Autocomplete Encountered an Unexpected Error',
        //    description: error.message,
        //    onSelect: () => {
        //        outputChannel.show()
        //    },
        // })
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
exports.InlineCompletionItemProvider = InlineCompletionItemProvider;
let globalInvocationSequenceForTracer = 0;
/**
 * Creates a tracer for a single invocation of
 * {@link InlineCompletionItemProvider.provideInlineCompletionItems} that accumulates all of the
 * data for that invocation.
 */
function createTracerForInvocation(tracer) {
    let data = {
        invocationSequence: ++globalInvocationSequenceForTracer,
    };
    return (update) => {
        data = { ...data, ...update };
        tracer(data);
    };
}
// Check if the current text in the editor overlaps with the currently selected
// item in the completion widget.
//
// If it won't VS Code will never show an inline completions.
//
// Here's an example of how to trigger this case:
//
//  1. Type the text `console.l` in a TypeScript file.
//  2. Use the arrow keys to navigate to a suggested method that start with a
//     different letter like `console.dir`.
//  3. Since it is impossible to render a suggestion with `.dir` when the
//     editor already has `.l` in the text, VS Code won't ever render it.
function currentEditorContentMatchesPopupItem(document, context) {
    if (context.selectedCompletionInfo) {
        const currentText = document.getText(context.selectedCompletionInfo.range);
        const selectedText = context.selectedCompletionInfo.text;
        if (!selectedText.startsWith(currentText)) {
            return false;
        }
    }
    return true;
}
/**
 * Returns true if the only difference between the two requests is the selected completions info
 * item from the completions widget.
 */
function onlyCompletionWidgetSelectionChanged(prev, next) {
    if (prev.document.uri.toString() !== next.document.uri.toString()) {
        return false;
    }
    if (!prev.position.isEqual(next.position)) {
        return false;
    }
    if (prev.context.triggerKind !== next.context.triggerKind) {
        return false;
    }
    const prevSelectedCompletionInfo = prev.context.selectedCompletionInfo;
    const nextSelectedCompletionInfo = next.context.selectedCompletionInfo;
    if (!prevSelectedCompletionInfo || !nextSelectedCompletionInfo) {
        return false;
    }
    if (!prevSelectedCompletionInfo.range.isEqual(nextSelectedCompletionInfo.range)) {
        return false;
    }
    return prevSelectedCompletionInfo.text !== nextSelectedCompletionInfo.text;
}
