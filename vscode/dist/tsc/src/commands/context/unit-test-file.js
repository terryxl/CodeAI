"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContextFilesForUnitTestCommand = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const test_commands_1 = require("../utils/test-commands");
const workspace_1 = require("./workspace");
const search_pattern_1 = require("../utils/search-pattern");
/**
 * Gets context files related to the given test file.
 *
 * Searches for test files in the current directory first.
 * If none found, searches the entire workspace for test files.
 *
 * Returns only valid test files up to the max limit.
 *
 * NOTE: Does not work with Agent as the underlying API is not available in Agent.
 * NOTE: Used by the new unit test commands to get context files.
 */
async function getContextFilesForUnitTestCommand(file) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.test', async (span) => {
        const contextFiles = [];
        // exclude any files in the path with e2e, integration, node_modules, or dist
        const excludePattern = '**/*{e2e,integration,node_modules,dist}*/**';
        // To search for files in the current directory only
        const searchInCurrentDirectoryOnly = true;
        // The max number of files to search for in each workspace search
        const max = 10;
        // Search for test files in the current directory first
        const curerntDirPattern = (0, search_pattern_1.getSearchPatternForTestFiles)(file, searchInCurrentDirectoryOnly);
        const currentDirContext = await (0, workspace_1.getWorkspaceFilesContext)(curerntDirPattern, excludePattern, max);
        contextFiles.push(...currentDirContext);
        // If no test files found in the current directory, search the entire workspace
        if (!contextFiles.length) {
            const wsTestPattern = (0, search_pattern_1.getSearchPatternForTestFiles)(file, !searchInCurrentDirectoryOnly);
            // Will try to look for half the max number of files in the workspace for faster results
            const codebaseFiles = await (0, workspace_1.getWorkspaceFilesContext)(wsTestPattern, excludePattern, max / 2);
            contextFiles.push(...codebaseFiles);
        }
        // Return valid test files only
        return contextFiles.filter(f => (0, test_commands_1.isValidTestFile)(f.uri));
    });
}
exports.getContextFilesForUnitTestCommand = getContextFilesForUnitTestCommand;
