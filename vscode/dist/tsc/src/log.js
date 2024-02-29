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
exports.logger = exports.logError = exports.logDebug = exports.outputChannel = void 0;
const vscode = __importStar(require("vscode"));
const configuration_1 = require("./configuration");
exports.outputChannel = vscode.window.createOutputChannel('Cody by Sourcegraph', 'json');
/**
 * Logs a debug message to the "Cody by Sourcegraph" output channel.
 *
 * Usage:
 *
 *   logDebug('label', 'this is a message')
 *   logDebug('label', 'this is a message', 'some', 'args')
 *   logDebug('label', 'this is a message', 'some', 'args', { verbose: 'verbose info goes here' })
 */
function logDebug(filterLabel, text, ...args) {
    log('error', filterLabel, text, ...args);
}
exports.logDebug = logDebug;
/**
 * Logs an error message to the "Cody by Sourcegraph" output channel.
 *
 * Usage:
 *
 *   logError('label', 'this is an error')
 *   logError('label', 'this is an error', 'some', 'args')
 *   logError('label', 'this is an error', 'some', 'args', { verbose: 'verbose info goes here' })
 */
function logError(filterLabel, text, ...args) {
    log('error', filterLabel, text, ...args);
}
exports.logError = logError;
/**
 *
 * There are three config settings that alter the behavior of this function.
 *
 * A window refresh may be needed if these settings are changed for the behavior change to take
 * effect.
 *
 * - cody.debug.enabled: toggles debug logging on or off
 * - cody.debug.filter: sets a regex filter that opts-in messages with labels matching the regex
 * - cody.debug.verbose: prints out the text in the `verbose` field of the last argument
 *
 */
function log(level, filterLabel, text, ...args) {
    const workspaceConfig = vscode.workspace.getConfiguration();
    const config = (0, configuration_1.getConfiguration)(workspaceConfig);
    const debugEnable = process.env.CODY_DEBUG_ENABLE === 'true' || config.debugEnable;
    if (!exports.outputChannel || (level === 'debug' && !debugEnable)) {
        return;
    }
    if (level === 'debug' && config.debugFilter && !config.debugFilter.test(filterLabel)) {
        return;
    }
    const PREFIX = '█ ';
    if (args.length === 0) {
        exports.outputChannel.appendLine(`${PREFIX}${filterLabel}: ${text}`);
        return;
    }
    const lastArg = args.at(-1);
    if (lastArg && typeof lastArg === 'object' && 'verbose' in lastArg) {
        if (config.debugVerbose) {
            exports.outputChannel.appendLine(`${PREFIX}${filterLabel}: ${text} ${args.slice(0, -1).join(' ')} ${JSON.stringify(lastArg.verbose, null, 2)}`);
        }
        else {
            exports.outputChannel.appendLine(`${PREFIX}${filterLabel}: ${text} ${args.slice(0, -1).join(' ')}`);
        }
        return;
    }
    exports.outputChannel.appendLine(`${PREFIX}${filterLabel}: ${text} ${args.join(' ')}`);
}
exports.logger = {
    startCompletion(params, endpoint) {
        const workspaceConfig = vscode.workspace.getConfiguration();
        const config = (0, configuration_1.getConfiguration)(workspaceConfig);
        if (!config.debugEnable) {
            return undefined;
        }
        const start = Date.now();
        const type = 'prompt' in params
            ? 'code-completion'
            : 'messages' in params
                ? 'completion'
                : 'code-completion';
        let hasFinished = false;
        let lastCompletion = '';
        function onError(err, rawError) {
            if (hasFinished) {
                return;
            }
            hasFinished = true;
            if (process.env.NODE_ENV === 'development') {
                console.error(rawError);
            }
            logError('CompletionLogger:onError', JSON.stringify({
                type,
                endpoint,
                status: 'error',
                duration: Date.now() - start,
                err,
            }), { verbose: { params } });
        }
        function onComplete(result) {
            if (hasFinished) {
                return;
            }
            hasFinished = true;
            logDebug('CompletionLogger:onComplete', JSON.stringify({
                type,
                endpoint,
                status: 'success',
                duration: Date.now() - start,
            }), { verbose: { result, params } });
        }
        function onEvents(events) {
            for (const event of events) {
                switch (event.type) {
                    case 'completion':
                        lastCompletion = event.completion;
                        break;
                    case 'error':
                        onError(event.error);
                        break;
                    case 'done':
                        onComplete(lastCompletion);
                        break;
                }
            }
        }
        return {
            onError,
            onComplete,
            onEvents,
        };
    },
};
