"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomCommandsBuilderMenu = void 0;
const vscode_1 = require("vscode");
const items_1 = require("./items");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
const common_1 = require("../utils/common");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
class CustomCommandsBuilderMenu {
    async start(commands) {
        const key = await this.makeCommandKey(commands);
        if (!key) {
            return null;
        }
        const prompt = await this.makePrompt();
        if (!prompt) {
            return null;
        }
        const type = await this.makeType();
        if (!type) {
            return null;
        }
        telemetry_1.telemetryService.log('CodyVSCodeExtension:command:custom:build:executed');
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.command.custom.build', 'executed');
        return { key, prompt: { ...prompt, key }, type };
    }
    async makeCommandKey(commands) {
        const commandSet = new Set(commands);
        const value = await vscode_1.window.showInputBox({
            title: 'New Custom Cody Command: Command Name',
            prompt: 'Enter the name of the custom command.',
            placeHolder: 'e.g. hello',
            ignoreFocusOut: true,
            validateInput: (input) => {
                if (!input) {
                    return 'Command name cannot be empty.';
                }
                if (input.split(' ').length > 1) {
                    return 'Command name cannot contain spaces. Use dashes, underscores, or camelCase.';
                }
                // Remove leading slash before checking if command already exists
                if (commandSet.has((0, common_1.fromSlashCommand)(input))) {
                    return 'A command with the same name already exists.';
                }
                return;
            },
        });
        return value;
    }
    async makePrompt() {
        const prompt = await vscode_1.window.showInputBox({
            title: 'New Custom Cody Command: Prompt',
            prompt: 'Enter the instructions for Cody to follow and answer.',
            placeHolder: 'e.g. Create five different test cases for the selected code',
            ignoreFocusOut: true,
            validateInput: (input) => {
                if (!input) {
                    return 'Command prompt cannot be empty.';
                }
                return null;
            },
        });
        if (!prompt) {
            return null;
        }
        return this.addContext({ prompt });
    }
    async addContext(newPrompt) {
        if (!newPrompt) {
            return null;
        }
        newPrompt.context = { ...{ codebase: false } };
        const promptContext = await vscode_1.window.showQuickPick(items_1.customPromptsContextOptions, {
            title: 'New Custom Cody Command: Context Options',
            placeHolder: 'For accurate responses, choose only the necessary options.',
            canPickMany: true,
            ignoreFocusOut: true,
            onDidSelectItem: (item) => {
                item.picked = !item.picked;
            },
        });
        if (!promptContext?.length) {
            return newPrompt;
        }
        for (const context of promptContext) {
            switch (context.id) {
                case 'selection':
                case 'currentDir':
                case 'openTabs':
                case 'none':
                    newPrompt.context[context.id] = context.picked;
                    break;
                case 'command': {
                    newPrompt.context.command = (await showPromptCreationInputBox()) || '';
                    break;
                }
            }
        }
        return newPrompt;
    }
    async makeType() {
        const option = await vscode_1.window.showQuickPick([
            {
                label: 'User Settings',
                detail: 'Stored on your machine and usable across all your workspaces/repositories',
                type: types_1.CustomCommandType.User,
                description: '~/.vscode/cody.json',
                picked: true,
            },
            {
                label: 'Workspace Settings',
                detail: 'Project-specific and shared with anyone using this workspace/repository',
                type: types_1.CustomCommandType.Workspace,
                description: '.vscode/cody.json',
            },
        ], {
            title: 'New Custom Cody Command: Save To…',
            ignoreFocusOut: true,
            placeHolder: 'Choose where to save the command',
        });
        return option?.type === types_1.CustomCommandType.Workspace
            ? types_1.CustomCommandType.Workspace
            : types_1.CustomCommandType.User;
    }
}
exports.CustomCommandsBuilderMenu = CustomCommandsBuilderMenu;
async function showPromptCreationInputBox() {
    const promptCommand = await vscode_1.window.showInputBox({
        title: 'New Custom Cody Command: Command',
        prompt: 'Enter the terminal command to run from the workspace root. Its output will be included to Cody as prompt context.',
        placeHolder: 'e.g. node myscript.js | head -n 50',
    });
    return promptCommand;
}
