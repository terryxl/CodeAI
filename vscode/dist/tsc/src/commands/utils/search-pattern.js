"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchPatternForTestFiles = void 0;
const vscode_1 = require("vscode");
const path_1 = require("path");
const vscode_uri_1 = require("vscode-uri");
/**
 * Returns a glob pattern to search for test files.
 * Used by the unit test commands to get context files.
 *
 * @param file The current file
 * @param currentDirectoryOnly If true, only search for files in the current directory
 * @param fileNameMatchesOnly If true, only search for files with the same name as the current file
 */
function getSearchPatternForTestFiles(
// Current file
file, 
// Files in the current directory only
currentDirectoryOnly, 
// Files with the same name as the current file
fileNameMatchesOnly) {
    const root = '**';
    const osSep = path_1.posix.sep;
    const fileExtension = vscode_uri_1.Utils.extname(file);
    const fileWithoutExt = path_1.posix.parse(file.path).name;
    const testPattern = `*{test,spec}*${fileExtension}`;
    const nameMatchPattern = `*{test_${fileWithoutExt},${fileWithoutExt}_test,test.${fileWithoutExt},${fileWithoutExt}.test,${fileWithoutExt}Test,spec_${fileWithoutExt},${fileWithoutExt}_spec,spec.${fileWithoutExt},${fileWithoutExt}.spec,${fileWithoutExt}Spec}${fileExtension}`;
    // pattern to search for test files with the same name as current file
    if (fileNameMatchesOnly) {
        return root + osSep + nameMatchPattern;
    }
    // Pattern to search for test files in the current directory
    if (currentDirectoryOnly) {
        // Create a relative path of the current directory
        const root = path_1.posix.dirname(file.path);
        const relative = vscode_1.workspace.asRelativePath(root);
        return relative + osSep + testPattern;
    }
    return root + osSep + testPattern;
}
exports.getSearchPatternForTestFiles = getSearchPatternForTestFiles;
