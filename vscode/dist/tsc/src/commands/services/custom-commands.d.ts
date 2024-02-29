/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { CodyCommand } from '@sourcegraph/cody-shared';
import { type CodyCommandsFile } from '../types';
import { CustomCommandType } from '@sourcegraph/cody-shared/src/commands/types';
/**
 * Handles loading, building, and maintaining Custom Commands retrieved from cody.json files
 */
export declare class CustomCommandsManager implements vscode.Disposable {
    private fileWatcherDisposables;
    private disposables;
    customCommandsMap: Map<string, CodyCommand>;
    userJSON: Record<string, unknown> | null;
    protected configFileName: any;
    private userConfigFile;
    private get workspaceConfigFile();
    constructor();
    getCommands(): [string, CodyCommand][];
    /**
     // TODO (bee) Migrate to use .cody/commands.json
     * Create file watchers for cody.json files.
     * Automatically update the command map when the cody.json files are changed
     */
    init(): void;
    /**
     * Get the uri of the cody.json file for the given type
     */
    private getConfigFileByType;
    refresh(): Promise<CodyCommandsFile>;
    build(type: CustomCommandType): Promise<Map<string, CodyCommand> | null>;
    /**
     * Quick pick for creating a new custom command
     */
    private newCustomCommandQuickPick;
    /**
     * Add the newly create command via quick pick to the cody.json file
     */
    private save;
    private configFileActions;
    /**
     * Reset
     */
    dispose(): void;
    private disposeWatchers;
}
export declare function openCustomCommandDocsLink(): Promise<void>;
export declare function migrateCommandFiles(): Promise<void>;
//# sourceMappingURL=custom-commands.d.ts.map