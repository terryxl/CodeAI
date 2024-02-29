"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claude = void 0;
const constants_1 = require("../constants");
const generic_1 = require("./generic");
const RESPONSE_PREFIX = `<${constants_1.PROMPT_TOPICS.OUTPUT}>\n`;
const SHARED_PARAMETERS = {
    responseTopic: constants_1.PROMPT_TOPICS.OUTPUT,
    stopSequences: [`</${constants_1.PROMPT_TOPICS.OUTPUT}>`],
    assistantText: RESPONSE_PREFIX,
    assistantPrefix: RESPONSE_PREFIX,
};
exports.claude = {
    getEdit(options) {
        return {
            ...SHARED_PARAMETERS,
            prompt: (0, generic_1.buildGenericPrompt)('edit', options),
        };
    },
    getDoc(options) {
        return {
            ...SHARED_PARAMETERS,
            prompt: (0, generic_1.buildGenericPrompt)('doc', options),
        };
    },
    getFix(options) {
        return {
            ...SHARED_PARAMETERS,
            prompt: (0, generic_1.buildGenericPrompt)('fix', options),
        };
    },
    getAdd(options) {
        let assistantPreamble = '';
        if (options.precedingText) {
            assistantPreamble = `<${constants_1.PROMPT_TOPICS.PRECEDING}>${options.precedingText}</${constants_1.PROMPT_TOPICS.PRECEDING}>`;
        }
        return {
            ...SHARED_PARAMETERS,
            assistantText: `${assistantPreamble}${RESPONSE_PREFIX}`,
            prompt: (0, generic_1.buildGenericPrompt)('add', options),
        };
    },
    getTest(options) {
        return {
            ...SHARED_PARAMETERS,
            prompt: (0, generic_1.buildGenericPrompt)('test', options),
        };
    },
};
