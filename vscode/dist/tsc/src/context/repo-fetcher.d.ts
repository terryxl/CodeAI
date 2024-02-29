/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export interface Repo {
    name: string;
    id: string;
}
export declare enum RepoFetcherState {
    Paused = 0,
    Fetching = 1,
    Errored = 2,
    Complete = 3
}
export declare class RepoFetcher implements vscode.Disposable {
    private state_;
    private readonly stateChangedEmitter;
    readonly onStateChanged: vscode.Event<RepoFetcherState>;
    private readonly repoListChangedEmitter;
    readonly onRepoListChanged: vscode.Event<Repo[]>;
    private error_;
    private configurationEpoch;
    private after;
    private repos;
    dispose(): void;
    get lastError(): Error | undefined;
    clientConfigurationDidChange(): void;
    pause(): void;
    resume(): void;
    get repositories(): readonly Repo[];
    get state(): RepoFetcherState;
    private set state(value);
    private fetch;
}
//# sourceMappingURL=repo-fetcher.d.ts.map