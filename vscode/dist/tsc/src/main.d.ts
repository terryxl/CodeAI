/// <reference path="../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ChatSession } from './chat/chat-view/SimpleChatPanelProvider';
import type { PlatformContext } from './extension.common';
import type { FixupTask } from './non-stop/FixupTask';
/**
 * Start the extension, watching all relevant configuration and secrets for changes.
 */
export declare function start(context: vscode.ExtensionContext, platform: PlatformContext): Promise<vscode.Disposable>;
export type CommandResult = ChatCommandResult | EditCommandResult;
export interface ChatCommandResult {
    type: 'chat';
    session?: ChatSession;
}
export interface EditCommandResult {
    type: 'edit';
    task?: FixupTask;
}
//# sourceMappingURL=main.d.ts.map