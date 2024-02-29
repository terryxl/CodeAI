"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandsProvider = exports.vscodeDefaultCommands = void 0;
const vscode = __importStar(require("vscode"));
const custom_commands_1 = require("./custom-commands");
const menus_1 = require("../menus");
const shell_1 = require("../context/shell");
const get_commands_1 = require("../utils/get-commands");
const __1 = require("..");
exports.vscodeDefaultCommands = (0, get_commands_1.getDefaultCommandsMap)(__1.CodyCommandMenuItems);
/**
 * Provides management and interaction capabilities for both default and custom Cody commands.
 *
 * It is responsible for initializing, grouping, and refreshing command sets,
 * as well as handling command menus and execution.
 */
class CommandsProvider {
    disposables = [];
    defaultCommands = exports.vscodeDefaultCommands;
    customCommandsStore = new custom_commands_1.CustomCommandsManager();
    // The commands grouped with default commands and custom commands
    allCommands = new Map();
    constructor() {
        this.disposables.push(this.customCommandsStore);
        // adds the default commands to the all commands map
        this.groupCommands(this.defaultCommands);
        // Cody Command Menus
        this.disposables.push(vscode.commands.registerCommand('cody.menu.commands', () => this?.menu('default')), vscode.commands.registerCommand('cody.menu.custom-commands', () => this?.menu('custom')), vscode.commands.registerCommand('cody.menu.commands-settings', () => this?.menu('config')), vscode.commands.registerCommand('cody.commands.open.doc', () => (0, custom_commands_1.openCustomCommandDocsLink)()));
        this.customCommandsStore.init();
        this.refresh();
    }
    async menu(type) {
        const customCommands = await this.getCustomCommands();
        const commandArray = [...customCommands].map(command => command[1]);
        if (type === 'custom' && !commandArray.length) {
            return (0, menus_1.showCommandMenu)('config', commandArray);
        }
        await (0, menus_1.showCommandMenu)(type, commandArray);
    }
    /**
     * Find a command by its id
     */
    get(id) {
        return this.allCommands.get(id);
    }
    async getCustomCommands() {
        const { commands } = await this.customCommandsStore.refresh();
        this.groupCommands(commands);
        return commands;
    }
    /**
     * Group the default commands with the custom commands and add a separator
     */
    groupCommands(customCommands = new Map()) {
        const defaultCommands = [...this.defaultCommands];
        const combinedMap = new Map([...defaultCommands]);
        // Add the custom commands to the all commands map
        this.allCommands = new Map([...customCommands, ...combinedMap].sort());
    }
    /**
     * Refresh the custom commands from store before combining with default commands
     */
    async refresh() {
        const { commands } = await this.customCommandsStore.refresh();
        this.groupCommands(commands);
    }
    /**
     * Gets the context file content from executing a shell command.
     * Used for retreiving context for the command field in custom command
     */
    async runShell(shell) {
        return (0, shell_1.getContextFileFromShell)(shell);
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
exports.CommandsProvider = CommandsProvider;
