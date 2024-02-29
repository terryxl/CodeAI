/// <reference path="../../../../../src/fileUri.d.ts" />
import type { TextDocument } from 'vscode';
import { type InlineCompletionItemWithAnalytics } from '../text-processing/process-inline-completions';
import type { FetchAndProcessCompletionsParams, FetchCompletionResult } from './fetch-and-process-completions';
interface HotStreakExtractorParams extends FetchAndProcessCompletionsParams {
    completedCompletion: InlineCompletionItemWithAnalytics;
}
export declare const STOP_REASON_HOT_STREAK = "cody-hot-streak";
export interface HotStreakExtractor {
    extract(rawCompletion: string, isRequestEnd: boolean): Generator<FetchCompletionResult>;
}
export declare function pressEnterAndGetIndentString(insertText: string, currentLine: string, document: TextDocument): string;
export declare function createHotStreakExtractor(params: HotStreakExtractorParams): HotStreakExtractor;
export {};
//# sourceMappingURL=hot-streak.d.ts.map