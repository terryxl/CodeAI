"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTestChatCommand = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../../editor/active-editor");
const selection_1 = require("../context/selection");
const ask_1 = require("./ask");
const unit_test_chat_1 = require("../context/unit-test-chat");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * Generates the prompt and context files with arguments for the '/test' command in Chat.
 *
 * Context: Test files, current selection, and current file
 */
async function unitTestCommand(span, args) {
    let prompt = "Review the shared code context and configurations to identify the test framework and libraries in use. Then, generate a suite of multiple unit tests for the functions in <selected> using the detected test framework and libraries. Be sure to import the function being tested. Follow the same patterns as any shared context. Only add packages, imports, dependencies, and assertions if they are used in the shared code. Pay attention to the file path of each shared context to see if test for <selected> already exists. If one exists, focus on generating new unit tests for uncovered cases. If none are detected, import common unit test libraries for {languageName}. Focus on validating key functionality with simple and complete assertions. Only include mocks if one is detected in the shared code. Before writing the tests, identify which test libraries and frameworks to import, e.g. 'No new imports needed - using existing libs' or 'Importing test framework that matches shared context usage' or 'Importing the defined framework', etc. Then briefly summarize test coverage and any limitations. At the end, enclose the full completed code for the new unit tests, including all necessary imports, in a single markdown codeblock. No fragments or TODO. The new tests should validate expected functionality and cover edge cases for <selected> with all required imports, including importing the function being tested. Do not repeat existing tests.";
    if (args?.additionalInstruction) {
        prompt = `${prompt} ${args.additionalInstruction}`;
    }
    const editor = (0, active_editor_1.getEditor)()?.active;
    const document = editor?.document;
    const contextFiles = [];
    if (document) {
        try {
            const cursorContext = await (0, selection_1.getContextFileFromCursor)();
            contextFiles.push(...cursorContext);
            contextFiles.push(...(await (0, unit_test_chat_1.getContextFilesForTestCommand)(document.uri)));
        }
        catch (error) {
            (0, cody_shared_1.logError)('testCommand', 'failed to fetch context', { verbose: error });
        }
    }
    return {
        text: prompt,
        contextFiles,
        addEnhancedContext: false,
        source: 'test',
        submitType: 'user-newchat',
    };
}
/**
 * Executes the /test command for generating unit tests in Chat for selected code.
 *
 * NOTE: Currently used by agent until inline test command is added to agent.
 */
async function executeTestChatCommand(args) {
    return (0, tracing_1.wrapInActiveSpan)('command.test-chat', async (span) => {
        span.setAttribute('sampled', true);
        (0, cody_shared_1.logDebug)('executeTestEditCommand', 'executing', { args });
        telemetry_1.telemetryService.log('CodyVSCodeExtension:command:test:executed', {
            useCodebaseContex: false,
            requestID: args?.requestID,
            source: args?.source,
            traceId: span.spanContext().traceId,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.command.test', 'executed', {
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
            session: await (0, ask_1.executeChat)(await unitTestCommand(span, args)),
        };
    });
}
exports.executeTestChatCommand = executeTestChatCommand;
