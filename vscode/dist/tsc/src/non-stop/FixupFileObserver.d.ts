/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import { FixupFile } from './FixupFile';
/**
 * Watches documents for renaming and deletion. Hands out handles for documents
 * which are durable across renames and the documents being closed and reopened.
 * (The vscode.TextDocument object is *not* durable in this way.)
 */
export declare class FixupFileObserver {
    private uriToFile_;
    private n_;
    /**
     * Given a document URI, provides the corresponding FixupFile. As the
     * document is renamed or deleted the FixupFile will be updated to provide
     * the current file URI. This creates a FixupFile if one does not exist and
     * starts tracking it; see maybeForUri.
     * @param uri the URI of the document to monitor.
     * @returns a new FixupFile representing the document.
     */
    forUri(uri: vscode.Uri): FixupFile;
    /**
     * Gets the FixupFile for a given URI, if one exists. This operation is
     * fast; vscode event sinks which are provided a URI can use this to quickly
     * check whether the file may have fixups.
     * @param uri the URI of the document of interest.
     * @returns a FixupFile representing the document, if one exists.
     */
    maybeForUri(uri: vscode.Uri): FixupFile | undefined;
    replaceFile(uri: vscode.Uri, newUri: vscode.Uri): FixupFile;
    private newFile;
    didDeleteFiles(event: vscode.FileDeleteEvent): void;
    didRenameFiles(event: vscode.FileRenameEvent): void;
}
//# sourceMappingURL=FixupFileObserver.d.ts.map