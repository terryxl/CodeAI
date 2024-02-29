import { type ContextFile } from '@sourcegraph/cody-shared';
import { type URI } from 'vscode-uri';
/**
 * Gets context messages for the files in the given directory.
 * Or if no directory is given, gets the context messages for the files in the current directory.
 *
 * Loops through the files in the directory, gets the content of each file,
 * truncates it, and adds it to the context messages along with the file name.
 * Limits file sizes to 1MB.
 */
export declare function getContextFileFromDirectory(directory?: URI): Promise<ContextFile[]>;
//# sourceMappingURL=directory.d.ts.map