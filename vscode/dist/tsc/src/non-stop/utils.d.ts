/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
export declare enum CodyTaskState {
    idle = 1,
    working = 2,
    inserting = 3,
    applying = 4,
    formatting = 5,
    applied = 6,
    finished = 7,
    error = 8,
    pending = 9
}
export declare function isTerminalCodyTaskState(state: CodyTaskState): boolean;
/**
 * Calculates the minimum distance from the given position to the start or end of the provided range.
 */
export declare function getMinimumDistanceToRangeBoundary(position: vscode.Position, range: vscode.Range): number;
//# sourceMappingURL=utils.d.ts.map