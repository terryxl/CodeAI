import type { default as Parser, QueryMatch } from 'web-tree-sitter';
import { SupportedLanguage } from './grammars';
import { type DocumentQuerySDK } from './query-sdk';
/**
 * Should be used in tests only.
 */
export declare function initTreeSitterParser(language?: SupportedLanguage): Promise<Parser | undefined>;
/**
 * Should be used in tests only.
 */
export declare function initTreeSitterSDK(language?: SupportedLanguage): Promise<DocumentQuerySDK>;
interface FormattedMatch {
    pattern: number;
    captures: FormattedCapture[];
}
export declare function formatMatches(matches: QueryMatch[]): FormattedMatch[];
interface FormattedCapture {
    name: string;
    text: string;
}
export {};
//# sourceMappingURL=test-helpers.d.ts.map