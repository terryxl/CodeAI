import { URI } from 'vscode-uri';
/**
 * Convert an absolute URI to a (possibly shorter) path to display to the user. The display path is
 * always a path (not a full URI string) and is typically is relative to the nearest workspace root.
 * The path uses OS-native path separators ('/' on macOS/Linux, '\' on Windows).
 *
 * The returned path string MUST ONLY be used for display purposes. It MUST NOT be used to identify
 * or locate files.
 *
 * You MUST call {@link setDisplayPathEnvInfo} at static init time to provide the information about
 * the environment necessary to construct the correct display path.
 *
 * Why is this needed? Why not just use:
 *
 * - `uri.fsPath`: because this is the full path, which is much harder to read than the relative
 *   path
 * - `vscode.workspace.asRelativePath`: because it's not available in webviews, and it does not
 *   handle custom URI schemes (such as if we want to represent remote files that exist on the
 *   Sourcegraph instance).
 * @param location The absolute URI to convert to a display path.
 */
export declare function displayPath(location: URI): string;
/**
 * Dirname of the location's display path, to display to the user. Similar to
 * `dirname(displayPath(location))`, but it uses the right path separators in `dirname` ('\' for
 * file URIs on Windows, '/' otherwise).
 *
 * The returned path string MUST ONLY be used for display purposes. It MUST NOT be used to identify
 * or locate files.
 *
 * Use this instead of other seemingly simpler techniques to avoid a few subtle
 * bugs/inconsistencies:
 *
 * - On Windows, Node's `dirname(uri.fsPath)` breaks on a non-`file` URI on Windows because
 *   `dirname` would use '\' path separators but the URI would have '/' path separators.
 * - In a single-root workspace, Node's `dirname(uri.fsPath)` would return the root directory name,
 *   which is usually superfluous for display purposes. For example, if VS Code is open to a
 *   directory named `myproject` and there is a list of 2 search results, one `file1.txt` (at the
 *   root) and `dir/file2.txt`, then the VS Code-idiomatic way to present the results is as
 *   `file1.txt` and `file2.txt <dir>` (try it in the search sidebar to see).
 */
export declare function displayPathDirname(location: URI): string;
/**
 * Similar to `basename(displayPath(location))`, but it uses the right path separators in `basename`
 * ('\' for file URIs on Windows, '/' otherwise).
 */
export declare function displayPathBasename(location: URI): string;
/**
 * Like {@link displayPath}, but does not show `<WORKSPACE-FOLDER-BASENAME>/` as a prefix if the
 * location is in a workspace folder and there are 2 or more workspace folders.
 */
export declare function displayPathWithoutWorkspaceFolderPrefix(location: URI): string;
export declare function uriHasPrefix(uri: URI, prefix: URI, isWindows: boolean): boolean;
/** The information necessary for {@link displayPath} to compute a display path. */
export interface DisplayPathEnvInfo {
    workspaceFolders: URI[];
    isWindows: boolean;
}
/**
 * Provide the information necessary for {@link displayPath} to compute a display path.
 */
export declare function setDisplayPathEnvInfo(newEnvInfo: DisplayPathEnvInfo | null): DisplayPathEnvInfo | null;
//# sourceMappingURL=displayPath.d.ts.map