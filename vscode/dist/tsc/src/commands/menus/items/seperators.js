"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandMenuSeperator = void 0;
// Seperators
const commandsSeparator = { kind: -1, label: 'commands' };
const customSeparator = { kind: -1, label: 'custom commands (beta)' };
const settingsSeparator = { kind: -1, label: 'settings' };
const lastUsedSeparator = { kind: -1, label: 'last used' };
exports.CommandMenuSeperator = {
    commands: commandsSeparator,
    custom: customSeparator,
    settings: settingsSeparator,
    lastUsed: lastUsedSeparator,
};
