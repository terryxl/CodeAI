import type { URI } from 'vscode-uri';
/**
 * Programming languages that we treat specially. Add to this (and {@link languageFromFilename} as
 * needed).
 *
 * This is not an enum because {@link languageFromFilename} needs to sometimes return un-typed
 * values (for unrecognized languages).
 */
export declare const ProgrammingLanguage: {
    JavaScript: string;
    TypeScript: string;
    Python: string;
    Java: string;
    Go: string;
    Markdown: string;
    PlainText: string;
};
export declare function extensionForLanguage(language: string): string | undefined;
/**
 * Infer the programming language of {@file} based solely on its filename.
 *
 * For languages that we want to programmatically treat specially, check the return value against
 * the {@link ProgrammingLanguage} enum instead of strings like 'java'.
 */
export declare function languageFromFilename(file: URI): string;
/**
 * Infer the language ID to use in a Markdown code block for the given filename's code.
 *
 * For example, a Go file would have the following Markdown:
 *
 *     ```go
 *     ... code ...
 *     ```
 *
 * In this example, the language ID is `go`.
 *
 * There is no standard ID convention for Markdown code blocks, so we have to do some guesswork.
 */
export declare function markdownCodeBlockLanguageIDForFilename(file: URI): string;
//# sourceMappingURL=languages.d.ts.map