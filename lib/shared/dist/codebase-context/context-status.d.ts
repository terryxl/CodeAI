import type { URI } from 'vscode-uri';
export interface Disposable {
    dispose(): void;
}
export interface ContextStatusProvider {
    onDidChangeStatus(callback: (provider: ContextStatusProvider) => void): Disposable;
    get status(): ContextGroup[];
}
export type ContextProvider = LocalEmbeddingsProvider | SearchProvider;
export interface RemoteSearchProvider {
    kind: 'search';
    type: 'remote';
    state: 'ready' | 'no-match';
    id: string;
    inclusion: 'auto' | 'manual';
}
export interface LocalEmbeddingsProvider {
    kind: 'embeddings';
    state: 'indeterminate' | 'no-match' | 'unconsented' | 'indexing' | 'ready';
    errorReason?: 'not-a-git-repo' | 'git-repo-has-no-remote';
}
export type SearchProvider = LocalSearchProvider | RemoteSearchProvider;
export interface LocalSearchProvider {
    kind: 'search';
    type: 'local';
    state: 'unindexed' | 'indexing' | 'ready' | 'failed';
}
export interface ContextGroup {
    /** The directory that this context group represents. */
    dir?: URI;
    /**
     * Usually `basename(dir)`.
     *
     * TODO(sqs): when old remote embeddings code is removed, remove this field and compute it as
     * late as possible for presentation only.
     */
    displayName: string;
    providers: ContextProvider[];
}
export interface EnhancedContextContextT {
    groups: ContextGroup[];
}
//# sourceMappingURL=context-status.d.ts.map