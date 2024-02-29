"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProviderConfig = exports.isLocalCompletionsProvider = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../../log");
const language_1 = require("../../tree-sitter/language");
const utils_1 = require("../utils");
const ollama_models_1 = require("./ollama-models");
const fetch_and_process_completions_1 = require("./fetch-and-process-completions");
const provider_1 = require("./provider");
const text_processing_1 = require("../text-processing");
function fileNameLine(uri, commentStart) {
    return `${commentStart} Path: ${(0, cody_shared_1.displayPath)(uri)}\n`;
}
/**
 * An *experimental* completion provider that uses [Ollama](https://ollama.ai), which is a tool for
 * running LLMs locally.
 *
 * The provider communicates with an Ollama server's [REST
 * API](https://github.com/jmorganca/ollama#rest-api).
 */
class ExperimentalOllamaProvider extends provider_1.Provider {
    ollamaOptions;
    constructor(options, ollamaOptions) {
        super(options);
        this.ollamaOptions = ollamaOptions;
    }
    createPromptContext(snippets, isInfill, modelHelpers) {
        const { languageId, uri } = this.options.document;
        const config = (0, language_1.getLanguageConfig)(languageId);
        const commentStart = config?.commentStart || '//';
        const context = snippets
            .map(({ uri, content }) => fileNameLine(uri, commentStart) +
            content
                .split('\n')
                .map(line => `${commentStart} ${line}`)
                .join('\n'))
            .join('\n\n');
        const currentFileNameComment = fileNameLine(uri, commentStart);
        const prompt = {
            snippets: [],
            uri,
            languageId,
            context,
            currentFileNameComment,
            isInfill,
            prefix: this.options.docContext.prefix,
            suffix: (0, text_processing_1.getSuffixAfterFirstNewline)(this.options.docContext.suffix),
        };
        if (process.env.OLLAMA_CONTEXT_SNIPPETS) {
            // TODO(valery): find the balance between using context and keeping a good perf.
            const maxPromptChars = 1234;
            for (const snippet of snippets) {
                const extendedSnippets = [...prompt.snippets, snippet];
                const promptLengthWithSnippet = modelHelpers.getPrompt({
                    ...prompt,
                    snippets: extendedSnippets,
                }).length;
                if (promptLengthWithSnippet > maxPromptChars) {
                    break;
                }
                prompt.snippets = extendedSnippets;
            }
        }
        return prompt;
    }
    generateCompletions(abortSignal, snippets, tracer) {
        // Only use infill if the suffix is not empty
        const useInfill = this.options.docContext.suffix.trim().length > 0;
        const isMultiline = this.options.multiline;
        const isDynamicMultiline = Boolean(this.options.dynamicMultilineCompletions);
        const timeoutMs = 5_0000;
        const modelHelpers = (0, ollama_models_1.getModelHelpers)(this.ollamaOptions.model);
        const promptContext = this.createPromptContext(snippets, useInfill, modelHelpers);
        const requestParams = {
            prompt: modelHelpers.getPrompt(promptContext),
            template: '{{ .Prompt }}',
            model: this.ollamaOptions.model,
            options: modelHelpers.getRequestOptions(isMultiline, isDynamicMultiline),
        };
        if (this.ollamaOptions.parameters) {
            Object.assign(requestParams.options, this.ollamaOptions.parameters);
        }
        // TODO(valery): remove `any` casts
        tracer?.params(requestParams);
        const ollamaClient = (0, cody_shared_1.createOllamaClient)(this.ollamaOptions, log_1.logger);
        const fetchAndProcessCompletionsImpl = isDynamicMultiline
            ? fetch_and_process_completions_1.fetchAndProcessDynamicMultilineCompletions
            : fetch_and_process_completions_1.fetchAndProcessCompletions;
        const completionsGenerators = Array.from({
            length: this.options.n,
        }).map(() => {
            const abortController = (0, utils_1.forkSignal)(abortSignal);
            const completionResponseGenerator = (0, utils_1.generatorWithTimeout)(ollamaClient.complete(requestParams, abortController), timeoutMs, abortController);
            return fetchAndProcessCompletionsImpl({
                completionResponseGenerator,
                abortController,
                providerSpecificPostProcess: insertText => insertText.trim(),
                providerOptions: this.options,
            });
        });
        return (0, utils_1.zipGenerators)(completionsGenerators);
    }
}
const PROVIDER_IDENTIFIER = 'experimental-ollama';
function isLocalCompletionsProvider(providerId) {
    return providerId === PROVIDER_IDENTIFIER;
}
exports.isLocalCompletionsProvider = isLocalCompletionsProvider;
function createProviderConfig(ollamaOptions) {
    return {
        create(options) {
            return new ExperimentalOllamaProvider({
                ...options,
                // Always generate just one completion for a better perf.
                n: 1,
                // Increased first completion timeout value to account for the higher latency.
                firstCompletionTimeout: 3_0000,
                id: PROVIDER_IDENTIFIER,
            }, ollamaOptions);
        },
        contextSizeHints: {
            // We don't use other files as context yet in Ollama, so this doesn't matter.
            totalChars: 0,
            // Ollama evaluates the prompt at ~50 tok/s for codellama:7b-code on a MacBook Air M2.
            // If the prompt has a common prefix across inference requests, subsequent requests do
            // not incur prompt reevaluation and are therefore much faster. So, we want a large
            // document prefix that covers the entire document (except in cases where the document
            // is very, very large, in which case Ollama would not work well anyway).
            prefixChars: 10000,
            // For the same reason above, we want a very small suffix because otherwise Ollama needs to
            // reevaluate more tokens in the prompt. This is because the prompt is (roughly) `prefix
            // (cursor position) suffix`, so even typing a single character at the cursor position
            // invalidates the LLM's cache of the suffix.
            suffixChars: 100,
        },
        identifier: PROVIDER_IDENTIFIER,
        model: ollamaOptions.model,
    };
}
exports.createProviderConfig = createProviderConfig;
