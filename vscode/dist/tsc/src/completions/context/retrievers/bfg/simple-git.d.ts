/// <reference path="../../../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export interface SimpleRepository {
    uri: vscode.Uri;
    commit: string;
}
/**
 * Returns a git repo metadata given any path that belongs to a git repo,
 * regardless if it's the root directory or not.
 *
 * This function invokes the `git` CLI with the assumption that it's going to be
 * installed on the user's computer. This is not going to work everywhere but
 * it's a starting point. Ideally, we should use a pure JS implementation
 * instead so that we don't have to rely on external tools.
 */
export declare function inferGitRepository(uri: vscode.Uri): Promise<SimpleRepository | null>;
//# sourceMappingURL=simple-git.d.ts.map