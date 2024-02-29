/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { API } from './builtinGitExtension';
export declare function gitDirectoryUri(uri: vscode.Uri): vscode.Uri | undefined;
export declare function gitAPI(): API | undefined;
export declare function gitAPIinit(): Promise<vscode.Disposable | undefined>;
/**
 * Gets the codebase name from a workspace / file URI.
 *
 * Checks if the Git API is initialized, initializes it if not.
 * Gets the Git repository for the given URI.
 * If found, gets the codebase name from the repository.
 * Returns the codebase name, or undefined if not found.
 */
export declare function getCodebaseFromWorkspaceUri(uri: vscode.Uri): string | undefined;
//# sourceMappingURL=repositoryHelpers.d.ts.map