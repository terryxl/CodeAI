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
exports.createProviderConfig = exports.MULTI_LINE_STOP_SEQUENCES = exports.SINGLE_LINE_STOP_SEQUENCES = void 0;
const anthropic = __importStar(require("@anthropic-ai/sdk"));
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const text_processing_1 = require("../text-processing");
const utils_1 = require("../utils");
const get_completion_params_1 = require("./get-completion-params");
const provider_1 = require("./provider");
const MAX_RESPONSE_TOKENS = 256;
exports.SINGLE_LINE_STOP_SEQUENCES = [
    anthropic.HUMAN_PROMPT,
    text_processing_1.CLOSING_CODE_TAG,
    text_processing_1.MULTILINE_STOP_SEQUENCE,
];
exports.MULTI_LINE_STOP_SEQUENCES = [anthropic.HUMAN_PROMPT, text_processing_1.CLOSING_CODE_TAG];
const lineNumberDependentCompletionParams = (0, get_completion_params_1.getLineNumberDependentCompletionParams)({
    singlelineStopSequences: exports.SINGLE_LINE_STOP_SEQUENCES,
    multilineStopSequences: exports.MULTI_LINE_STOP_SEQUENCES,
});
let isOutdatedSourcegraphInstanceWithoutAnthropicAllowlist = false;
class AnthropicProvider extends provider_1.Provider {
    promptChars;
    client;
    model;
    constructor(options, { maxContextTokens, client, model, }) {
        super(options);
        this.promptChars = (0, cody_shared_1.tokensToChars)(maxContextTokens - MAX_RESPONSE_TOKENS);
        this.client = client;
        this.model = model;
    }
    emptyPromptLength() {
        const { messages } = this.createPromptPrefix();
        const promptNoSnippets = (0, utils_1.messagesToText)(messages);
        return promptNoSnippets.length - 10; // extra 10 chars of buffer cuz who knows
    }
    createPromptPrefix() {
        const prefixLines = this.options.docContext.prefix.split('\n');
        if (prefixLines.length === 0) {
            throw new Error('no prefix lines');
        }
        const { head, tail, overlap } = (0, text_processing_1.getHeadAndTail)(this.options.docContext.prefix);
        // Infill block represents the code we want the model to complete
        const infillBlock = tail.trimmed.endsWith('{\n') ? tail.trimmed.trimEnd() : tail.trimmed;
        // code before the cursor, without the code extracted for the infillBlock
        const infillPrefix = head.raw;
        // code after the cursor
        const infillSuffix = this.options.docContext.suffix;
        const relativeFilePath = vscode.workspace.asRelativePath(this.options.document.fileName);
        const prefixMessagesWithInfill = [
            {
                speaker: 'human',
                text: `You are a code completion AI designed to take the surrounding code and shared context into account in order to predict and suggest high-quality code to complete the code enclosed in ${text_processing_1.OPENING_CODE_TAG} tags. You only response with code that works and fits seamlessly with surrounding code if any or use best practice and nothing else.`,
            },
            {
                speaker: 'assistant',
                text: 'I am a code completion AI with exceptional context-awareness designed to auto-complete nested code blocks with high-quality code that seamlessly integrates with surrounding code.',
            },
            {
                speaker: 'human',
                text: `Below is the code from file path ${relativeFilePath}. Review the code outside the XML tags to detect the functionality, formats, style, patterns, and logics in use. Then, use what you detect and reuse methods/libraries to complete and enclose completed code only inside XML tags precisely without duplicating existing implementations. Here is the code: \n\`\`\`\n${infillPrefix}${text_processing_1.OPENING_CODE_TAG}${text_processing_1.CLOSING_CODE_TAG}${infillSuffix}\n\`\`\``,
            },
            {
                speaker: 'assistant',
                text: `${text_processing_1.OPENING_CODE_TAG}${infillBlock}`,
            },
        ];
        return { messages: prefixMessagesWithInfill, prefix: { head, tail, overlap } };
    }
    // Creates the resulting prompt and adds as many snippets from the reference
    // list as possible.
    createPrompt(snippets) {
        const { messages: prefixMessages, prefix } = this.createPromptPrefix();
        const referenceSnippetMessages = [];
        let remainingChars = this.promptChars - this.emptyPromptLength();
        for (const snippet of snippets) {
            const snippetMessages = [
                {
                    speaker: 'human',
                    text: 'symbol' in snippet && snippet.symbol !== ''
                        ? `Additional documentation for \`${snippet.symbol}\`: ${text_processing_1.OPENING_CODE_TAG}${snippet.content}${text_processing_1.CLOSING_CODE_TAG}`
                        : `Codebase context from file path '${(0, cody_shared_1.displayPath)(snippet.uri)}': ${text_processing_1.OPENING_CODE_TAG}${snippet.content}${text_processing_1.CLOSING_CODE_TAG}`,
                },
                {
                    speaker: 'assistant',
                    text: 'I will refer to this code to complete your next request.',
                },
            ];
            const numSnippetChars = (0, utils_1.messagesToText)(snippetMessages).length + 1;
            if (numSnippetChars > remainingChars) {
                break;
            }
            referenceSnippetMessages.push(...snippetMessages);
            remainingChars -= numSnippetChars;
        }
        return { messages: [...referenceSnippetMessages, ...prefixMessages], prefix };
    }
    generateCompletions(abortSignal, snippets, tracer) {
        const { partialRequestParams, fetchAndProcessCompletionsImpl } = (0, get_completion_params_1.getCompletionParamsAndFetchImpl)({
            providerOptions: this.options,
            lineNumberDependentCompletionParams,
        });
        const requestParams = {
            ...partialRequestParams,
            messages: this.createPrompt(snippets).messages,
            temperature: 0.5,
            // Pass forward the unmodified model identifier that is set in the server's site
            // config. This allows us to keep working even if the site config was updated since
            // we read the config value.
            //
            // Note: This behavior only works when Cody Gateway is used (as that's the only backend
            //       that supports switching between providers at the same time). We also only allow
            //       models that are allowlisted on a recent SG server build to avoid regressions.
            model: !isOutdatedSourcegraphInstanceWithoutAnthropicAllowlist && isAllowlistedModel(this.model)
                ? this.model
                : undefined,
        };
        tracer?.params(requestParams);
        const completionsGenerators = Array.from({ length: this.options.n }).map(() => {
            const abortController = (0, utils_1.forkSignal)(abortSignal);
            const completionResponseGenerator = (0, utils_1.generatorWithErrorObserver)((0, utils_1.generatorWithTimeout)(this.client.complete(requestParams, abortController), requestParams.timeoutMs, abortController), error => {
                if (error instanceof Error) {
                    // If an "unsupported code completion model" error is thrown for Anthropic,
                    // it's most likely because we started adding the `model` identifier to
                    // requests to ensure the clients does not crash when the default site
                    // config value changes.
                    //
                    // Older instances do not allow for the `model` to be set, even to
                    // identifiers it supports and thus the error.
                    //
                    // If it happens once, we disable the behavior where the client includes a
                    // `model` parameter.
                    if (error.message.includes('Unsupported code completion model') ||
                        error.message.includes('Unsupported chat model') ||
                        error.message.includes('Unsupported custom model')) {
                        isOutdatedSourcegraphInstanceWithoutAnthropicAllowlist = true;
                    }
                }
            });
            return fetchAndProcessCompletionsImpl({
                completionResponseGenerator,
                abortController,
                providerSpecificPostProcess: this.postProcess,
                providerOptions: this.options,
            });
        });
        return (0, utils_1.zipGenerators)(completionsGenerators);
    }
    postProcess = (rawResponse) => {
        let completion = (0, text_processing_1.extractFromCodeBlock)(rawResponse);
        const trimmedPrefixContainNewline = this.options.docContext.prefix
            .slice(this.options.docContext.prefix.trimEnd().length)
            .includes('\n');
        if (trimmedPrefixContainNewline) {
            // The prefix already contains a `\n` that Claude was not aware of, so we remove any
            // leading `\n` followed by whitespace that Claude might add.
            completion = completion.replace(/^\s*\n\s*/, '');
        }
        else {
            completion = (0, text_processing_1.trimLeadingWhitespaceUntilNewline)(completion);
        }
        // Remove bad symbols from the start of the completion string.
        completion = (0, text_processing_1.fixBadCompletionStart)(completion);
        return completion;
    };
}
const PROVIDER_IDENTIFIER = 'anthropic';
function createProviderConfig({ maxContextTokens = 2048, model, 
/**
 * Expose provider options here too to set the from the integration tests.
 * TODO(valery): simplify this API and remove the need to expose it only for tests.
 */
providerOptions, ...otherOptions }) {
    return {
        create(options) {
            return new AnthropicProvider({
                ...options,
                ...providerOptions,
                id: PROVIDER_IDENTIFIER,
            }, { maxContextTokens, model, ...otherOptions });
        },
        contextSizeHints: (0, provider_1.standardContextSizeHints)(maxContextTokens),
        identifier: PROVIDER_IDENTIFIER,
        model: model ?? 'claude-instant-1.2',
    };
}
exports.createProviderConfig = createProviderConfig;
// All the Anthropic version identifiers that are allowlisted as being able to be passed as the
// model identifier on a Sourcegraph Server
function isAllowlistedModel(model) {
    switch (model) {
        case 'anthropic/claude-instant-1.2-cyan':
        case 'anthropic/claude-instant-1.2':
        case 'anthropic/claude-instant-v1':
        case 'anthropic/claude-instant-1':
            return true;
    }
    return false;
}
