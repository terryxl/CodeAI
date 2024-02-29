/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
/**
 * A custom implementation of folding ranges that works with all programming
 * languages by following indentation levels.
 *
 * See agent/src/lsp/foldingRanges.test.ts for test cases. The tests live in the
 * agent/ project so that it has access to the mocked out VS Code APIs.
 */
export declare class IndentationBasedFoldingRangeProvider implements vscode.FoldingRangeProvider {
    private indentationLevel;
    provideFoldingRanges(document: vscode.TextDocument, _context: vscode.FoldingContext, _token: vscode.CancellationToken): vscode.FoldingRange[];
}
//# sourceMappingURL=foldingRanges.d.ts.map