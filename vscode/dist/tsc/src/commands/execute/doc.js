"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeDocCommand = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const execute_1 = require("../../edit/execute");
const active_editor_1 = require("../../editor/active-editor");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
const _1 = require(".");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * The command that generates a new docstring for the selected code.
 * When calls, the command will be executed as an inline-edit command.
 *
 * Context: add by the edit command
 */
async function executeDocCommand(args) {
    return (0, tracing_1.wrapInActiveSpan)('command.doc', async (span) => {
        span.setAttribute('sampled', true);
        (0, cody_shared_1.logDebug)('executeDocCommand', 'executing', { args });
        let prompt = _1.defaultCommands.doc.prompt;
        if (args?.additionalInstruction) {
            span.addEvent('additionalInstruction');
            prompt = `${prompt} ${args.additionalInstruction}`;
        }
        const editor = (0, active_editor_1.getEditor)()?.active;
        const document = editor?.document;
        if (!document) {
            return undefined;
        }
        return {
            type: 'edit',
            task: await (0, execute_1.executeEdit)({
                configuration: {
                    instruction: prompt,
                    intent: 'doc',
                    mode: 'insert',
                },
                source: types_1.DefaultEditCommands.Doc,
            }),
        };
    });
}
exports.executeDocCommand = executeDocCommand;
