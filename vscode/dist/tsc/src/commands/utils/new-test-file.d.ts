import { type URI } from 'vscode-uri';
/**
 * NOTE: This is only being used as fallback when test files cannot be found in current workspace
 *
 * Generates a generic test file name and path for the given file
 * based on conventions for the file extension.
 * @param file - The original file URI
 * @returns The generated test file URI
 */
export declare function createDefaultTestFile(file: URI): URI;
/**
 * Converts a file URI to a corresponding test file URI using conventions based on file extension.
 *
 * If not a test file, generates a default test file name based on file extension conventions.
 *
 * If existing test file URI provided, attempts to match its naming convention.
 * Falls back to default test file name if naming does not follow conventions.
 * @param currentFile - Original file to convert
 * @param testFile - Optional existing test file to match naming with
 * @returns The converted test file
 */
export declare function convertFileUriToTestFileUri(currentFile: URI, testFile?: URI): URI;
//# sourceMappingURL=new-test-file.d.ts.map