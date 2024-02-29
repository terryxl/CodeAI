/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export declare function createFileWatchers(configFile?: vscode.Uri): vscode.FileSystemWatcher | null;
export declare function createJSONFile(file: vscode.Uri): Promise<void>;
export declare function saveJSONFile(data: unknown, file: vscode.Uri): Promise<void>;
//# sourceMappingURL=config-file.d.ts.map