"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContextFilesForAddingUnitTestCases = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const test_commands_1 = require("../utils/test-commands");
const workspace_1 = require("./workspace");
const search_pattern_1 = require("../utils/search-pattern");
const directory_1 = require("./directory");
async function getContextFilesForAddingUnitTestCases(testFile) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.testCase', async (span) => {
        // Get the context from the current directory
        // and then find the original file of the test file in the returned context
        // If the original file is found, return it
        // e.g. if the test file is src/foo/bar.spec.ts, look for src/foo/bar.ts
        const directoryContext = await (0, directory_1.getContextFileFromDirectory)();
        const originalFileContext = directoryContext.find(f => (0, test_commands_1.isTestFileForOriginal)(f.uri, testFile));
        if (originalFileContext) {
            return [originalFileContext];
        }
        // TODO (bee) improves context search
        const contextFiles = [];
        // exclude any files in the path with e2e, integration, node_modules, or dist
        const excludePattern = '**/*{e2e,integration,node_modules,dist}*/**';
        // To search for files in the current directory only
        const searchInCurrentDirectoryOnly = true;
        // The max number of files to search for in each workspace search
        const max = 10;
        // Search for test files in the current directory first
        const curerntDirPattern = (0, search_pattern_1.getSearchPatternForTestFiles)(testFile, searchInCurrentDirectoryOnly);
        const currentDirContext = await (0, workspace_1.getWorkspaceFilesContext)(curerntDirPattern, excludePattern, max);
        contextFiles.push(...currentDirContext);
        // If no test files found in the current directory, search the entire workspace
        if (!contextFiles.length) {
            const wsTestPattern = (0, search_pattern_1.getSearchPatternForTestFiles)(testFile, !searchInCurrentDirectoryOnly);
            // Will try to look for half the max number of files in the workspace for faster results
            const codebaseFiles = await (0, workspace_1.getWorkspaceFilesContext)(wsTestPattern, excludePattern, max / 2);
            contextFiles.push(...codebaseFiles);
        }
        // Return valid test files only
        return contextFiles.filter(f => (0, test_commands_1.isValidTestFile)(f.uri));
    });
}
exports.getContextFilesForAddingUnitTestCases = getContextFilesForAddingUnitTestCases;
