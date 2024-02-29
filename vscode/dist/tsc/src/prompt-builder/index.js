"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilder = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const utils_1 = require("./utils");
const isAgentTesting = process.env.CODY_SHIM_TESTING === 'true';
/**
 * PromptBuilder constructs a full prompt given a charLimit constraint.
 * The final prompt is constructed by concatenating the following fields:
 * - prefixMessages
 * - the reverse of reverseMessages
 */
class PromptBuilder {
    charLimit;
    prefixMessages = [];
    reverseMessages = [];
    charsUsed = 0;
    seenContext = new Set();
    constructor(charLimit) {
        this.charLimit = charLimit;
    }
    build() {
        return this.prefixMessages.concat([...this.reverseMessages].reverse());
    }
    tryAddToPrefix(messages) {
        let numChars = 0;
        for (const message of messages) {
            numChars += message.speaker.length + (message.text?.length || 0) + 3; // space and 2 newlines
        }
        if (numChars + this.charsUsed > this.charLimit) {
            return false;
        }
        this.prefixMessages.push(...messages);
        this.charsUsed += numChars;
        return true;
    }
    tryAdd(message) {
        const lastMessage = this.reverseMessages.at(-1);
        if (lastMessage?.speaker === message.speaker) {
            throw new Error('Cannot add message with same speaker as last message');
        }
        const msgLen = message.speaker.length + (message.text?.length || 0) + 3; // space and 2 newlines
        if (this.charsUsed + msgLen > this.charLimit) {
            return false;
        }
        this.reverseMessages.push(message);
        this.charsUsed += msgLen;
        return true;
    }
    /**
     * Tries to add context items to the prompt, tracking characters used.
     * Returns info about which items were used vs. ignored.
     *
     * If charLimit is specified, then imposes an additional limit on the
     * amount of context added from contextItems. This does not affect the
     * overall character limit, which is still enforced.
     */
    tryAddContext(contextItems, charLimit) {
        let effectiveCharLimit = this.charLimit - this.charsUsed;
        if (charLimit && charLimit < effectiveCharLimit) {
            effectiveCharLimit = charLimit;
        }
        let limitReached = false;
        const used = [];
        const ignored = [];
        const duplicate = [];
        if (isAgentTesting) {
            // Need deterministic ordering of context files for the tests to pass
            // consistently across different file systems.
            contextItems.sort((a, b) => a.uri.path.localeCompare(b.uri.path));
            // Move the selectionContext to the first position so that it'd be
            // the last context item to be read by the LLM to avoid confusions where
            // other files also include the selection text in test files.
            const selectionContext = contextItems.find(item => item.source === 'selection');
            if (selectionContext) {
                contextItems.splice(contextItems.indexOf(selectionContext), 1);
                contextItems.unshift(selectionContext);
            }
        }
        for (const contextItem of contextItems) {
            if (contextItem.uri.scheme === 'file' && (0, cody_shared_1.isCodyIgnoredFile)(contextItem.uri)) {
                ignored.push(contextItem);
                continue;
            }
            const id = (0, utils_1.contextItemId)(contextItem);
            if (this.seenContext.has(id)) {
                duplicate.push(contextItem);
                continue;
            }
            const contextMessages = (0, utils_1.renderContextItem)(contextItem).reverse();
            const contextLen = contextMessages.reduce((acc, msg) => acc + msg.speaker.length + (msg.text?.length || 0) + 3, 0);
            if (this.charsUsed + contextLen > effectiveCharLimit) {
                ignored.push(contextItem);
                limitReached = true;
                continue;
            }
            this.seenContext.add(id);
            this.reverseMessages.push(...contextMessages);
            this.charsUsed += contextLen;
            used.push(contextItem);
        }
        return {
            limitReached,
            used,
            ignored,
            duplicate,
        };
    }
}
exports.PromptBuilder = PromptBuilder;
