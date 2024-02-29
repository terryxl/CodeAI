import { ModelUsage } from './types';
export declare const DEFAULT_DOT_COM_MODELS: [{
    readonly title: "Claude 2.0";
    readonly model: "anthropic/claude-2.0";
    readonly provider: "Anthropic";
    readonly default: true;
    readonly codyProOnly: false;
    readonly usage: [ModelUsage.Chat, ModelUsage.Edit];
}, {
    readonly title: "Claude 2.1 Preview";
    readonly model: "anthropic/claude-2.1";
    readonly provider: "Anthropic";
    readonly default: false;
    readonly codyProOnly: true;
    readonly usage: [ModelUsage.Chat, ModelUsage.Edit];
}, {
    readonly title: "Claude Instant";
    readonly model: "anthropic/claude-instant-1.2";
    readonly provider: "Anthropic";
    readonly default: false;
    readonly codyProOnly: true;
    readonly usage: [ModelUsage.Chat, ModelUsage.Edit];
}, {
    readonly title: "GPT-3.5 Turbo";
    readonly model: "openai/gpt-3.5-turbo";
    readonly provider: "OpenAI";
    readonly default: false;
    readonly codyProOnly: true;
    readonly usage: [ModelUsage.Chat, ModelUsage.Edit];
}, {
    readonly title: "GPT-4 Turbo Preview";
    readonly model: "openai/gpt-4-1106-preview";
    readonly provider: "OpenAI";
    readonly default: false;
    readonly codyProOnly: true;
    readonly usage: [ModelUsage.Chat, ModelUsage.Edit];
}, {
    readonly title: "Mixtral 8x7B";
    readonly model: "fireworks/accounts/fireworks/models/mixtral-8x7b-instruct";
    readonly provider: "Mistral";
    readonly default: false;
    readonly codyProOnly: true;
    readonly usage: [ModelUsage.Chat];
}];
//# sourceMappingURL=dotcom.d.ts.map