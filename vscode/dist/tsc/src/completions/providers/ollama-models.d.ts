/// <reference path="../../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { OllamaGenerateParameters } from '@sourcegraph/cody-shared';
interface OllamaPromptContext {
    snippets: {
        uri: vscode.Uri;
        content: string;
    }[];
    context: string;
    currentFileNameComment: string;
    isInfill: boolean;
    uri: vscode.Uri;
    prefix: string;
    suffix: string;
    languageId: string;
}
export interface OllamaModel {
    getPrompt(ollamaPrompt: OllamaPromptContext): string;
    getRequestOptions(isMultiline: boolean, isDynamicMultiline: boolean): OllamaGenerateParameters;
}
declare class DefaultOllamaModel implements OllamaModel {
    getPrompt(ollamaPrompt: OllamaPromptContext): string;
    getRequestOptions(isMultiline: boolean, isDynamicMultiline: boolean): OllamaGenerateParameters;
}
export declare function getModelHelpers(model: string): DefaultOllamaModel;
export {};
//# sourceMappingURL=ollama-models.d.ts.map