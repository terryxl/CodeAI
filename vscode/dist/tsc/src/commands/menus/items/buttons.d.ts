/// <reference path="../../../../../../src/fileUri.d.ts" />
import { type QuickInputButton, ThemeIcon } from 'vscode';
import { CommandMenuAction } from '../types';
export declare const CommandMenuButtons: {
    open: {
        iconPath: ThemeIcon;
        tooltip: string;
        id: CommandMenuAction;
        command: string;
    };
    trash: CommandMenuButton;
    back: QuickInputButton;
    gear: CommandMenuButton;
};
export interface CommandMenuButton extends QuickInputButton {
    command?: string;
    id?: CommandMenuAction;
}
//# sourceMappingURL=buttons.d.ts.map