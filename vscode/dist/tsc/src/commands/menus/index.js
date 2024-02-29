"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showNewCustomCommandMenu = exports.showCommandMenu = void 0;
const vscode_1 = require("vscode");
const items_1 = require("./items");
const command_builder_1 = require("./command-builder");
const items_2 = require("./items");
const custom_commands_1 = require("../services/custom-commands");
const ask_1 = require("../execute/ask");
const execute_1 = require("../../edit/execute");
const __1 = require("..");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
async function showCommandMenu(type, customCommands) {
    const items = [];
    const configOption = items_1.CommandMenuOption.config;
    const addOption = items_1.CommandMenuOption.add;
    telemetry_1.telemetryService.log(`CodyVSCodeExtension:menu:command:${type}:clicked`);
    telemetry_v2_1.telemetryRecorder.recordEvent(`cody.menu:command:${type}`, 'clicked');
    // Add items to menus accordingly:
    // 1. default: contains default commands and custom commands
    // 2. custom (custom commands): contain custom commands and add custom command option
    // 3. config (settings): setting options for custom commands
    if (type === 'config') {
        items.push(...items_1.CustomCommandConfigMenuItems);
    }
    else {
        // Add Default Commands
        if (type !== 'custom') {
            items.push(items_2.CommandMenuSeperator.commands);
            for (const _command of __1.CodyCommandMenuItems) {
                // Skip the 'Custom Commands' option
                if (_command.key === 'custom') {
                    continue;
                }
                const key = _command.key;
                const label = `$(${_command.icon}) ${_command.description}`;
                const command = _command.command.command;
                // Show keybind as description if present
                const description = _command.keybinding ? _command.keybinding : '';
                const type = 'default';
                items.push({ label, command, description, type, key });
            }
        }
        // Add Custom Commands
        if (customCommands?.length) {
            items.push(items_2.CommandMenuSeperator.custom);
            for (const customCommand of customCommands) {
                const label = `$(tools) ${customCommand.key}`;
                const description = customCommand.description ?? customCommand.prompt;
                const command = customCommand.key;
                const key = customCommand.key;
                const type = customCommand.type ?? types_1.CustomCommandType.User;
                items.push({ label, description, command, type, key });
            }
        }
        // Extra options - Settings
        items.push(items_2.CommandMenuSeperator.settings);
        if (type === 'custom') {
            items.push(addOption); // Create New Custom Command option
        }
        items.push(configOption); // Configure Custom Command option
    }
    const options = items_2.CommandMenuTitleItem[type];
    return new Promise(resolve => {
        const quickPick = vscode_1.window.createQuickPick();
        quickPick.items = items;
        quickPick.title = options.title;
        quickPick.placeholder = options.placeHolder;
        quickPick.matchOnDescription = true;
        quickPick.buttons = items_2.CommandMenuTitleItem[type].buttons;
        quickPick.onDidTriggerButton(async (item) => {
            // On gear icon click
            if (item.tooltip?.startsWith('Configure')) {
                await showCommandMenu('config', customCommands);
                return;
            }
            // On back button click
            await showCommandMenu('default', customCommands);
            quickPick.hide();
        });
        // Open or delete custom command files
        quickPick.onDidTriggerItemButton(item => {
            const selected = item.item;
            const button = item.button;
            if (selected.type && button?.command) {
                void vscode_1.commands.executeCommand(button.command, selected.type);
            }
            quickPick.hide();
        });
        quickPick.onDidChangeValue(value => {
            if (type === 'default') {
                const commandKey = value.split(' ')[0];
                const isCommand = items.find(item => item.label === commandKey);
                if (commandKey && isCommand) {
                    isCommand.alwaysShow = true;
                    quickPick.items = [isCommand];
                    return;
                }
                if (value) {
                    quickPick.items = [
                        items_1.CommandMenuOption.chat,
                        items_1.CommandMenuOption.edit,
                        ...items.filter(i => i.key !== 'ask' && i.key !== 'edit'),
                    ];
                }
                else {
                    quickPick.items = items;
                }
            }
        });
        quickPick.onDidAccept(async () => {
            const selection = quickPick.activeItems[0];
            const value = normalize(quickPick.value);
            const source = 'menu';
            // On item button click
            if (selection.buttons && selection.type && selection.command) {
                void vscode_1.commands.executeCommand(selection.command, selection.type);
            }
            // Option to create a new custom command // config menu
            const commandOptions = [addOption.command, configOption.command];
            if (selection?.command && commandOptions.includes(selection.command)) {
                void vscode_1.commands.executeCommand(selection.command);
                quickPick.hide();
                return;
            }
            // On selecting a default command
            if (selection.type === 'default' && selection.command) {
                // Check if it's an ask command
                if (selection.key === 'ask') {
                    // show input box if no value
                    if (!value) {
                        void vscode_1.commands.executeCommand('cody.chat.panel.new');
                    }
                    else {
                        void (0, ask_1.executeChat)({
                            text: value.trim(),
                            submitType: 'user-newchat',
                            source,
                        });
                    }
                    quickPick.hide();
                    return;
                }
                // Check if it's an edit command
                if (selection.key === 'edit') {
                    void (0, execute_1.executeEdit)({ configuration: { instruction: value }, source });
                    quickPick.hide();
                    return;
                }
                void vscode_1.commands.executeCommand(selection.command, selection.type);
                quickPick.hide();
                return;
            }
            // On selecting a custom command
            if (selection.key === selection.command) {
                void vscode_1.commands.executeCommand('cody.action.command', selection.key + ' ' + value);
                quickPick.hide();
                return;
            }
            // Check if selection has a field called id
            const selectionHasIdField = Object.prototype.hasOwnProperty.call(selection, 'id');
            if (selectionHasIdField && selection.id === 'docs') {
                return (0, custom_commands_1.openCustomCommandDocsLink)();
            }
            resolve();
            quickPick.hide();
            return;
        });
        quickPick.show();
    });
}
exports.showCommandMenu = showCommandMenu;
function normalize(input) {
    return input.trim().toLowerCase();
}
/**
 * Show Menu for creating a new prompt via UI using the input box and quick pick without having to manually edit the cody.json file
 */
async function showNewCustomCommandMenu(commands) {
    telemetry_1.telemetryService.log('CodyVSCodeExtension:menu:custom:build:clicked');
    telemetry_v2_1.telemetryRecorder.recordEvent('cody.menu.custom.build', 'clicked');
    const builder = new command_builder_1.CustomCommandsBuilderMenu();
    return builder.start(commands);
}
exports.showNewCustomCommandMenu = showNewCustomCommandMenu;
