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
exports.createProviderConfig = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const text_processing_1 = require("../text-processing");
const utils_1 = require("../utils");
const get_completion_params_1 = require("./get-completion-params");
const provider_1 = require("./provider");
const MAX_RESPONSE_TOKENS = 256;
const MULTI_LINE_STOP_SEQUENCES = [text_processing_1.CLOSING_CODE_TAG];
const SINGLE_LINE_STOP_SEQUENCES = [text_processing_1.CLOSING_CODE_TAG, text_processing_1.MULTILINE_STOP_SEQUENCE];
const lineNumberDependentCompletionParams = (0, get_completion_params_1.getLineNumberDependentCompletionParams)({
    singlelineStopSequences: SINGLE_LINE_STOP_SEQUENCES,
    multilineStopSequences: MULTI_LINE_STOP_SEQUENCES,
});
const PROVIDER_IDENTIFIER = 'unstable-openai';
class UnstableOpenAIProvider extends provider_1.Provider {
    client;
    promptChars;
    instructions = `You are a code completion AI designed to take the surrounding code and shared context into account in order to predict and suggest high-quality code to complete the code enclosed in ${text_processing_1.OPENING_CODE_TAG} tags.  You only respond with code that works and fits seamlessly with surrounding code. Do not include anything else beyond the code.`;
    constructor(options, { maxContextTokens, client }) {
        super(options);
        this.promptChars = (0, cody_shared_1.tokensToChars)(maxContextTokens - MAX_RESPONSE_TOKENS);
        this.client = client;
    }
    emptyPromptLength() {
        const promptNoSnippets = [this.instructions, this.createPromptPrefix()].join('\n\n');
        return promptNoSnippets.length - 10; // extra 10 chars of buffer cuz who knows
    }
    createPromptPrefix() {
        const prefixLines = this.options.docContext.prefix.split('\n');
        if (prefixLines.length === 0) {
            throw new Error('no prefix lines');
        }
        const { head, tail } = (0, text_processing_1.getHeadAndTail)(this.options.docContext.prefix);
        // Infill block represents the code we want the model to complete
        const infillBlock = tail.trimmed.endsWith('{\n') ? tail.trimmed.trimEnd() : tail.trimmed;
        // code before the cursor, without the code extracted for the infillBlock
        const infillPrefix = head.raw;
        // code after the cursor
        const infillSuffix = this.options.docContext.suffix;
        const relativeFilePath = vscode.workspace.asRelativePath(this.options.document.fileName);
        return `Below is the code from file path ${relativeFilePath}. Review the code outside the XML tags to detect the functionality, formats, style, patterns, and logics in use. Then, use what you detect and reuse methods/libraries to complete and enclose completed code only inside XML tags precisely without duplicating existing implementations. Here is the code:\n\`\`\`\n${infillPrefix}${text_processing_1.OPENING_CODE_TAG}${text_processing_1.CLOSING_CODE_TAG}${infillSuffix}\n\`\`\`

${text_processing_1.OPENING_CODE_TAG}${infillBlock}`;
    }
    // Creates the resulting prompt and adds as many snippets from the reference
    // list as possible.
    createPrompt(snippets) {
        const prefix = this.createPromptPrefix();
        const referenceSnippetMessages = [];
        let remainingChars = this.promptChars - this.emptyPromptLength();
        for (const snippet of snippets) {
            const snippetMessages = [
                'symbol' in snippet && snippet.symbol !== ''
                    ? `Additional documentation for \`${snippet.symbol}\`: ${text_processing_1.OPENING_CODE_TAG}${snippet.content}${text_processing_1.CLOSING_CODE_TAG}`
                    : `Codebase context from file path '${(0, cody_shared_1.displayPath)(snippet.uri)}': ${text_processing_1.OPENING_CODE_TAG}${snippet.content}${text_processing_1.CLOSING_CODE_TAG}`,
            ];
            const numSnippetChars = snippetMessages.join('\n\n').length + 1;
            if (numSnippetChars > remainingChars) {
                break;
            }
            referenceSnippetMessages.push(...snippetMessages);
            remainingChars -= numSnippetChars;
        }
        const messages = [this.instructions, ...referenceSnippetMessages, prefix];
        return messages.join('\n\n');
    }
    generateCompletions(abortSignal, snippets, tracer) {
        const { partialRequestParams, fetchAndProcessCompletionsImpl } = (0, get_completion_params_1.getCompletionParamsAndFetchImpl)({
            providerOptions: this.options,
            lineNumberDependentCompletionParams,
        });
        const requestParams = {
            ...partialRequestParams,
            messages: [{ speaker: 'human', text: this.createPrompt(snippets) }],
            topP: 0.5,
        };
        tracer?.params(requestParams);
        const completionsGenerators = Array.from({
            length: this.options.n,
        }).map(() => {
            const abortController = (0, utils_1.forkSignal)(abortSignal);
            const completionResponseGenerator = (0, utils_1.generatorWithTimeout)(this.client.complete(requestParams, abortController), requestParams.timeoutMs, abortController);
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
            // The prefix already contains a `\n` that LLM was not aware of, so we remove any
            // leading `\n` followed by whitespace that might be add.
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
function createProviderConfig({ model, maxContextTokens = 2048, ...otherOptions }) {
    return {
        create(options) {
            return new UnstableOpenAIProvider({
                ...options,
                id: PROVIDER_IDENTIFIER,
            }, {
                maxContextTokens,
                ...otherOptions,
            });
        },
        contextSizeHints: (0, provider_1.standardContextSizeHints)(maxContextTokens),
        identifier: PROVIDER_IDENTIFIER,
        model: model ?? 'gpt-35-turbo',
    };
}
exports.createProviderConfig = createProviderConfig;
