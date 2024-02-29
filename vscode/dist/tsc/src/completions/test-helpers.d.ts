/// <reference path="../../../../src/fileUri.d.ts" />
import type { Position as VSCodePosition, TextDocument as VSCodeTextDocument } from 'vscode';
import { type CompletionResponse } from '@sourcegraph/cody-shared';
export * from '../tree-sitter/test-helpers';
/**
 * A tag function for creating a {@link CompletionResponse}, for use in tests only.
 *
 * - `├` start of the inline completion to insert
 * - `┤` end of the inline completion to insert
 * - `┴` use for indent placeholder, should be placed at last line after `┤`
 */
export declare function completion(string: TemplateStringsArray, ...values: unknown[]): CompletionResponse;
export declare function document(text: string, languageId?: string, uriString?: string): VSCodeTextDocument;
export declare function documentAndPosition(textWithCursor: string, languageId?: string, uriString?: string): {
    document: VSCodeTextDocument;
    position: VSCodePosition;
};
export declare function nextTick(): Promise<void>;
//# sourceMappingURL=test-helpers.d.ts.map