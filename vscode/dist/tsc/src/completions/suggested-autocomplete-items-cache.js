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
exports.updateInsertRangeForVSCode = exports.analyticsItemToAutocompleteItem = exports.suggestedAutocompleteItemsCache = exports.AutocompleteItem = void 0;
const lru_cache_1 = require("lru-cache");
const uuid = __importStar(require("uuid"));
const vscode = __importStar(require("vscode"));
class AutocompleteItem extends vscode.InlineCompletionItem {
    /**
     * An ID used to track this particular completion item. This is used mainly for the Agent which,
     * given it's JSON RPC interface, needs to be able to identify the completion item and can not
     * rely on the object reference like the VS Code API can. This allows us to simplify external
     * API's that require the completion item to only have an ID.
     */
    id;
    /**
     * An ID used to track the completion request lifecycle. This is used for completion analytics
     * bookkeeping.
     */
    logId;
    /**
     * The range needed for tracking the completion after inserting. This is needed because the
     * actual insert range might overlap with content that is already in the document since we set
     * it to always start with the current line beginning in VS Code.
     *
     * TODO: Remove the need for making having this typed as undefined.
     */
    trackedRange;
    /**
     * The request params used to fetch the completion item.
     */
    requestParams;
    /**
     * The completion item used for analytics perspectives. This one is the raw completion without
     * the VS Code specific changes applied via processInlineCompletionsForVSCode.
     */
    analyticsItem;
    /**
     * Eventual Open Telemetry span associated with the completion request
     */
    span;
    constructor(params) {
        const { insertText, logId, range, trackedRange, requestParams, completionItem, command, span } = params;
        super(insertText, range, command);
        this.id = uuid.v4();
        this.logId = logId;
        this.trackedRange = trackedRange;
        this.requestParams = requestParams;
        this.analyticsItem = completionItem;
        this.span = span;
    }
}
exports.AutocompleteItem = AutocompleteItem;
// Maintain a cache of recommended VS Code completion items. This allows us to find the suggestion
// request ID that this completion was associated with and allows our agent backend to track
// completions with a single ID (VS Code uses the completion result item object reference as an ID
// but since the agent uses a JSON RPC bridge, the object reference is no longer known later).
class SuggestedAutocompleteItemsCache {
    cache = new lru_cache_1.LRUCache({
        max: 60,
    });
    get(completionOrItemId) {
        return typeof completionOrItemId === 'string'
            ? this.cache.get(completionOrItemId)
            : completionOrItemId;
    }
    add(item) {
        this.cache.set(item.id, item);
    }
}
exports.suggestedAutocompleteItemsCache = new SuggestedAutocompleteItemsCache();
/**
 * Convert `InlineCompletionItemWithAnalytics` to `AutocompleteItem` suitable for bookkeeping
 * in completion provider callbacks like `show` and `accept`.
 */
function analyticsItemToAutocompleteItem(logId, document, docContext, position, items, context, span) {
    return items.map(item => {
        const { insertText, range } = item;
        const currentLine = document.lineAt(position);
        const start = range?.start || position;
        // If the completion does not have a range set it will always exclude the same line suffix,
        // so it has to overwrite the current same line suffix and reach to the end of the line.
        const end = range?.end || currentLine.range.end;
        const vscodeInsertRange = new vscode.Range(start, end);
        const trackedRange = new vscode.Range(start.line, start.character, end.line, end.character);
        const command = {
            title: 'Completion accepted',
            command: 'cody.autocomplete.inline.accepted',
            arguments: [
                {
                    // This is going to be set to the AutocompleteItem after initialization
                    codyCompletion: undefined,
                },
            ],
        };
        const requestParams = {
            document,
            docContext,
            selectedCompletionInfo: context.selectedCompletionInfo,
            position,
        };
        const autocompleteItem = new AutocompleteItem({
            insertText,
            logId,
            range: vscodeInsertRange,
            trackedRange,
            requestParams,
            completionItem: item,
            command,
            span,
        });
        command.arguments[0].codyCompletion = autocompleteItem;
        return autocompleteItem;
    });
}
exports.analyticsItemToAutocompleteItem = analyticsItemToAutocompleteItem;
/**
 * Adjust the completion insert text and range to start from beginning of the current line
 * (instead of starting at the given position). This avoids UI jitter in VS Code; when
 * typing or deleting individual characters, VS Code reuses the existing completion
 * while it waits for the new one to come in.
 */
function updateInsertRangeForVSCode(items) {
    return items.map(item => {
        const { insertText, range, requestParams: { position, document }, } = item;
        const currentLine = document.lineAt(position);
        const currentLinePrefix = document.getText(currentLine.range.with({ end: position }));
        const start = currentLine.range.start;
        // If the completion does not have a range set it will always exclude the same line suffix,
        // so it has to overwrite the current same line suffix and reach to the end of the line.
        const end = range?.end || currentLine.range.end;
        const vscodeInsertRange = new vscode.Range(start, end);
        item.range = vscodeInsertRange;
        item.insertText = currentLinePrefix + insertText;
        return item;
    });
}
exports.updateInsertRangeForVSCode = updateInsertRangeForVSCode;
