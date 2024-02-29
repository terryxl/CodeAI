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
exports.executeExplainOutput = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const ask_1 = require("./ask");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const uuid = __importStar(require("uuid"));
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * Executes a chat command to explain the given terminal output.
 * Can be invoked from the VS Code terminal.
 *
 * NOTE: The terminal output arguments is returned by the user's
 * selection through context menu (right click).
 */
async function executeExplainOutput(args) {
    return (0, tracing_1.wrapInActiveSpan)('command.terminal', async (span) => {
        span.setAttribute('sampled', true);
        (0, cody_shared_1.logDebug)('executeExplainOutput', 'executing', { args });
        const requestID = uuid.v4();
        const addEnhancedContext = false;
        const source = cody_shared_1.DefaultChatCommands.Terminal;
        telemetry_1.telemetryService.log('CodyVSCodeExtension:command:terminal:executed', {
            useCodebaseContex: false,
            requestID,
            source,
            traceId: span.spanContext().traceId,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.command.terminal', 'executed', {
            metadata: {
                useCodebaseContex: 0,
            },
            interactionID: requestID,
            privateMetadata: {
                requestID,
                source,
                traceId: span.spanContext().traceId,
            },
        });
        const output = args.selection?.trim();
        if (!output) {
            return undefined;
        }
        let prompt = template.replace('{{PROCESS}}', args.name).replace('{{OUTPUT}}', output);
        const options = JSON.stringify(args.creationOptions ?? {});
        if (options) {
            span.addEvent('hasCreationOptions');
            prompt += `\nProcess options: ${options}`;
        }
        return {
            type: 'chat',
            session: await (0, ask_1.executeChat)({
                text: prompt,
                submitType: 'user-newchat',
                contextFiles: [],
                addEnhancedContext,
                source,
            }),
        };
    });
}
exports.executeExplainOutput = executeExplainOutput;
const template = `
Review and analyze this terminal output from the \`{{PROCESS}}\` process and summarize the key information. If this indicates an error, provide step-by-step instructions on how I can resolve this:
\n\`\`\`
\n{{OUTPUT}}
\n\`\`\`
`;
