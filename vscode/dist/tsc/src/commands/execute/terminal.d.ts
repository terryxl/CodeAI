import type { ChatCommandResult } from '../../main';
export interface TerminalOutputArguments {
    name: string;
    selection?: string;
    creationOptions?: {
        shellPath?: string;
        shellArgs?: string[];
    };
}
/**
 * Executes a chat command to explain the given terminal output.
 * Can be invoked from the VS Code terminal.
 *
 * NOTE: The terminal output arguments is returned by the user's
 * selection through context menu (right click).
 */
export declare function executeExplainOutput(args: TerminalOutputArguments): Promise<ChatCommandResult | undefined>;
//# sourceMappingURL=terminal.d.ts.map