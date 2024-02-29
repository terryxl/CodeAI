import { type URI } from 'vscode-uri';
/**
 * Extracts the test type from the given text.
 * @param text - The text to extract the test type from.
 * @returns The extracted test type, which will be "unit", "e2e", or "integration" if found.
 * Returns an empty string if no match is found.
 */
export declare function extractTestType(text: string): string;
/**
 * Checks if the given file uri has a valid test file name.
 * @param uri - The file uri to check
 *
 * Removes file extension and checks if file name starts with 'test' or
 * ends with 'test', excluding files starting with 'test-'.
 * Also returns false for any files in node_modules directory.
 */
export declare function isValidTestFile(uri: URI): boolean;
export declare const trailingNonAlphaNumericRegex: RegExp;
/**
 * Checks if the given test file path matches the path of the original file
 * by comparing stripped down versions of the paths.
 *
 * @param file - The original file URI
 * @param testFile - The possible test file URI to check
 * @returns True if the test file matches the file
 */
export declare function isTestFileForOriginal(file: URI, testFile: URI): boolean;
//# sourceMappingURL=test-commands.d.ts.map