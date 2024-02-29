/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type ActiveTextEditorSelection, type ContextFile } from '@sourcegraph/cody-shared';
/**
 * Creates display text for the given context files by replacing file names with markdown links.
 */
export declare function createDisplayTextWithFileLinks(humanInput: string, files: ContextFile[]): string;
/**
 * Gets the display text to show for the human's input.
 *
 * If there is a selection, display the file name + range alongside with human input
 * If the workspace root is available, it generates a markdown link to the file.
 */
export declare function createDisplayTextWithFileSelection(humanInput: string, selection?: ActiveTextEditorSelection | null): string;
/**
 * VS Code intentionally limits what `command:vscode.open?ARGS` can have for args (see
 * https://github.com/microsoft/vscode/issues/178868#issuecomment-1494826381); you can't pass a
 * selection or viewColumn. We need to proxy `vscode.open` to be able to pass these args.
 *
 * Also update `lib/shared/src/chat/markdown.ts`'s `ALLOWED_URI_REGEXP` if you change this.
 */
export declare const CODY_PASSTHROUGH_VSCODE_OPEN_COMMAND_ID = "_cody.vscode.open";
/**
 * Replaces a file name in given text with markdown link to open that file in editor.
 * @returns The updated text with the file name replaced by a markdown link.
 */
export declare function replaceFileNameWithMarkdownLink(humanInput: string, file: vscode.Uri, range?: vscode.Range, symbolName?: string): string;
//# sourceMappingURL=display-text.d.ts.map