/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { AuthProvider } from '../services/AuthProvider';
export declare function getGhostHintEnablement(): Promise<boolean>;
/**
 * Creates a new decoration for showing a "ghost" hint to the user.
 *
 * Note: This needs to be created at extension run time as the order in which `createTextEditorDecorationType`
 * is called affects the ranking of the decoration - assuming multiple decorations.
 *
 * We should also ensure that `activationEvent` `onLanguage` is set to provide the best chance of
 * executing this code early, without impacting VS Code startup time.
 */
export declare const ghostHintDecoration: vscode.TextEditorDecorationType;
export declare class GhostHintDecorator implements vscode.Disposable {
    private disposables;
    private isActive;
    private activeDecoration;
    private setThrottledGhostText;
    private fireThrottledDisplayEvent;
    private enrollmentListener;
    constructor(authProvider: AuthProvider);
    private init;
    private setGhostText;
    clearGhostText(editor: vscode.TextEditor): void;
    private _fireDisplayEvent;
    private updateEnablement;
    /**
     * Register a listener for when the user has enrolled in the ghost hint feature.
     * This code is _only_ to be used to support the ongoing A/B test for ghost hint usage.
     */
    private registerEnrollmentListener;
    dispose(): void;
}
//# sourceMappingURL=GhostHintDecorator.d.ts.map