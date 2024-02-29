/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { FixupFileCollection, FixupTextChanged } from './roles';
/**
 * Observes text document changes and updates the regions with active fixups.
 * Notifies the fixup controller when text being edited by a fixup changes.
 * Fixups must track ranges of interest within documents that are being worked
 * on. Ranges of interest include the region of text we sent to the LLM, and the
 * and the decorations indicating where edits will appear.
 */
export declare class FixupDocumentEditObserver {
    private readonly provider_;
    constructor(provider_: FixupFileCollection & FixupTextChanged);
    textDocumentChanged(event: vscode.TextDocumentChangeEvent): void;
}
//# sourceMappingURL=FixupDocumentEditObserver.d.ts.map