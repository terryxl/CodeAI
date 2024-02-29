/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { URI } from 'vscode-uri';
/**
 * Checks if a file URI exists in current workspace.
 */
export declare function doesFileExist(uri: vscode.Uri): Promise<boolean>;
/**
 * Decodes the text contents of a VS Code file URI.
 * @param fileUri - The VS Code URI of the file to decode.
 * @returns A Promise resolving to the decoded text contents of the file.
 */
export declare function getDocText(fileUri: URI): Promise<string>;
//# sourceMappingURL=workspace-files.d.ts.map