import { type CommandMenuItem, type ContextOption } from "../types";
import { type CommandMenuButton } from "./buttons";
export { CommandMenuButton, CommandMenuButtons } from "./buttons";
export { CommandMenuSeperator } from "./seperators";
export { CommandMenuOption, ASK_QUESTION_COMMAND, EDIT_COMMAND, } from "./options";
export declare const CommandMenuTitleItem: {
    default: {
        title: string;
        placeHolder: string;
        buttons: CommandMenuButton[];
    };
    custom: {
        title: string;
        placeHolder: string;
        buttons: CommandMenuButton[];
    };
    config: {
        title: string;
        placeHolder: string;
        buttons: CommandMenuButton[];
    };
};
export declare const CustomCommandConfigMenuItems: CommandMenuItem[];
export declare const customPromptsContextOptions: ContextOption[];
//# sourceMappingURL=index.d.ts.map