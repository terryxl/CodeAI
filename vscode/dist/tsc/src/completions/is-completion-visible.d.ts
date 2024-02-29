/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { DocumentContext } from './get-current-doc-context';
import type { InlineCompletionItemWithAnalytics } from './text-processing/process-inline-completions';
export declare function isCompletionVisible(completion: InlineCompletionItemWithAnalytics, document: vscode.TextDocument, position: vscode.Position, docContext: DocumentContext, context: vscode.InlineCompletionContext, completeSuggestWidgetSelection: boolean, abortSignal: AbortSignal | undefined): boolean;
export declare function completionMatchesSuffix(completion: Pick<InlineCompletionItemWithAnalytics, 'insertText'>, currentLineSuffix: string): boolean;
//# sourceMappingURL=is-completion-visible.d.ts.map