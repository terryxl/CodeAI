"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customPromptsContextOptions = exports.CustomCommandConfigMenuItems = exports.CommandMenuTitleItem = exports.EDIT_COMMAND = exports.ASK_QUESTION_COMMAND = exports.CommandMenuOption = exports.CommandMenuSeperator = exports.CommandMenuButtons = void 0;
const types_1 = require("../types");
const types_2 = require("@sourcegraph/cody-shared/src/commands/types");
const buttons_1 = require("./buttons");
const os_1 = require("os");
var buttons_2 = require("./buttons");
Object.defineProperty(exports, "CommandMenuButtons", { enumerable: true, get: function () { return buttons_2.CommandMenuButtons; } });
var seperators_1 = require("./seperators");
Object.defineProperty(exports, "CommandMenuSeperator", { enumerable: true, get: function () { return seperators_1.CommandMenuSeperator; } });
var options_1 = require("./options");
Object.defineProperty(exports, "CommandMenuOption", { enumerable: true, get: function () { return options_1.CommandMenuOption; } });
Object.defineProperty(exports, "ASK_QUESTION_COMMAND", { enumerable: true, get: function () { return options_1.ASK_QUESTION_COMMAND; } });
Object.defineProperty(exports, "EDIT_COMMAND", { enumerable: true, get: function () { return options_1.EDIT_COMMAND; } });
exports.CommandMenuTitleItem = {
    default: {
        title: `Cody Commands (Shortcut: ${(0, os_1.platform)() === 'darwin' ? '⌥' : 'Alt+'}C)`,
        placeHolder: 'Search for a command or enter your question here...',
        buttons: [buttons_1.CommandMenuButtons.gear],
    },
    custom: {
        title: 'Cody: Custom Commands (Beta)',
        placeHolder: 'Search command to run...',
        buttons: [buttons_1.CommandMenuButtons.back, buttons_1.CommandMenuButtons.gear],
    },
    config: {
        title: 'Cody: Configure Custom Commands (Beta)',
        placeHolder: 'Choose an option',
        buttons: [buttons_1.CommandMenuButtons.back],
    },
};
exports.CustomCommandConfigMenuItems = [
    {
        kind: 0,
        label: 'New Custom Command...',
        id: types_1.CommandMenuAction.Add,
        command: 'cody.menu.custom.build',
    },
    { kind: -1, id: 'separator', label: '' },
    {
        kind: 0,
        label: 'Open User Settings (JSON)',
        detail: 'Stored on your machine and usable across all your workspaces/repositories',
        id: types_1.CommandMenuAction.Open,
        type: types_2.CustomCommandType.User,
        description: types_1.CustomCommandConfigFile.User,
        buttons: [buttons_1.CommandMenuButtons.open, buttons_1.CommandMenuButtons.trash],
        command: 'cody.commands.open.json',
    },
    {
        kind: 0,
        label: 'Open Workspace Settings (JSON)',
        detail: 'Project-specific and shared with anyone using this workspace/repository',
        id: types_1.CommandMenuAction.Open,
        type: types_2.CustomCommandType.Workspace,
        description: types_1.CustomCommandConfigFile.Workspace,
        buttons: [buttons_1.CommandMenuButtons.open, buttons_1.CommandMenuButtons.trash],
        command: 'cody.commands.open.json',
    },
    { kind: -1, id: 'separator', label: '' },
    {
        kind: 0,
        label: 'Open Custom Commands Documentation',
        id: 'docs',
        type: types_2.CustomCommandType.User,
        command: 'cody.commands.open.doc',
    },
];
// List of context types to include with the prompt
exports.customPromptsContextOptions = [
    {
        id: 'selection',
        label: 'Selected Code',
        detail: 'Code currently highlighted in the active editor.',
        picked: true,
    },
    {
        id: 'currentDir',
        label: 'Current Directory',
        detail: 'First 10 text files in the current directory. If the prompt includes the words "test" or "tests", only test files will be included.',
        picked: false,
    },
    {
        id: 'openTabs',
        label: 'Current Open Tabs',
        detail: 'First 10 text files in current open tabs',
        picked: false,
    },
    {
        id: 'command',
        label: 'Command Output',
        detail: 'The output returned from a terminal command (e.g. git describe --long, node your-script.js, cat src/file-name.js)',
        picked: false,
    },
    {
        id: 'none',
        label: 'None',
        detail: 'Exclude all types of context.',
        picked: false,
    },
];
