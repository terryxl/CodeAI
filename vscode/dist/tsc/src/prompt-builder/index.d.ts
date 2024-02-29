import { type Message } from '@sourcegraph/cody-shared';
import type { ContextItem } from './types';
/**
 * PromptBuilder constructs a full prompt given a charLimit constraint.
 * The final prompt is constructed by concatenating the following fields:
 * - prefixMessages
 * - the reverse of reverseMessages
 */
export declare class PromptBuilder {
    private readonly charLimit;
    private prefixMessages;
    private reverseMessages;
    private charsUsed;
    private seenContext;
    constructor(charLimit: number);
    build(): Message[];
    tryAddToPrefix(messages: Message[]): boolean;
    tryAdd(message: Message): boolean;
    /**
     * Tries to add context items to the prompt, tracking characters used.
     * Returns info about which items were used vs. ignored.
     *
     * If charLimit is specified, then imposes an additional limit on the
     * amount of context added from contextItems. This does not affect the
     * overall character limit, which is still enforced.
     */
    tryAddContext(contextItems: ContextItem[], charLimit?: number): {
        limitReached: boolean;
        used: ContextItem[];
        ignored: ContextItem[];
        duplicate: ContextItem[];
    };
}
//# sourceMappingURL=index.d.ts.map