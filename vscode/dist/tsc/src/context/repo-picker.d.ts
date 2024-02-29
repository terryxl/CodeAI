/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { WorkspaceRepoMapper } from './workspace-repo-mapper';
import { type Repo, type RepoFetcher } from './repo-fetcher';
export declare class RemoteRepoPicker implements vscode.Disposable {
    private readonly fetcher;
    private readonly workspaceRepoMapper;
    private readonly maxSelectedRepoCount;
    private disposables;
    private readonly quickpick;
    private prefetchedRepos;
    constructor(fetcher: RepoFetcher, workspaceRepoMapper: WorkspaceRepoMapper);
    dispose(): void;
    private updateTitle;
    getDefaultRepos(): Promise<Repo[]>;
    show(selection: Repo[]): Promise<Repo[] | undefined>;
    private handleRepoListChanged;
}
//# sourceMappingURL=repo-picker.d.ts.map