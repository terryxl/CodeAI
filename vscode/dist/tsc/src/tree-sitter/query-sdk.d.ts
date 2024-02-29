/// <reference path="../../../../src/fileUri.d.ts" />
import type { Position, TextDocument } from 'vscode';
import type { Language, default as Parser, Point, Query, SyntaxNode } from 'web-tree-sitter';
import { type SupportedLanguage } from './grammars';
import { type CompletionIntent, type QueryName } from './queries';
interface ParsedQuery {
    compiled: Query;
    raw: string;
}
type ResolvedQueries = {
    [name in QueryName]: ParsedQuery;
};
/**
 * Reads all language queries from disk and parses them.
 * Saves queries the local cache for further use.
 */
export declare function initQueries(language: Language, languageId: SupportedLanguage, parser: Parser): void;
export interface DocumentQuerySDK {
    parser: Parser;
    queries: ResolvedQueries & QueryWrappers;
    language: SupportedLanguage;
}
/**
 * Returns the query SDK only if the language has queries defined and
 * the relevant laguage parser is initialized.
 */
export declare function getDocumentQuerySDK(language: string): DocumentQuerySDK | null;
interface QueryWrappers {
    getSinglelineTrigger: (node: SyntaxNode, start: Point, end?: Point) => [] | readonly [{
        readonly node: SyntaxNode;
        readonly name: 'trigger';
    }];
    getCompletionIntent: (node: SyntaxNode, start: Point, end?: Point) => [] | readonly [{
        readonly node: SyntaxNode;
        readonly name: CompletionIntent;
    }];
    getDocumentableNode: (node: SyntaxNode, start: Point, end?: Point) => [] | readonly [
        {
            readonly node: SyntaxNode;
            readonly name: 'documentableNode' | 'documentableExport';
        }
    ];
}
export declare function execQueryWrapper<T extends keyof QueryWrappers>(document: TextDocument, position: Pick<Position, 'line' | 'character'>, queryWrapper: T): ReturnType<QueryWrappers[T]> | never[];
export type { CompletionIntent };
//# sourceMappingURL=query-sdk.d.ts.map