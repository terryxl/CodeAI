/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export interface TextChange {
    range: vscode.Range;
    text: string;
}
export interface UpdateRangeOptions {
    /**
     * Whether to expand a range when a change is affixed to the original range.
     * This changes the behaviour to support cases where we want to include appending or prepending to an original range.
     * For example, allowing Cody to insert a docstring immediately before a function.
     */
    supportRangeAffix?: boolean;
}
/**
 * Given a range and *multiple* edits, update the range for the edit. This
 * works by adjusting the range of each successive edit so that the edits
 * "stack."
 *
 * vscode's edit operations don't allow overlapping ranges. So we can just
 * adjust apply the edits in reverse order and end up with the right
 * adjustment for a compound edit.
 *
 * Note, destructively mutates the `changes` array.
 */
export declare function updateRangeMultipleChanges(range: vscode.Range, changes: TextChange[], options?: UpdateRangeOptions, rangeUpdater?: typeof updateRange): vscode.Range;
export declare function updateRange(range: vscode.Range, change: TextChange, options?: UpdateRangeOptions): vscode.Range;
/**
 * Given a range and an edit, shifts the range for the edit.
 * Only handles edits that are outside of the range, as it is purely focused on shifting a fixed range in a document.
 * Does not expand or shrink the original rank.
 */
export declare function updateFixedRange(range: vscode.Range, change: TextChange): vscode.Range;
//# sourceMappingURL=tracked-range.d.ts.map