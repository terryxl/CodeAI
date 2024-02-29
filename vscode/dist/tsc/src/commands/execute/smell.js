"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSmellCommand = exports.smellCommand = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const selection_1 = require("../context/selection");
const ask_1 = require("./ask");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
const _1 = require(".");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * Generates the prompt and context files with arguments for the 'smell' command.
 *
 * Context: Current selection
 */
async function smellCommand(span, args) {
    const addEnhancedContext = false;
    let prompt = _1.defaultCommands.smell.prompt;
    if (args?.additionalInstruction) {
        span.addEvent('additionalInstruction');
        prompt = `${prompt} ${args.additionalInstruction}`;
    }
    const contextFiles = [];
    const currentSelection = await (0, selection_1.getContextFileFromCursor)();
    contextFiles.push(...currentSelection);
    return {
        text: prompt,
        submitType: 'user-newchat',
        contextFiles,
        addEnhancedContext,
        source: types_1.DefaultChatCommands.Smell,
    };
}
exports.smellCommand = smellCommand;
/**
 * Executes the smell command as a chat command via 'cody.action.chat'
 */
async function executeSmellCommand(args) {
    return (0, tracing_1.wrapInActiveSpan)('command.smell', async (span) => {
        span.setAttribute('sampled', true);
        (0, cody_shared_1.logDebug)('executeSmellCommand', 'executing', { args });
        telemetry_1.telemetryService.log('CodyVSCodeExtension:command:smell:executed', {
            useCodebaseContex: false,
            requestID: args?.requestID,
            source: args?.source,
            traceId: span.spanContext().traceId,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.command.smell', 'executed', {
            metadata: {
                useCodebaseContex: 0,
            },
            interactionID: args?.requestID,
            privateMetadata: {
                requestID: args?.requestID,
                source: args?.source,
                traceId: span.spanContext().traceId,
            },
        });
        return {
            type: 'chat',
            session: await (0, ask_1.executeChat)(await smellCommand(span, args)),
        };
    });
}
exports.executeSmellCommand = executeSmellCommand;
