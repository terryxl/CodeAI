/// <reference path="../../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { GetItemsResult } from '../quick-pick';
import type { EditRangeItem } from './types';
import type { EditInputInitialValues } from '../get-input';
export declare const getDefaultRangeItems: (document: vscode.TextDocument, initialValues: RangeInputInitialValues) => EditRangeItem[];
interface RangeInputInitialValues extends EditInputInitialValues {
    initialCursorPosition: vscode.Position;
}
export declare const getRangeInputItems: (document: vscode.TextDocument, initialValues: RangeInputInitialValues, activeRange: vscode.Range, symbolsPromise: Thenable<vscode.DocumentSymbol[]>) => Promise<GetItemsResult>;
export {};
//# sourceMappingURL=range.d.ts.map