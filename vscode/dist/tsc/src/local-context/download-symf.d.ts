/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
/**
 * Get the path to `symf`. If the symf binary is not found, download it.
 */
export declare function getSymfPath(context: vscode.ExtensionContext): Promise<string | null>;
export declare function fileExists(path: string): Promise<boolean>;
//# sourceMappingURL=download-symf.d.ts.map