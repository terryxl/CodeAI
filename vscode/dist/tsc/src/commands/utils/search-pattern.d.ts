import { type URI } from 'vscode-uri';
/**
 * Returns a glob pattern to search for test files.
 * Used by the unit test commands to get context files.
 *
 * @param file The current file
 * @param currentDirectoryOnly If true, only search for files in the current directory
 * @param fileNameMatchesOnly If true, only search for files with the same name as the current file
 */
export declare function getSearchPatternForTestFiles(file: URI, currentDirectoryOnly?: boolean, fileNameMatchesOnly?: boolean): string;
//# sourceMappingURL=search-pattern.d.ts.map