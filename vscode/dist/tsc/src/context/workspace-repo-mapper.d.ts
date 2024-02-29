/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { CodebaseRepoIdMapper } from './enterprise-context-factory';
import type { Repo } from './repo-fetcher';
export declare class WorkspaceRepoMapper implements vscode.Disposable, CodebaseRepoIdMapper {
    private changeEmitter;
    private disposables;
    private repos;
    private started;
    dispose(): void;
    clientConfigurationDidChange(): void;
    repoForCodebase(repoName: string): Promise<Repo | undefined>;
    start(): Promise<void>;
    get workspaceRepos(): {
        name: string;
        id: string;
    }[];
    get onChange(): vscode.Event<{
        name: string;
        id: string;
    }[]>;
    private updateRepos;
    private findRepoIds;
}
//# sourceMappingURL=workspace-repo-mapper.d.ts.map