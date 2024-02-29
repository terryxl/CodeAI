/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
/**
 * Interface for tracking the last active text editor that is not a webview panel for
 * the new Chat Panel UI.
 *
 * active: The current valid active/supported text editor instance.
 * ignored: Whether the active editor is ignored by Cody or not.
 */
interface LastActiveTextEditor {
    active?: vscode.TextEditor;
    ignored?: boolean;
}
export declare function resetActiveEditor(): void;
export declare function getEditor(): LastActiveTextEditor;
export {};
//# sourceMappingURL=active-editor.d.ts.map