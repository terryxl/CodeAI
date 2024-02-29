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
exports.getInlineCompletionItemProviderFilters = exports.createInlineCompletionItemProvider = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../log");
const inline_completion_item_provider_1 = require("./inline-completion-item-provider");
const create_provider_1 = require("./providers/create-provider");
const traceView_1 = require("./tracer/traceView");
const completion_provider_config_1 = require("./completion-provider-config");
/**
 * Inline completion item providers that always returns an empty reply.
 * Implemented as a class instead of anonymous function so that you can identify
 * it with `console.log()` debugging.
 */
class NoopCompletionItemProvider {
    provideInlineCompletionItems(_document, _position, _context, _token) {
        return { items: [] };
    }
}
async function createInlineCompletionItemProvider({ config, client, statusBar, authProvider, triggerNotice, createBfgRetriever, }) {
    const authStatus = authProvider.getAuthStatus();
    if (!authStatus.isLoggedIn) {
        (0, log_1.logDebug)('CodyCompletionProvider:notSignedIn', 'You are not signed in.');
        if (config.isRunningInsideAgent) {
            // Register an empty completion provider when running inside the
            // agent to avoid timeouts because it awaits for an
            // `InlineCompletionItemProvider` to be registered.
            return vscode.languages.registerInlineCompletionItemProvider('*', new NoopCompletionItemProvider());
        }
        return {
            dispose: () => { },
        };
    }
    const disposables = [];
    const [providerConfig] = await Promise.all([
        (0, create_provider_1.createProviderConfig)(config, client, authStatus),
        completion_provider_config_1.completionProviderConfig.init(config, cody_shared_1.featureFlagProvider),
    ]);
    if (providerConfig) {
        const authStatus = authProvider.getAuthStatus();
        const completionsProvider = new inline_completion_item_provider_1.InlineCompletionItemProvider({
            authStatus,
            providerConfig,
            statusBar,
            completeSuggestWidgetSelection: config.autocompleteCompleteSuggestWidgetSelection,
            formatOnAccept: config.autocompleteFormatOnAccept,
            disableInsideComments: config.autocompleteDisableInsideComments,
            triggerNotice,
            isRunningInsideAgent: config.isRunningInsideAgent,
            createBfgRetriever,
            isDotComUser: (0, cody_shared_1.isDotCom)(authStatus.endpoint || ''),
        });
        const documentFilters = await getInlineCompletionItemProviderFilters(config.autocompleteLanguages);
        disposables.push(vscode.commands.registerCommand('cody.autocomplete.manual-trigger', () => completionsProvider.manuallyTriggerCompletion()), vscode.languages.registerInlineCompletionItemProvider([{ notebookType: '*' }, ...documentFilters], completionsProvider), (0, traceView_1.registerAutocompleteTraceView)(completionsProvider), completionsProvider);
    }
    else if (config.isRunningInsideAgent) {
        throw new Error(`Can't register completion provider because \`providerConfig\` evaluated to \`null\`. To fix this problem, debug why createProviderConfig returned null instead of ProviderConfig. To further debug this problem, here is the configuration:\n${JSON.stringify(config, null, 2)}`);
    }
    return {
        dispose: () => {
            for (const disposable of disposables) {
                disposable.dispose();
            }
        },
    };
}
exports.createInlineCompletionItemProvider = createInlineCompletionItemProvider;
// Languages which should be disabled, but they are not present in
// https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
// But they exist in the `vscode.languages.getLanguages()` return value.
//
// To avoid confusing users with unknown language IDs, we disable them here programmatically.
const DISABLED_LANGUAGES = new Set(['scminput']);
async function getInlineCompletionItemProviderFilters(autocompleteLanguages) {
    const { '*': isEnabledForAll, ...perLanguageConfig } = autocompleteLanguages;
    const languageIds = await vscode.languages.getLanguages();
    return languageIds.flatMap(language => {
        const enabled = !DISABLED_LANGUAGES.has(language) && language in perLanguageConfig
            ? perLanguageConfig[language]
            : isEnabledForAll;
        return enabled ? [{ language, scheme: 'file' }] : [];
    });
}
exports.getInlineCompletionItemProviderFilters = getInlineCompletionItemProviderFilters;
