/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { WorkspaceEditOperation } from '../jsonrpc/agent-protocol';
export declare class AgentWorkspaceEdit implements vscode.WorkspaceEdit {
    private edits;
    get operations(): WorkspaceEditOperation[];
    get size(): number;
    has(uri: vscode.Uri): boolean;
    createFile(uri: vscode.Uri, options?: {
        readonly overwrite?: boolean | undefined;
        readonly ignoreIfExists?: boolean | undefined;
        readonly contents?: Uint8Array | vscode.DataTransferFile | undefined;
    } | undefined, metadata?: vscode.WorkspaceEditEntryMetadata | undefined): void;
    deleteFile(uri: vscode.Uri, options?: {
        readonly recursive?: boolean | undefined;
        readonly ignoreIfNotExists?: boolean | undefined;
    } | undefined, metadata?: vscode.WorkspaceEditEntryMetadata | undefined): void;
    renameFile(oldUri: vscode.Uri, newUri: vscode.Uri, options?: {
        readonly overwrite?: boolean | undefined;
        readonly ignoreIfExists?: boolean | undefined;
    } | undefined, metadata?: vscode.WorkspaceEditEntryMetadata | undefined): void;
    replace(uri: vscode.Uri, range: vscode.Range, newText: string, metadata?: vscode.WorkspaceEditEntryMetadata): void;
    insert(uri: vscode.Uri, position: vscode.Position, content: string, metadata?: vscode.WorkspaceEditEntryMetadata): void;
    delete(uri: vscode.Uri, range: vscode.Range, metadata?: vscode.WorkspaceEditEntryMetadata): void;
    private editOperation;
    entries(): [vscode.Uri, vscode.TextEdit[]][];
    set(uri: vscode.Uri, edits: readonly (vscode.TextEdit | vscode.SnippetTextEdit)[]): void;
    set(uri: vscode.Uri, edits: readonly [vscode.TextEdit | vscode.SnippetTextEdit, vscode.WorkspaceEditEntryMetadata][]): void;
    set(uri: vscode.Uri, edits: readonly vscode.NotebookEdit[]): void;
    set(uri: vscode.Uri, edits: readonly [vscode.NotebookEdit, vscode.WorkspaceEditEntryMetadata][]): void;
    get(uri: vscode.Uri): vscode.TextEdit[];
}
//# sourceMappingURL=AgentWorkspaceEdit.d.ts.map