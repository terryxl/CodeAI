export type DefaultCodyCommands = DefaultChatCommands | DefaultEditCommands;
export declare enum DefaultChatCommands {
    Explain = "explain",// Explain code
    Unit = "unit",// Generate unit tests in Chat
    Smell = "smell",// Generate code smell report in Chat
    Terminal = "terminal"
}
export declare enum DefaultEditCommands {
    Test = "test",// Generate unit tests with inline edit
    Doc = "doc"
}
export interface CodyCommand {
    /**
     * @deprecated Use 'commandKey' instead.
     */
    slashCommand?: string;
    /**
     * key of the command, e.g. 'smell' for Code Smell
     */
    key: string;
    prompt: string;
    description?: string;
    context?: CodyCommandContext;
    type?: CodyCommandType;
    mode?: CodyCommandMode;
    requestID?: string;
}
/**
 * - 'ask' mode is the default mode, run prompt in chat view
 * - 'edit' mode will run prompt with edit command which replace selection with cody's response
 * - 'insert' mode is the same as edit, it adds to the top of the selection instead of replacing selection
 * - 'file' mode create a new file with cody's response as content
 */
type CodyCommandMode = 'ask' | 'edit' | 'insert' | 'file';
export interface CodyCommandContext {
    none?: boolean;
    openTabs?: boolean;
    currentDir?: boolean;
    currentFile?: boolean;
    selection?: boolean;
    command?: string;
    filePath?: string;
    directoryPath?: string;
    codebase?: boolean;
}
export type CodyCommandType = CustomCommandType | DefaultCommandType | 'recently used';
export declare enum CustomCommandType {
    Workspace = "workspace",
    User = "user"
}
export type DefaultCommandType = 'default' | 'experimental';
export {};
//# sourceMappingURL=types.d.ts.map