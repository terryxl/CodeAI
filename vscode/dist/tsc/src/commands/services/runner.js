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
exports.CommandRunner = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const execute_1 = require("../../edit/execute");
const log_1 = require("../../log");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const context_1 = require("../context");
const ask_1 = require("../execute/ask");
const active_editor_1 = require("../../editor/active-editor");
const agentContextSorting_1 = require("../../chat/chat-view/agentContextSorting");
/**
 * NOTE: Used by Command Controller only.
 * NOTE: Execute Custom Commands only
 *
 * Handles executing a Cody Custom Command.
 * It sorts the given command into:
 * - an inline edit command (mode !== 'ask), or;
 * - a chat command (mode === 'ask')
 *
 * Handles prompt building and context fetching for commands.
 */
class CommandRunner {
    span;
    command;
    args;
    disposables = [];
    constructor(span, command, args) {
        this.span = span;
        this.command = command;
        this.args = args;
        (0, log_1.logDebug)('CommandRunner', command.key, { verbose: { command, args } });
        // If runInChatMode is true, set mode to 'ask' to run as chat command
        // This allows users to run any edit commands in chat mode
        command.mode = args.runInChatMode ? 'ask' : command.mode ?? 'ask';
        this.command = command;
    }
    /**
     * Starts executing the Cody Custom Command.
     */
    async start() {
        // NOTE: Default commands are processed in controller
        if (this.command.type === 'default') {
            console.error('Default commands are not supported in runner.');
            return undefined;
        }
        const addCodebaseContex = false;
        telemetry_1.telemetryService.log('CodyVSCodeExtension:command:custom:executed', {
            mode: this.command.mode,
            useCodebaseContex: addCodebaseContex,
            useShellCommand: !!this.command.context?.command,
            requestID: this.args.requestID,
            source: this.args.source,
            traceId: this.span.spanContext().traceId,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.command.custom', 'executed', {
            metadata: {
                useCodebaseContex: addCodebaseContex ? 1 : 0,
                useShellCommand: this.command.context?.command ? 1 : 0,
            },
            interactionID: this.args.requestID,
            privateMetadata: {
                mode: this.command.mode,
                requestID: this.args.requestID,
                source: this.args.source,
                traceId: this.span.spanContext().traceId,
            },
        });
        // Conditions checks
        const configFeatures = await cody_shared_1.ConfigFeaturesSingleton.getInstance().getConfigFeatures();
        if (!configFeatures.commands) {
            const disabledMsg = 'This feature has been disabled by your Sourcegraph site admin.';
            void vscode.window.showErrorMessage(disabledMsg);
            this.span.end();
            return;
        }
        const editor = (0, active_editor_1.getEditor)();
        if (!editor.active || editor.ignored) {
            const message = editor.ignored
                ? 'Current file is ignored by a .cody/ignore file. Please remove it from the list and try again.'
                : 'No editor is active. Please open a file and try again.';
            void vscode.window.showErrorMessage(message);
            this.span.end();
            return;
        }
        // Execute the command based on the mode
        // Run as edit command if mode is not 'ask'
        if (this.command.mode !== 'ask') {
            return this.handleEditRequest();
        }
        return this.handleChatRequest();
    }
    /**
     * Handles a Cody chat command.
     * Executes the chat request with the prompt and context files
     */
    async handleChatRequest() {
        this.span.setAttribute('mode', 'chat');
        (0, log_1.logDebug)('CommandRunner:handleChatRequest', 'chat request detecte');
        const prompt = this.command.prompt;
        // Fetch context for the command
        const contextFiles = await this.getContextFiles();
        // NOTE: (bee) codebase context is not supported for custom commands
        return {
            type: 'chat',
            session: await (0, ask_1.executeChat)({
                text: prompt,
                submitType: 'user',
                contextFiles,
                addEnhancedContext: this.command.context?.codebase ?? false,
                source: 'custom-commands',
            }),
        };
    }
    /**
     * handleFixupRequest method handles executing fixup based on editor selection.
     * Creates range and instruction, calls fixup command.
     */
    async handleEditRequest() {
        this.span.setAttribute('mode', 'edit');
        (0, log_1.logDebug)('CommandRunner:handleEditRequest', 'fixup request detected');
        // Fetch context for the command
        const userContextFiles = await this.getContextFiles();
        return {
            type: 'edit',
            task: await (0, execute_1.executeEdit)({
                configuration: {
                    instruction: this.command.prompt,
                    intent: 'edit',
                    mode: this.command.mode,
                    userContextFiles,
                },
                source: 'custom-commands',
            }),
        };
    }
    /**
     * Combine userContextFiles and context fetched for the command
     */
    async getContextFiles() {
        const contextConfig = this.command.context;
        this.span.setAttribute('contextConfig', JSON.stringify(contextConfig));
        const userContextFiles = this.args.userContextFiles ?? [];
        if (contextConfig) {
            const commandContext = await (0, context_1.getCommandContextFiles)(contextConfig);
            userContextFiles.push(...commandContext);
        }
        (0, agentContextSorting_1.sortContextFiles)(userContextFiles);
        return userContextFiles;
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
exports.CommandRunner = CommandRunner;
