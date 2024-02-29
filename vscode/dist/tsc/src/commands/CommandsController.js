"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCodyCommand = exports.setCommandController = void 0;
const log_1 = require("../log");
const runner_1 = require("./services/runner");
const execute_1 = require("./execute");
const common_1 = require("./utils/common");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * Handles commands execution with commands from CommandsProvider
 * Provides additional prompt management and execution logic
 */
class CommandsController {
    disposables = [];
    // Provider of default commands and custom commands
    provider;
    init(provider) {
        if (provider) {
            this.provider = provider;
            this.disposables.push(this.provider);
        }
    }
    /**
     * Executes a Cody command from user input text and command args.
     *
     * Handles prompt building and context fetching for commands.
     */
    async execute(input, args) {
        return (0, tracing_1.wrapInActiveSpan)('command.custom', async (span) => {
            // Split the input by space to extract the command key and additional input (if any)
            const commandSplit = input?.trim().split(' ');
            // The unique key for the command. e.g. test, smell, explain
            // Using fromSlashCommand to support backward compatibility with old slash commands
            const commandKey = (0, common_1.fromSlashCommand)(commandSplit[0] || input);
            // Additional instruction that will be added to end of prompt in the custom command prompt
            // It's added at execution time to allow dynamic arguments
            // E.g. if the command is `edit replace dash with period`,
            // the additionalInput is `replace dash with period`
            const additionalInstruction = commandKey === input ? '' : commandSplit.slice(1).join(' ');
            // Process default commands
            if ((0, execute_1.isDefaultChatCommand)(commandKey) || (0, execute_1.isDefaultEditCommand)(commandKey)) {
                return (0, execute_1.executeDefaultCommand)(commandKey, additionalInstruction);
            }
            const command = this.provider?.get(commandKey);
            if (!command) {
                (0, log_1.logDebug)('CommandsController:execute', 'command not found', {
                    verbose: { commandKey },
                });
                return undefined;
            }
            span.setAttribute('sampled', true);
            command.prompt = [command.prompt, additionalInstruction].join(' ')?.trim();
            // Add shell output as context if any before passing to the runner
            const shell = command.context?.command;
            if (shell) {
                const contextFile = await this.provider?.runShell(shell);
                args.userContextFiles = contextFile;
            }
            return new runner_1.CommandRunner(span, command, args).start();
        });
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        (0, log_1.logDebug)('CommandsController:dispose', 'disposed');
    }
}
/**
 * A aingleton instance of the CommandsController class.
 * Activate on extension activation that will initialize the CommandsProvider.
 */
const controller = new CommandsController();
const setCommandController = (provider) => controller.init(provider);
exports.setCommandController = setCommandController;
/**
 * Binds the execute method of the CommandsController instance to be exported as a constant function.
 * This allows the execute method to be called without needing a reference to the controller instance.
 */
exports.executeCodyCommand = controller.execute.bind(controller);
