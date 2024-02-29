/// <reference path="../../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { GetItemsResult } from '../quick-pick';
import type { EditRangeItem } from './types';
import type { EditInputInitialValues } from '../get-input';
export declare const getDefaultDocumentItems: (document: vscode.TextDocument, initialValues: EditInputInitialValues) => EditRangeItem[];
export declare const getDocumentInputItems: (document: vscode.TextDocument, initialValues: EditInputInitialValues, activeRange: vscode.Range, symbolsPromise: Thenable<vscode.DocumentSymbol[]>) => Promise<GetItemsResult>;
//# sourceMappingURL=document.d.ts.map