"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTestEditCommand = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../../editor/active-editor");
const execute_1 = require("../../edit/execute");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
const _1 = require(".");
const unit_test_file_1 = require("../context/unit-test-file");
const test_commands_1 = require("../utils/test-commands");
const tracing_1 = require("@sourcegraph/cody-shared/src/tracing");
/**
 * Command that generates a new test file for the selected code with unit tests added.
 * When calls, the command will be executed as an inline-edit command.
 *
 * Context: Test files, current selection, and current file
 */
async function executeTestEditCommand(args) {
    return (0, tracing_1.wrapInActiveSpan)('command.test', async (span) => {
        span.setAttribute('sampled', true);
        // The prompt for generating tests in a new test file
        const newTestFilePrompt = _1.defaultCommands.test.prompt;
        // The prompt for adding new test suite to an existing test file
        const newTestSuitePrompt = 'Review the shared code context to identify the testing framework and libraries in use. Then, create a new test suite with multiple new unit tests for my selected code following the same patterns, testing conventions, and testing library as shown in the shared context. Pay attention to the shared context to ensure that your response code does not contain cases that have already been covered. Focus on generating new unit tests for uncovered cases. Respond only with the fully completed code for the new tests without any added comments, fragments, or TODO. The new tests should validate the expected functionality and cover edge cases for the selected code. The goal is to provide me with a new test suite that I can add to the end of the existing test file. Enclose only the new test suite without any import statements or modules in your response. Do not repeat tests from the shared context.';
        const editor = (0, active_editor_1.getEditor)()?.active;
        const document = editor?.document;
        if (!document) {
            return;
        }
        // Selection will be added by the edit command
        // Only add context from available test files
        const contextFiles = [];
        try {
            const files = await (0, unit_test_file_1.getContextFilesForUnitTestCommand)(document.uri);
            contextFiles.push(...files);
        }
        catch (error) {
            (0, cody_shared_1.logError)('executeNewTestCommand', 'failed to fetch context', { verbose: error });
        }
        // Loop through current context to see if the file has an exisiting test file
        let destinationFile;
        for (const testFile of contextFiles) {
            if (!destinationFile?.path && (0, test_commands_1.isTestFileForOriginal)(document.uri, testFile.uri)) {
                span.addEvent('hasExistingTestFile');
                destinationFile = testFile.uri;
            }
        }
        return {
            type: 'edit',
            task: await (0, execute_1.executeEdit)({
                configuration: {
                    instruction: destinationFile?.path ? newTestSuitePrompt : newTestFilePrompt,
                    document,
                    intent: 'test',
                    mode: 'insert',
                    // use 3 context files as sharing too many context could result in quality issue
                    userContextFiles: contextFiles.slice(0, 2),
                    destinationFile,
                },
                source: types_1.DefaultEditCommands.Test,
            }),
        };
    });
}
exports.executeTestEditCommand = executeTestEditCommand;
