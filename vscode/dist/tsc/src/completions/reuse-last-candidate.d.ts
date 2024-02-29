/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { DocumentContext } from './get-current-doc-context';
import { type InlineCompletionsParams, type InlineCompletionsResult, type LastInlineCompletionCandidate } from './get-inline-completions';
import type { RequestParams } from './request-manager';
type ReuseLastCandidateArgument = Required<Pick<InlineCompletionsParams, 'document' | 'position' | 'selectedCompletionInfo' | 'lastCandidate'>> & Pick<InlineCompletionsParams, 'handleDidAcceptCompletionItem' | 'handleDidPartiallyAcceptCompletionItem'> & {
    docContext: DocumentContext;
};
/**
 * See test cases for the expected behaviors.
 */
export declare function reuseLastCandidate({ document, position, selectedCompletionInfo, lastCandidate: { lastTriggerPosition, lastTriggerDocContext, lastTriggerSelectedCompletionInfo }, lastCandidate, docContext: { currentLinePrefix, currentLineSuffix, nextNonEmptyLine }, docContext, handleDidAcceptCompletionItem, handleDidPartiallyAcceptCompletionItem, }: ReuseLastCandidateArgument): InlineCompletionsResult | null;
export declare function getRequestParamsFromLastCandidate(document: vscode.TextDocument, lastCandidate: LastInlineCompletionCandidate): RequestParams;
export {};
//# sourceMappingURL=reuse-last-candidate.d.ts.map