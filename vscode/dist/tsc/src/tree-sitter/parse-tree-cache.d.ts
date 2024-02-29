/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { TextDocument } from 'vscode';
import type { default as Parser, Tree } from 'web-tree-sitter';
interface ParseTreeCache {
    tree: Tree;
    parser: Parser;
    cacheKey: string;
}
export declare function getCachedParseTreeForDocument(document: TextDocument): ParseTreeCache | null;
export declare function updateParseTreeCache(document: TextDocument, parser: Parser): void;
export declare function updateParseTreeOnEdit(edit: vscode.TextDocumentChangeEvent): void;
export declare function asPoint(position: Pick<vscode.Position, 'line' | 'character'>): Parser.Point;
export declare function parseAllVisibleDocuments(): void;
export {};
//# sourceMappingURL=parse-tree-cache.d.ts.map