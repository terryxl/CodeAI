/// <reference path="../../../../../src/fileUri.d.ts" />
import type { TextDocument } from 'vscode';
import type { DocumentContext } from '../get-current-doc-context';
import type { InlineCompletionItemWithAnalytics } from './process-inline-completions';
interface ParseAndTruncateParams {
    document: TextDocument;
    docContext: DocumentContext;
    isDynamicMultilineCompletion: boolean;
}
export declare function parseAndTruncateCompletion(completion: string, params: ParseAndTruncateParams): InlineCompletionItemWithAnalytics;
export {};
//# sourceMappingURL=parse-and-truncate-completion.d.ts.map