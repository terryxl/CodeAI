interface LanguageConfig {
    blockStart: string;
    blockElseTest: RegExp;
    blockEnd: string | null;
    commentStart: string;
}
export declare function getLanguageConfig(languageId: string): LanguageConfig | null;
export {};
//# sourceMappingURL=language.d.ts.map