"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContext = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const getContextFromIntent = async ({ intent, precedingText, followingText, uri, selectionRange, editor, }) => {
    const truncatedPrecedingText = (0, cody_shared_1.truncateTextStart)(precedingText, cody_shared_1.MAX_CURRENT_FILE_TOKENS);
    const truncatedFollowingText = (0, cody_shared_1.truncateText)(followingText, cody_shared_1.MAX_CURRENT_FILE_TOKENS);
    // Disable no case declarations because we get better type checking with a switch case
    switch (intent) {
        /**
         * Very broad set of possible instructions.
         * Fetch context from the users' instructions and use context from current file.
         * Include the following code from the current file.
         * The preceding code is already included as part of the response to better guide the output.
         */
        case 'test':
        case 'add': {
            return [
                ...(0, cody_shared_1.getContextMessageWithResponse)((0, cody_shared_1.populateCodeGenerationContextTemplate)(`<${constants_1.PROMPT_TOPICS.PRECEDING}>${truncatedPrecedingText}</${constants_1.PROMPT_TOPICS.PRECEDING}>`, `<${constants_1.PROMPT_TOPICS.FOLLOWING}>${truncatedFollowingText}</${constants_1.PROMPT_TOPICS.FOLLOWING}>`, uri, constants_1.PROMPT_TOPICS.OUTPUT), { type: 'file', uri }),
            ];
        }
        /**
         * Specific case where a user is explciitly trying to "fix" a problem in their code.
         * No additional context is required. We already have the errors directly via the instruction, and we know their selected code.
         */
        case 'fix':
        /**
         * Very narrow set of possible instructions.
         * Fetching context is unlikely to be very helpful or optimal.
         */
        case 'doc': {
            const contextMessages = [];
            if (truncatedPrecedingText.trim().length > 0) {
                contextMessages.push(...(0, cody_shared_1.getContextMessageWithResponse)((0, cody_shared_1.populateCodeContextTemplate)(truncatedPrecedingText, uri, undefined, 'edit'), {
                    type: 'file',
                    uri,
                }));
            }
            if (truncatedFollowingText.trim().length > 0) {
                contextMessages.push(...(0, cody_shared_1.getContextMessageWithResponse)((0, cody_shared_1.populateCodeContextTemplate)(truncatedFollowingText, uri, undefined, 'edit'), {
                    type: 'file',
                    uri,
                }));
            }
            return contextMessages;
        }
        /**
         * Broad set of possible instructions.
         * Fetch context from the users' selection, use any errors/warnings in said selection, and use context from current file.
         * Non-code files are not considered as including Markdown syntax seems to lead to more hallucinations and poorer output quality.
         */
        case 'edit': {
            const range = selectionRange;
            const diagnostics = range ? editor.getActiveTextEditorDiagnosticsForRange(range) || [] : [];
            const errorsAndWarnings = diagnostics.filter(({ type }) => type === 'error' || type === 'warning');
            return [
                ...errorsAndWarnings.flatMap(diagnostic => (0, cody_shared_1.getContextMessageWithResponse)((0, cody_shared_1.populateCurrentEditorDiagnosticsTemplate)(diagnostic, uri), {
                    type: 'file',
                    uri,
                })),
                ...[truncatedPrecedingText, truncatedFollowingText]
                    .filter(text => text.trim().length > 0)
                    .flatMap(text => (0, cody_shared_1.getContextMessageWithResponse)((0, cody_shared_1.populateCodeContextTemplate)(text, uri, undefined, 'edit'), {
                    type: 'file',
                    uri,
                })),
            ];
        }
    }
};
const isAgentTesting = process.env.CODY_SHIM_TESTING === 'true';
const getContext = async ({ userContextFiles, editor, contextMessages, ...options }) => {
    if (contextMessages) {
        return (0, utils_1.extractContextItemsFromContextMessages)(contextMessages);
    }
    const derivedContextMessages = await getContextFromIntent({ editor, ...options });
    const userProvidedContextMessages = [];
    if (isAgentTesting) {
        // Need deterministic ordering of context files for the tests to pass
        // consistently across different file systems.
        userContextFiles.sort((a, b) => a.uri.path.localeCompare(b.uri.path));
    }
    for (const file of userContextFiles) {
        if (file.uri) {
            const content = await editor.getTextEditorContentForFile(file.uri, file.range);
            if (content) {
                const message = (0, cody_shared_1.createContextMessageByFile)(file, content);
                userProvidedContextMessages.push(...message);
            }
        }
    }
    return (0, utils_1.extractContextItemsFromContextMessages)([
        ...derivedContextMessages,
        ...userProvidedContextMessages,
    ]);
};
exports.getContext = getContext;
