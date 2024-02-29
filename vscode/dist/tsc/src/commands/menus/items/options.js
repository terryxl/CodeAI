"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandMenuOption = exports.EDIT_COMMAND = exports.ASK_QUESTION_COMMAND = void 0;
const __1 = require("../..");
exports.ASK_QUESTION_COMMAND = __1.CodyCommandMenuItems[0];
exports.EDIT_COMMAND = __1.CodyCommandMenuItems[1];
// Common Menu Options
const chatOption = {
    label: `$(${exports.ASK_QUESTION_COMMAND.icon}) ${exports.ASK_QUESTION_COMMAND.description}`,
    description: exports.ASK_QUESTION_COMMAND.prompt,
    key: exports.ASK_QUESTION_COMMAND.key,
    alwaysShow: true,
    type: 'default',
    command: exports.ASK_QUESTION_COMMAND.command.command,
};
const fixOption = {
    label: `$(${exports.EDIT_COMMAND.icon}) ${exports.EDIT_COMMAND.description}`,
    description: exports.EDIT_COMMAND.prompt,
    key: exports.EDIT_COMMAND.key,
    alwaysShow: true,
    type: 'default',
    command: exports.ASK_QUESTION_COMMAND.command.command,
};
const configOption = {
    label: '$(gear) Configure Custom Commands...',
    description: 'Manage your custom reusable commands',
    key: '',
    command: 'cody.menu.commands-settings',
};
const addOption = {
    label: '$(diff-added) New Custom Command...',
    alwaysShow: true,
    description: 'Create a new reusable command',
    key: '',
    command: 'cody.menu.custom.build',
};
exports.CommandMenuOption = {
    chat: chatOption,
    edit: fixOption,
    config: configOption,
    add: addOption,
};
