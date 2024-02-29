/// <reference path="../../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { GetItemsResult } from '../quick-pick';
export declare const RANGE_ITEM: vscode.QuickPickItem;
export declare const MODEL_ITEM: vscode.QuickPickItem;
export declare const DOCUMENT_ITEM: vscode.QuickPickItem;
export declare const TEST_ITEM: vscode.QuickPickItem;
export declare const getEditInputItems: (activeValue: string, activeRangeItem: vscode.QuickPickItem, activeModelItem: vscode.QuickPickItem | undefined, showModelSelector: boolean) => GetItemsResult;
//# sourceMappingURL=edit.d.ts.map