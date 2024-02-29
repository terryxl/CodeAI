/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { Range, ProtocolTextDocument } from './agent-protocol';
/**
 * Wrapper around `ProtocolTextDocument` that also contains a parsed vscode.Uri.
 *
 * We can't use `vscode.Uri` in `ProtocolTextDocument` because we use that type
 * in the JSON-RPC protocol where URIs are string-encoded.
 */
export declare class ProtocolTextDocumentWithUri {
    readonly uri: vscode.Uri;
    underlying: ProtocolTextDocument;
    private constructor();
    static fromDocument(document: ProtocolTextDocument): ProtocolTextDocumentWithUri;
    static from(uri: vscode.Uri, document?: Partial<ProtocolTextDocument>): ProtocolTextDocumentWithUri;
    get content(): string | undefined;
    get selection(): Range | undefined;
}
//# sourceMappingURL=TextDocumentWithUri.d.ts.map