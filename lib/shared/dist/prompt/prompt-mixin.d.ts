import type { InteractionMessage } from '../chat/transcript/messages';
/**
 * Prompt mixins elaborate every prompt presented to the LLM.
 * Add a prompt mixin to prompt for cross-cutting concerns relevant to multiple commands.
 */
export declare class PromptMixin {
    private readonly prompt;
    private static mixins;
    private static customMixin;
    private static defaultMixin;
    /**
     * Adds a custom prompt mixin but not to the global set to make sure it will not be added twice
     * and any new change could replace the old one.
     */
    static addCustom(mixin: PromptMixin): void;
    /**
     * Prepends all mixins to `humanMessage`. Modifies and returns `humanMessage`.
     */
    static mixInto(humanMessage: InteractionMessage): InteractionMessage;
    /**
     * Creates a mixin with the given, fixed prompt to insert.
     */
    constructor(prompt: string);
}
export declare function newPromptMixin(text: string): PromptMixin;
//# sourceMappingURL=prompt-mixin.d.ts.map