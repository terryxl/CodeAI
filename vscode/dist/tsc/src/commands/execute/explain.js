"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeExplainCommand = exports.explainCommand = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const selection_1 = require("../context/selection");
const current_file_1 = require("../context/current-file");
const ask_1 = require("./ask");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
const _1 = require(".");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * Generates the prompt and context files with arguments for the 'explain' command.
 *
 * Context: Current selection and current file
 */
async function explainCommand(span, args) {
    const addEnhancedContext = false;
    let prompt = _1.defaultCommands.explain.prompt;
    if (args?.additionalInstruction) {
        span.addEvent('additionalInstruction');
        prompt = `${prompt} ${args.additionalInstruction}`;
    }
    // fetches the context file from the current cursor position using getContextFileFromCursor().
    const contextFiles = [];
    const currentSelection = await (0, selection_1.getContextFileFromCursor)();
    contextFiles.push(...currentSelection);
    const currentFile = await (0, current_file_1.getContextFileFromCurrentFile)();
    contextFiles.push(...currentFile);
    return {
        text: prompt,
        submitType: 'user-newchat',
        contextFiles,
        addEnhancedContext,
        source: types_1.DefaultChatCommands.Explain,
    };
}
exports.explainCommand = explainCommand;
/**
 * Executes the explain command as a chat command via 'cody.action.chat'
 */
async function executeExplainCommand(args) {
    return (0, tracing_1.wrapInActiveSpan)('command.explain', async (span) => {
        span.setAttribute('sampled', true);
        (0, cody_shared_1.logDebug)('executeExplainCommand', 'executing', { args });
        telemetry_1.telemetryService.log('CodyVSCodeExtension:command:explain:executed', {
            useCodebaseContex: false,
            requestID: args?.requestID,
            source: args?.source,
            traceId: span.spanContext().traceId,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.command.explain', 'executed', {
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
            session: await (0, ask_1.executeChat)(await explainCommand(span, args)),
        };
    });
}
exports.executeExplainCommand = executeExplainCommand;
