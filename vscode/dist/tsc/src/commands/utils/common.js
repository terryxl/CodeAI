"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSlashCommand = exports.fromSlashCommand = void 0;
const leadingForwardSlashRegex = /^\/+/;
/**
 * Removes leading forward slashes from slash command string.
 */
function fromSlashCommand(slashCommand) {
    return slashCommand.replace(leadingForwardSlashRegex, '');
}
exports.fromSlashCommand = fromSlashCommand;
/**
 * Returns command starting with a forward slash.
 */
function toSlashCommand(command) {
    // ensure there is only one leading forward slash
    return command.replace(leadingForwardSlashRegex, '').replace(/^/, '/');
}
exports.toSlashCommand = toSlashCommand;
