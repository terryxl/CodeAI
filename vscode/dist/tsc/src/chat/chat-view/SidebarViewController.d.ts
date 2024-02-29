/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type Configuration } from '@sourcegraph/cody-shared';
import type { MessageProviderOptions } from '../MessageProvider';
import type { ExtensionMessage } from '../protocol';
export interface SidebarChatWebview extends Omit<vscode.Webview, 'postMessage'> {
    postMessage(message: ExtensionMessage): Thenable<boolean>;
}
export interface SidebarViewOptions extends MessageProviderOptions {
    extensionUri: vscode.Uri;
    config: Pick<Configuration, 'isRunningInsideAgent'>;
}
export declare class SidebarViewController implements vscode.WebviewViewProvider {
    private extensionUri;
    webview?: SidebarChatWebview;
    private disposables;
    private authProvider;
    private readonly contextProvider;
    constructor({ extensionUri, ...options }: SidebarViewOptions);
    private onDidReceiveMessage;
    simplifiedOnboardingReloadEmbeddingsState(): Promise<void>;
    /**
     * Display error message in webview as a banner alongside the chat.
     */
    private handleError;
    /**
     * Set webview view
     */
    private setWebviewView;
    /**
     * create webview resources for Auth page
     */
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext<unknown>, _token: vscode.CancellationToken): Promise<void>;
}
//# sourceMappingURL=SidebarViewController.d.ts.map