"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTestCaseEditCommand = void 0;
const vscode_1 = require("vscode");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../../editor/active-editor");
const execute_1 = require("../../edit/execute");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
const unit_test_case_1 = require("../context/unit-test-case");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * Adds generated test cases to the selected test suite inline.
 *
 * NOTE: Used by Code Lenses in test files with 'cody.command.tests-cases'.
 */
async function executeTestCaseEditCommand(args) {
    return (0, tracing_1.wrapInActiveSpan)('command.test-case', async (span) => {
        span.setAttribute('sampled', true);
        const instruction = 'Review the shared code context to identify the testing framework and libraries in use. Then, create multiple new unit tests for the test suite in my selected code following the same patterns, testing conventions, and testing library as shown in the shared context. Pay attention to the shared context to ensure that your response code does not contain cases that have already been covered. Focus on generating new unit tests for uncovered cases. Respond only with the fully completed code with the new unit tests added at the end, without any comments, fragments, or TODO. The new tests should validate expected functionality and cover edge cases for the test suites. The goal is to provide me with code that I can add to the end of the existing test file. Do not repeat tests from the shared context. Enclose only the new tests without describe/suite, import statements, or packages in your response.';
        const editor = (0, active_editor_1.getEditor)()?.active;
        const document = editor?.document;
        // Current selection is required
        if (!document || !editor.selection) {
            return;
        }
        const contextFiles = [];
        try {
            const files = await (0, unit_test_case_1.getContextFilesForAddingUnitTestCases)(document.uri);
            contextFiles.push(...files);
        }
        catch (error) {
            (0, cody_shared_1.logError)('executeNewTestCommand', 'failed to fetch context', { verbose: error });
        }
        const startLine = editor.selection.start.line + 1;
        const endLine = Math.max(startLine, editor.selection.end.line - 1);
        const range = new vscode_1.Range(startLine, 0, endLine, 0);
        return {
            type: 'edit',
            task: await (0, execute_1.executeEdit)({
                configuration: {
                    instruction,
                    document,
                    range,
                    intent: 'edit',
                    mode: 'insert',
                    userContextFiles: contextFiles,
                    destinationFile: document.uri,
                },
                source: types_1.DefaultEditCommands.Test,
            }),
        };
    });
}
exports.executeTestCaseEditCommand = executeTestCaseEditCommand;
