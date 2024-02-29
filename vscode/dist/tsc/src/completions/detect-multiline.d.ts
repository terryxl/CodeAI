/// <reference path="../../../../src/fileUri.d.ts" />
import { Position } from 'vscode';
import type { DocumentDependentContext, LinesContext } from './get-current-doc-context';
interface DetectMultilineParams {
    docContext: LinesContext & DocumentDependentContext;
    languageId: string;
    dynamicMultilineCompletions: boolean;
    position: Position;
}
interface DetectMultilineResult {
    multilineTrigger: string | null;
    multilineTriggerPosition: Position | null;
}
export declare function endsWithBlockStart(text: string, languageId: string): string | null;
export declare function detectMultiline(params: DetectMultilineParams): DetectMultilineResult;
export {};
//# sourceMappingURL=detect-multiline.d.ts.map