/// <reference path="../../../../../src/fileUri.d.ts" />
import type { CodyCommand, ContextFile } from '@sourcegraph/cody-shared';
import * as vscode from 'vscode';
import { CustomCommandsManager } from './custom-commands';
export declare const vscodeDefaultCommands: Map<string, CodyCommand>;
/**
 * Provides management and interaction capabilities for both default and custom Cody commands.
 *
 * It is responsible for initializing, grouping, and refreshing command sets,
 * as well as handling command menus and execution.
 */
export declare class CommandsProvider implements vscode.Disposable {
    private disposables;
    protected readonly defaultCommands: Map<string, CodyCommand>;
    protected customCommandsStore: CustomCommandsManager;
    private allCommands;
    constructor();
    private menu;
    /**
     * Find a command by its id
     */
    get(id: string): CodyCommand | undefined;
    protected getCustomCommands(): Promise<Map<string, CodyCommand>>;
    /**
     * Group the default commands with the custom commands and add a separator
     */
    protected groupCommands(customCommands?: Map<string, CodyCommand>): void;
    /**
     * Refresh the custom commands from store before combining with default commands
     */
    protected refresh(): Promise<void>;
    /**
     * Gets the context file content from executing a shell command.
     * Used for retreiving context for the command field in custom command
     */
    runShell(shell: string): Promise<ContextFile[]>;
    dispose(): void;
}
//# sourceMappingURL=provider.d.ts.map