/// <reference path="../../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import { type CodyCommand, type ContextFile, type ContextMessage } from '@sourcegraph/cody-shared';
import type { VSCodeEditor } from '../../editor/vscode-editor';
import type { EditIntent } from '../types';
import type { ContextItem } from '../../prompt-builder/types';
interface GetContextFromIntentOptions {
    intent: EditIntent;
    selectedText: string;
    precedingText: string;
    followingText: string;
    uri: vscode.Uri;
    selectionRange: vscode.Range;
    editor: VSCodeEditor;
}
interface GetContextOptions extends GetContextFromIntentOptions {
    userContextFiles: ContextFile[];
    contextMessages?: ContextMessage[];
    editor: VSCodeEditor;
    command?: CodyCommand;
}
export declare const getContext: ({ userContextFiles, editor, contextMessages, ...options }: GetContextOptions) => Promise<ContextItem[]>;
export {};
//# sourceMappingURL=context.d.ts.map