/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type CodyCommand } from '@sourcegraph/cody-shared';
import type { Span } from '@opentelemetry/api';
import type { CodyCommandArgs } from '../types';
import type { CommandResult } from '../../main';
/**
 * NOTE: Used by Command Controller only.
 * NOTE: Execute Custom Commands only
 *
 * Handles executing a Cody Custom Command.
 * It sorts the given command into:
 * - an inline edit command (mode !== 'ask), or;
 * - a chat command (mode === 'ask')
 *
 * Handles prompt building and context fetching for commands.
 */
export declare class CommandRunner implements vscode.Disposable {
    private span;
    private readonly command;
    private readonly args;
    private disposables;
    constructor(span: Span, command: CodyCommand, args: CodyCommandArgs);
    /**
     * Starts executing the Cody Custom Command.
     */
    start(): Promise<CommandResult | undefined>;
    /**
     * Handles a Cody chat command.
     * Executes the chat request with the prompt and context files
     */
    private handleChatRequest;
    /**
     * handleFixupRequest method handles executing fixup based on editor selection.
     * Creates range and instruction, calls fixup command.
     */
    private handleEditRequest;
    /**
     * Combine userContextFiles and context fetched for the command
     */
    private getContextFiles;
    dispose(): void;
}
//# sourceMappingURL=runner.d.ts.map