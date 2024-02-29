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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCommandFiles = exports.openCustomCommandDocsLink = exports.CustomCommandsManager = void 0;
const lodash_1 = require("lodash");
const vscode = __importStar(require("vscode"));
const os_1 = __importDefault(require("os"));
const log_1 = require("../../log");
const types_1 = require("../types");
const config_file_1 = require("../utils/config-file");
const menus_1 = require("../menus");
const vscode_uri_1 = require("vscode-uri");
const get_commands_1 = require("../utils/get-commands");
const types_2 = require("@sourcegraph/cody-shared/src/commands/types");
const configuration_1 = require("../../configuration");
const platform_1 = require("@sourcegraph/cody-shared/src/common/platform");
const isTesting = process.env.CODY_TESTING === 'true';
const isMacOS = (0, platform_1.isMac)();
const userHomePath = os_1.default.homedir() || process.env.HOME || process.env.USERPROFILE || '';
/**
 * Handles loading, building, and maintaining Custom Commands retrieved from cody.json files
 */
class CustomCommandsManager {
    // Watchers for the cody.json files
    fileWatcherDisposables = [];
    disposables = [];
    customCommandsMap = new Map();
    userJSON = null;
    // Configuration files
    configFileName;
    userConfigFile;
    get workspaceConfigFile() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspaceRoot) {
            return undefined;
        }
        return vscode_uri_1.Utils.joinPath(workspaceRoot, this.configFileName);
    }
    constructor() {
        // TODO (bee) Migrate to use .cody/commands.json for VS Code
        // Right now agent is using .cody/commands.json for Custom Commands,
        // .vscode/cody.json in VS Code.
        const workspaceConfig = vscode.workspace.getConfiguration();
        const config = (0, configuration_1.getConfiguration)(workspaceConfig);
        this.configFileName = config.isRunningInsideAgent ? types_1.ConfigFiles.COMMAND : types_1.ConfigFiles.VSCODE;
        this.userConfigFile = vscode_uri_1.Utils.joinPath(vscode_uri_1.URI.file(userHomePath), this.configFileName);
        this.disposables.push(vscode.commands.registerCommand('cody.menu.custom.build', () => this.newCustomCommandQuickPick()), vscode.commands.registerCommand('cody.commands.open.json', type => this.configFileActions(type, 'open')), vscode.commands.registerCommand('cody.commands.delete.json', type => this.configFileActions(type, 'delete')));
    }
    getCommands() {
        return [...this.customCommandsMap].sort((a, b) => a[0].localeCompare(b[0]));
    }
    /**
     // TODO (bee) Migrate to use .cody/commands.json
     * Create file watchers for cody.json files.
     * Automatically update the command map when the cody.json files are changed
     */
    init() {
        const userConfigWatcher = (0, config_file_1.createFileWatchers)(this.userConfigFile);
        if (userConfigWatcher) {
            this.fileWatcherDisposables.push(userConfigWatcher, userConfigWatcher.onDidChange(() => this.refresh?.()), userConfigWatcher.onDidDelete(() => this.refresh?.()));
        }
        // Create file watchers in trusted workspaces only
        if (vscode.workspace.isTrusted) {
            const wsConfigWatcher = (0, config_file_1.createFileWatchers)(this.workspaceConfigFile);
            if (wsConfigWatcher) {
                this.fileWatcherDisposables.push(wsConfigWatcher, wsConfigWatcher.onDidChange(() => this.refresh?.()), wsConfigWatcher.onDidDelete(() => this.refresh?.()));
            }
        }
        (0, log_1.logDebug)('CommandsController:fileWatcherInit', 'watchers created');
    }
    /**
     * Get the uri of the cody.json file for the given type
     */
    getConfigFileByType(type) {
        const configFileUri = type === types_2.CustomCommandType.User ? this.userConfigFile : this.workspaceConfigFile;
        return configFileUri;
    }
    async refresh() {
        try {
            // Reset the map before rebuilding
            this.customCommandsMap = new Map();
            // user commands
            if (this.userConfigFile?.path) {
                await this.build(types_2.CustomCommandType.User);
            }
            // only build workspace prompts if the workspace is trusted
            if (vscode.workspace.isTrusted) {
                await this.build(types_2.CustomCommandType.Workspace);
            }
        }
        catch (error) {
            (0, log_1.logError)('CustomCommandsProvider:refresh', 'failed', { verbose: error });
        }
        return { commands: this.customCommandsMap };
    }
    async build(type) {
        const uri = this.getConfigFileByType(type);
        // Security: Make sure workspace is trusted before building commands from workspace
        if (!uri || (type === types_2.CustomCommandType.Workspace && !vscode.workspace.isTrusted)) {
            return null;
        }
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const content = new TextDecoder('utf-8').decode(bytes);
            if (!content.trim()) {
                throw new Error('Empty file');
            }
            const customCommandsMap = (0, get_commands_1.buildCodyCommandMap)(type, content);
            this.customCommandsMap = new Map([...this.customCommandsMap, ...customCommandsMap]);
            // Keep a copy of the user json file for recreating the commands later
            if (type === types_2.CustomCommandType.User) {
                this.userJSON = JSON.parse(content);
            }
        }
        catch (error) {
            (0, log_1.logDebug)('CustomCommandsProvider:build', 'failed', { verbose: error });
        }
        return this.customCommandsMap;
    }
    /**
     * Quick pick for creating a new custom command
     */
    async newCustomCommandQuickPick() {
        const commands = [...this.customCommandsMap.values()].map(c => c.key);
        const newCommand = await (0, menus_1.showNewCustomCommandMenu)(commands);
        if (!newCommand) {
            return;
        }
        // Save the prompt to the current Map and Extension storage
        await this.save(newCommand.key, newCommand.prompt, newCommand.type);
        await this.refresh();
        // Notify user
        const isUserCommand = newCommand.type === types_2.CustomCommandType.User;
        const buttonTitle = `Open ${isUserCommand ? 'User' : 'Workspace'} Settings (JSON)`;
        void vscode.window
            .showInformationMessage(`New ${newCommand.key} command saved to ${newCommand.type} settings`, buttonTitle)
            .then(async (choice) => {
            if (choice === buttonTitle) {
                await this.configFileActions(newCommand.type, 'open');
            }
        });
        (0, log_1.logDebug)('CustomCommandsProvider:newCustomCommandQuickPick:', 'saved', {
            verbose: newCommand,
        });
    }
    /**
     * Add the newly create command via quick pick to the cody.json file
     */
    async save(id, command, type = types_2.CustomCommandType.User) {
        this.customCommandsMap.set(id, command);
        const updated = (0, lodash_1.omit)(command, ['key', 'type']);
        // Filter map to remove commands with non-match type
        const filtered = new Map();
        for (const [key, _command] of this.customCommandsMap) {
            if (_command.type === type) {
                filtered.set(key, (0, lodash_1.omit)(_command, ['key', 'type']));
            }
        }
        // Add the new command to the filtered map
        filtered.set(id, updated);
        // turn map into json
        const jsonContext = { ...this.userJSON };
        jsonContext.commands = Object.fromEntries(filtered);
        const uri = this.getConfigFileByType(type);
        if (!uri) {
            throw new Error('Invalid file path');
        }
        try {
            await (0, config_file_1.saveJSONFile)(jsonContext, uri);
        }
        catch (error) {
            (0, log_1.logError)('CustomCommandsProvider:save', 'failed', { verbose: error });
        }
    }
    async configFileActions(type, action) {
        const uri = this.getConfigFileByType(type);
        if (!uri) {
            return;
        }
        switch (action) {
            case 'open':
                void vscode.commands.executeCommand('vscode.open', uri);
                break;
            case 'delete': {
                let fileType = 'user settings file (~/.vscode/cody.json)';
                if (type === types_2.CustomCommandType.Workspace) {
                    fileType = 'workspace settings file (.vscode/cody.json)';
                }
                const bin = isMacOS ? 'Trash' : 'Recycle Bin';
                const confirmationKey = `Move to ${bin}`;
                // Playwright cannot capture and interact with pop-up modal in VS Code,
                // so we need to turn off modal mode for the display message during tests.
                const modal = !isTesting;
                vscode.window
                    .showInformationMessage(`Are you sure you want to delete your Cody ${fileType}?`, { detail: `You can restore this file from the ${bin}.`, modal }, confirmationKey)
                    .then(async (choice) => {
                    if (choice === confirmationKey) {
                        void vscode.workspace.fs.delete(uri);
                    }
                });
                break;
            }
            case 'create':
                await (0, config_file_1.createJSONFile)(uri)
                    .then(() => {
                    vscode.window
                        .showInformationMessage(`Cody ${type} settings file created`, 'View Documentation')
                        .then(async (choice) => {
                        if (choice === 'View Documentation') {
                            await openCustomCommandDocsLink();
                        }
                    });
                })
                    .catch(error => {
                    const errorMessage = 'Failed to create cody.json file: ';
                    void vscode.window.showErrorMessage(`${errorMessage} ${error}`);
                    (0, log_1.logDebug)('CustomCommandsProvider:configActions:create', 'failed', {
                        verbose: error,
                    });
                });
                break;
        }
    }
    /**
     * Reset
     */
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposeWatchers();
        this.customCommandsMap = new Map();
        this.userJSON = null;
    }
    disposeWatchers() {
        for (const disposable of this.fileWatcherDisposables) {
            disposable.dispose();
        }
        this.fileWatcherDisposables = [];
        (0, log_1.logDebug)('CommandsController:disposeWatchers', 'watchers disposed');
    }
}
exports.CustomCommandsManager = CustomCommandsManager;
async function openCustomCommandDocsLink() {
    const uri = 'https://sourcegraph.com/docs/cody/custom-commands';
    await vscode.env.openExternal(vscode.Uri.parse(uri));
}
exports.openCustomCommandDocsLink = openCustomCommandDocsLink;
// TODO (bee) Migrate cody.json to new config file location
// Rename the old config files to the new location
async function migrateCommandFiles() {
    // WORKSPACE
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (workspaceRoot) {
        const oldWsPath = vscode_uri_1.Utils.joinPath(workspaceRoot, types_1.ConfigFiles.VSCODE);
        const newWSPath = vscode_uri_1.Utils.joinPath(workspaceRoot, types_1.ConfigFiles.COMMAND);
        await migrateContent(oldWsPath, newWSPath).then(() => { }, error => undefined);
    }
    // USER
    if (userHomePath) {
        const oldUserPath = vscode_uri_1.Utils.joinPath(vscode_uri_1.URI.file(userHomePath), types_1.ConfigFiles.VSCODE);
        const newUserPath = vscode_uri_1.Utils.joinPath(vscode_uri_1.URI.file(userHomePath), types_1.ConfigFiles.COMMAND);
        await migrateContent(oldUserPath, newUserPath).then(() => { }, error => undefined);
    }
}
exports.migrateCommandFiles = migrateCommandFiles;
async function migrateContent(oldFile, newFile) {
    const oldUserContent = await tryReadFile(newFile);
    if (!oldUserContent) {
        return;
    }
    const oldContent = await tryReadFile(oldFile);
    const workspaceEditor = new vscode.WorkspaceEdit();
    workspaceEditor.createFile(newFile, { ignoreIfExists: true });
    workspaceEditor.insert(newFile, new vscode.Position(0, 0), JSON.stringify(oldContent, null, 2));
    await vscode.workspace.applyEdit(workspaceEditor);
    const doc = await vscode.workspace.openTextDocument(newFile);
    await doc.save();
    workspaceEditor.deleteFile(oldFile, { ignoreIfNotExists: true });
}
async function tryReadFile(fileUri) {
    return vscode.workspace.fs.readFile(fileUri).then(content => new TextDecoder('utf-8').decode(content), error => undefined);
}
