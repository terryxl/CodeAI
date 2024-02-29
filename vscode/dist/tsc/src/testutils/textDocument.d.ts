/// <reference path="../../../../src/fileUri.d.ts" />
import type { Range, TextDocument as VSCodeTextDocument } from 'vscode';
import type { TextDocument } from 'vscode-languageserver-textdocument';
export declare function wrapVSCodeTextDocument(doc: TextDocument): VSCodeTextDocument;
export declare function range(startLine: number, startCharacter: number, endLine?: number, endCharacter?: number): Range;
/**
 * A helper to convert paths and file URIs on objects to posix form so that test snapshots can always use
 * forward slashes and work on Windows.
 *
 * Drive letters will be removed so that `c:\foo.txt` on Windows and `/foo.txt` on POSIX will both be set
 * to `/foo.txt`.
 *
 * This function is only intended to be used to simplify expectations that compare to JSON objects and/or
 * inline snapshots (all production code executed in the test must handle Windows paths correctly).
 * @param obj the object (or array of objects) to fix paths on
 * @returns obj
 */
export declare function withPosixPaths<T extends object>(obj: T): T;
export declare function withPosixPathsInString(text: string): string;
//# sourceMappingURL=textDocument.d.ts.map