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
exports.getContextFileFromShell = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const os_1 = __importDefault(require("os"));
const vscode = __importStar(require("vscode"));
const log_1 = require("../../log");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const posix_1 = __importDefault(require("node:path/posix"));
const _exec = (0, node_util_1.promisify)(node_child_process_1.exec);
/**
 * Creates a context file from executing a shell command. Used by CommandsController.
 *
 * Executes the given shell command, captures the output, wraps it in a context format,
 * and returns it as a ContextFile.
 */
async function getContextFileFromShell(command) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.command', async (span) => {
        const rootDir = os_1.default.homedir() || process.env.HOME || process.env.USERPROFILE || '';
        if (!vscode.env.shell) {
            void vscode.window.showErrorMessage('Shell command is not supported your current workspace.');
            return [];
        }
        // Expand the ~/ in command with the home directory if any of the substring starts with ~/ with a space before it
        const filteredCommand = command.replaceAll(/(\s~\/)/g, ` ${rootDir}${posix_1.default.sep}`);
        const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.path;
        try {
            const { stdout, stderr } = await _exec(filteredCommand, {
                cwd: wsRoot,
                encoding: 'utf8',
            });
            // stringify the output of the command first
            const output = stdout ?? stderr;
            const outputString = JSON.stringify(output.trim());
            if (!outputString) {
                throw new Error('Empty output');
            }
            const context = outputWrapper.replace('{command}', command).replace('{output}', outputString);
            const file = {
                type: 'file',
                content: (0, cody_shared_1.truncateText)(context, cody_shared_1.MAX_CURRENT_FILE_TOKENS),
                title: 'Terminal Output',
                uri: vscode.Uri.file('terminal-output'),
                source: 'terminal',
            };
            return [file];
        }
        catch (error) {
            // Handles errors and empty output
            console.error('getContextFileFromShell > failed', error);
            (0, log_1.logError)('getContextFileFromShell', 'failed', { verbose: error });
            void vscode.window.showErrorMessage('Command Failed: Make sure the command works locally.');
            return [];
        }
    });
}
exports.getContextFileFromShell = getContextFileFromShell;
const outputWrapper = `
Terminal output from the \`{command}\` command enclosed between <OUTPUT0412> tags:
<OUTPUT0412>
{output}
</OUTPUT0412>`;
