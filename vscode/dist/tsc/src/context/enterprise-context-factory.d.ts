/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import { RemoteRepoPicker } from './repo-picker';
import { RemoteSearch } from './remote-search';
import { type Repo } from './repo-fetcher';
export declare class EnterpriseContextFactory implements vscode.Disposable {
    readonly repoPicker: RemoteRepoPicker;
    private readonly fetcher;
    private readonly workspaceRepoMapper;
    constructor();
    dispose(): void;
    clientConfigurationDidChange(): void;
    createRemoteSearch(): RemoteSearch;
    getCodebaseRepoIdMapper(): CodebaseRepoIdMapper;
}
export interface CodebaseRepoIdMapper {
    repoForCodebase(codebase: string): Promise<Repo | undefined>;
}
//# sourceMappingURL=enterprise-context-factory.d.ts.map