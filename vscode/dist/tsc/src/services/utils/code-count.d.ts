export declare function countCode(code: string): {
    lineCount: number;
    charCount: number;
};
/**
 * Handle edge cases for code snippets where code is not pasted correctly
 * or code is multiline and the formatting is changed on paste
 */
export declare function matchCodeSnippets(copiedText: string, text: string): boolean;
//# sourceMappingURL=code-count.d.ts.map