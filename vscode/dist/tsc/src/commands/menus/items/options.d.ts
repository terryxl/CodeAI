import type { CommandMenuItem } from '../types';
export declare const ASK_QUESTION_COMMAND: {
    key: string;
    description: string;
    prompt: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    mode: string;
    type: string;
} | {
    key: string;
    description: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    mode: string;
    type: string;
    prompt?: undefined;
} | {
    key: string;
    description: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    type: string;
    prompt?: undefined;
    mode?: undefined;
};
export declare const EDIT_COMMAND: {
    key: string;
    description: string;
    prompt: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    mode: string;
    type: string;
} | {
    key: string;
    description: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    mode: string;
    type: string;
    prompt?: undefined;
} | {
    key: string;
    description: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    type: string;
    prompt?: undefined;
    mode?: undefined;
};
export declare const CommandMenuOption: {
    chat: CommandMenuItem;
    edit: CommandMenuItem;
    config: CommandMenuItem;
    add: CommandMenuItem;
};
//# sourceMappingURL=options.d.ts.map