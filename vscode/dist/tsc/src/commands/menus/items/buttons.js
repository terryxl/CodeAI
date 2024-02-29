"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandMenuButtons = void 0;
const vscode_1 = require("vscode");
const types_1 = require("../types");
const openIconButton = {
    iconPath: new vscode_1.ThemeIcon('go-to-file'),
    tooltip: 'Open or Create Settings File',
    id: types_1.CommandMenuAction.Open,
    command: 'cody.commands.open.json',
};
const trashIconButton = {
    iconPath: new vscode_1.ThemeIcon('trash'),
    tooltip: 'Delete Settings File',
    id: types_1.CommandMenuAction.Delete,
    command: 'cody.commands.delete.json',
};
const gearIconButton = {
    iconPath: new vscode_1.ThemeIcon('gear'),
    tooltip: 'Configure Custom Commands...',
    id: types_1.CommandMenuAction.Config,
};
const backIconButton = vscode_1.QuickInputButtons.Back;
exports.CommandMenuButtons = {
    open: openIconButton,
    trash: trashIconButton,
    back: backIconButton,
    gear: gearIconButton,
};
