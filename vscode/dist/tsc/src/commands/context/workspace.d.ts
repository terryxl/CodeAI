import { type ContextFile } from '@sourcegraph/cody-shared';
/**
 * Wrap the vscode findVSCodeFiles function to return context files.
 * Gets workspace files context based on global pattern, exclude pattern and max results.
 *
 * @param globalPattern - Glob pattern to search files
 * @param excludePattern - Glob pattern to exclude files
 * @param maxResults - Max number of results to return
 * @returns Promise resolving to array of context files
 */
export declare function getWorkspaceFilesContext(globalPattern: string, excludePattern?: string, maxResults?: number): Promise<ContextFile[]>;
//# sourceMappingURL=workspace.d.ts.map