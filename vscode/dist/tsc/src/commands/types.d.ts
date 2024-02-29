import type { ChatEventSource, CodyCommand, ContextFile } from '@sourcegraph/cody-shared';
/**
 * The name of the file for configuring Custom Commands.
 */
export declare enum ConfigFiles {
    VSCODE = ".vscode/cody.json",
    COMMAND = ".cody/commands.json"
}
/**
 * Creates a CodyCommandArgs object with default values.
 * Generates a random requestID if one is not provided.
 * Merges any provided args with the defaults.
 */
export interface CodyCommandsFile {
    commands: Map<string, CodyCommand>;
}
export interface CodyCommandsFileJSON {
    commands: {
        [id: string]: Omit<CodyCommand, 'key'>;
    };
}
export interface CodyCommandArgs {
    requestID: string;
    source?: ChatEventSource;
    runInChatMode?: boolean;
    userContextFiles?: ContextFile[];
    additionalInstruction?: string;
}
//# sourceMappingURL=types.d.ts.map