/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ContextFile, type ContextFileFile, type ContextFileSymbol } from '@sourcegraph/cody-shared';
/**
 * Searches all workspaces for files matching the given string. VS Code doesn't
 * provide an API for fuzzy file searching, only precise globs, so we recreate
 * it by getting a list of all files across all workspaces and using fuzzysort.
 */
export declare function getFileContextFiles(query: string, maxResults: number, token: vscode.CancellationToken): Promise<ContextFileFile[]>;
export declare function getSymbolContextFiles(query: string, maxResults?: number): Promise<ContextFileSymbol[]>;
export declare function getOpenTabsContextFile(): ContextFile[];
//# sourceMappingURL=editor-context.d.ts.map