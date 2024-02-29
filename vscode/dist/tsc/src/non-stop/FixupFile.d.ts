/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
/**
 * A handle to a fixup file. FixupFileObserver is the factory for these; do not
 * construct them directly.
 */
export declare class FixupFile {
    private id_;
    uri_: vscode.Uri;
    constructor(id_: number, uri_: vscode.Uri);
    deleted_: boolean;
    get isDeleted(): boolean;
    get uri(): vscode.Uri;
    toString(): string;
}
//# sourceMappingURL=FixupFile.d.ts.map