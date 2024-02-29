"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContextFilesForTestCommand = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const test_commands_1 = require("../utils/test-commands");
const workspace_1 = require("./workspace");
const directory_1 = require("./directory");
const search_pattern_1 = require("../utils/search-pattern");
/**
 * Gets context files related to the given test file.
 *
 * Searches for test files in the current directory first.
 * If none found, searches the entire workspace for test files.
 *
 * Returns only valid test files up to the max limit.
 *
 * NOTE: This is used by the current unit test commands to get context files.
 * NOTE: Will be replaced by the new unit test commands once it's ready.
 */
async function getContextFilesForTestCommand(file) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.testChat', async (span) => {
        const contextFiles = [];
        // exclude any files in the path with e2e, integration, node_modules, or dist
        const excludePattern = '**/*{e2e,integration,node_modules,dist}*/**';
        // To search for files in the current directory only
        const searchInCurrentDirectoryOnly = true;
        // The max number of files to search for in each workspace search
        const max = 5;
        // Get context from test files in current directory
        contextFiles.push(...(await (0, directory_1.getContextFileFromDirectory)()));
        if (!contextFiles.length) {
            const wsTestPattern = (0, search_pattern_1.getSearchPatternForTestFiles)(file, !searchInCurrentDirectoryOnly);
            const codebaseFiles = await (0, workspace_1.getWorkspaceFilesContext)(wsTestPattern, excludePattern, max);
            contextFiles.push(...codebaseFiles);
        }
        // Return valid test files only
        return contextFiles.filter(f => (0, test_commands_1.isValidTestFile)(f.uri));
    });
}
exports.getContextFilesForTestCommand = getContextFilesForTestCommand;
