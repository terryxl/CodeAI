import { type ContextGroup, type ContextSearchResult, type ContextStatusProvider, type Disposable, type IRemoteSearch, type ContextFileFile } from '@sourcegraph/cody-shared';
import type * as repofetcher from './repo-fetcher';
import type { URI } from 'vscode-uri';
export declare enum RepoInclusion {
    Automatic = "auto",
    Manual = "manual"
}
export declare class RemoteSearch implements ContextStatusProvider, IRemoteSearch {
    static readonly MAX_REPO_COUNT = 10;
    private statusChangedEmitter;
    private reposAuto;
    private reposManual;
    dispose(): void;
    onDidChangeStatus(callback: (provider: ContextStatusProvider) => void): Disposable;
    get status(): ContextGroup[];
    removeRepo(repoId: string): void;
    setRepos(repos: repofetcher.Repo[], inclusion: RepoInclusion): void;
    getRepos(inclusion: RepoInclusion): repofetcher.Repo[];
    getRepoIdSet(): Set<string>;
    query(query: string): Promise<ContextSearchResult[]>;
    setWorkspaceUri(uri: URI): Promise<void>;
    search(query: string): Promise<ContextFileFile[]>;
}
//# sourceMappingURL=remote-search.d.ts.map