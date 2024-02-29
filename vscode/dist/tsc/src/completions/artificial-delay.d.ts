import type { CompletionIntent } from '../tree-sitter/queries';
export interface LatencyFeatureFlags {
    user?: boolean;
}
export declare const lowPerformanceLanguageIds: Set<string>;
export declare function getArtificialDelay(featureFlags: LatencyFeatureFlags, uri: string, languageId: string, completionIntent?: CompletionIntent): number;
export declare function resetArtificialDelay(timestamp?: number): void;
//# sourceMappingURL=artificial-delay.d.ts.map