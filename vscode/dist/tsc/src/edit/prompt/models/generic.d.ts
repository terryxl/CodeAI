import type { EditIntent } from '../../types';
import type { GetLLMInteractionOptions } from '../type';
interface PromptVariant {
    system?: string;
    instruction: string;
}
export declare const GENERIC_PROMPTS: Record<EditIntent, PromptVariant>;
export declare const buildGenericPrompt: (intent: EditIntent, { instruction, selectedText, uri }: GetLLMInteractionOptions) => string;
export {};
//# sourceMappingURL=generic.d.ts.map