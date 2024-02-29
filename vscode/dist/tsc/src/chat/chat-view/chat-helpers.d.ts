/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from "vscode";
import type { ActiveTextEditorSelectionRange, ContextFile, ContextMessage } from "@sourcegraph/cody-shared";
import type { ContextItem } from "../../prompt-builder/types";
export declare function openFile(uri: vscode.Uri, range?: ActiveTextEditorSelectionRange, currentViewColumn?: vscode.ViewColumn): Promise<void>;
export declare function contextMessageToContextItem(contextMessage: ContextMessage): ContextItem | null;
export declare function stripContextWrapper(text: string): string | undefined;
export declare function contextItemsToContextFiles(items: ContextItem[]): ContextFile[];
export declare function getChatPanelTitle(lastDisplayText?: string, truncateTitle?: boolean): string;
export declare function viewRangeToRange(range?: ActiveTextEditorSelectionRange): vscode.Range | undefined;
//# sourceMappingURL=chat-helpers.d.ts.map