/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
/**
 * Parses `.code/ignore` files from the workspace and sets up a watcher to refresh
 * whenever the files change.
 *
 * NOTE: This is only called once at git extension start up time (gitAPIinit)
 */
export declare function setUpCodyIgnore(): vscode.Disposable;
//# sourceMappingURL=cody-ignore.d.ts.map