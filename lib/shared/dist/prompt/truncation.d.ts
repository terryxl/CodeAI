import type { ActiveTextEditorSelectionRange } from '../editor';
/**
 * Truncates text to the given number of tokens, keeping the start of the text.
 */
export declare function truncateText(text: string, maxTokens: number): string;
/**
 * If text was truncated, return the truncated text and range to which it was truncated.
 * If the text is shorter than maxBytes, then return the text as-is with an undefined
 * range.
 * Note: the truncated text and range may be empty (e.g., for single-line files,
 * which should be ignored anyway).
 */
export declare function truncateTextNearestLine(text: string, maxBytes: number): {
    truncated: string;
    range?: ActiveTextEditorSelectionRange;
};
/**
 * Truncates text to the given number of tokens, keeping the end of the text.
 */
export declare function truncateTextStart(text: string, maxTokens: number): string;
//# sourceMappingURL=truncation.d.ts.map