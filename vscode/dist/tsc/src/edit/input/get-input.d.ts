/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ChatEventSource, ContextFile, EditModel } from '@sourcegraph/cody-shared';
import type { EditIntent } from '../types';
import type { AuthProvider } from '../../services/AuthProvider';
interface QuickPickInput {
    /** The user provided instruction */
    instruction: string;
    /** Any user provided context, from @ or @# */
    userContextFiles: ContextFile[];
    /** The LLM that the user has selected */
    model: EditModel;
    /** The range that the user has selected */
    range: vscode.Range;
    /**
     * The derived intent from the users instructions
     * This will effectively only change if the user switching from a "selection" to a "cursor"
     * position, or vice-versa.
     */
    intent: EditIntent;
}
export interface EditInputInitialValues {
    initialRange: vscode.Range;
    initialExpandedRange?: vscode.Range;
    initialModel: EditModel;
    initialIntent: EditIntent;
    initialInputValue?: string;
    initialSelectedContextFiles?: ContextFile[];
}
export declare const getInput: (document: vscode.TextDocument, authProvider: AuthProvider, initialValues: EditInputInitialValues, source: ChatEventSource) => Promise<QuickPickInput | null>;
export {};
//# sourceMappingURL=get-input.d.ts.map