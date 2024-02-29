/// <reference path="../../../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { EditModel } from '@sourcegraph/cody-shared';
export interface EditRangeItem extends vscode.QuickPickItem {
    range: vscode.Range | (() => Promise<vscode.Range>);
}
export interface EditModelItem extends vscode.QuickPickItem {
    modelTitle: string;
    model: EditModel;
    codyProOnly: boolean;
}
//# sourceMappingURL=types.d.ts.map