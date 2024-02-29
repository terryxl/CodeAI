/**
 * Registers syntax highlighters for commonly used languages.
 *
 * This function must be called exactly once. A function is used instead of having the registerLanguage calls be
 * side effects of importing this module to prevent this module from being omitted from production builds due to
 * tree-shaking.
 */
export declare function registerHighlightContributions(): void;
//# sourceMappingURL=contributions.d.ts.map