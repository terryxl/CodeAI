/**
 * The protocol for communicating between Cody and local embeddings.
 */
interface InitializeParams {
    codyGatewayEndpoint: string;
    indexPath: string;
    chunkingPolicy?: ChunkingPolicy;
}
interface ChunkingPolicy {
    maxFileSizeBytes: number;
    pathsToExcludeRegexp: string;
}
interface QueryParams {
    repoName: string;
    query: string;
}
export interface QueryResultSet {
    results: QueryResult[];
}
interface QueryResult {
    fileName: string;
    startLine: number;
    endLine: number;
    content: string;
}
interface IndexHealthRequest {
    repoName: string;
}
type IndexHealthResult = IndexHealthResultFound | IndexHealthResultNotFound;
export interface IndexHealthResultFound {
    type: 'found';
    repoName: string;
    format: 'App' | 'LocalEmbeddings';
    commit: string;
    model: string;
    dimension: number;
    numItems: number;
    numItemsDeleted: number;
    numItemsNeedEmbedding: number;
    numItemsFailed: number;
    numFiles: number;
}
interface IndexHealthResultNotFound {
    type: 'notFound';
    repoName: string;
}
export interface IndexRequest {
    repoPath: string;
    mode: IndexRequestMode;
}
type IndexRequestMode = IndexRequestModeNew | IndexRequestModeContinue;
interface IndexRequestModeNew {
    type: 'new';
    model: string;
    dimension: number;
}
interface IndexRequestModeContinue {
    type: 'continue';
}
interface IndexResult {
    repoName: string;
}
interface LoadResult {
    repoName: string;
}
export type Requests = {
    'embeddings/echo': [string, string];
    'embeddings/index': [IndexRequest, IndexResult];
    'embeddings/index-health': [IndexHealthRequest, IndexHealthResult];
    'embeddings/initialize': [InitializeParams, Record<string, never>];
    'embeddings/load': [string, LoadResult];
    'embeddings/query': [QueryParams, QueryResultSet];
    'embeddings/set-token': [string, Record<string, never>];
    'embeddings/shutdown': [Record<string, never>, Record<string, never>];
};
type ProgressValue = Progress | ProgressError | ProgressDone;
interface Progress {
    type: 'progress';
    currentPath: string;
    repoName: string;
    repoPath: string;
    numItems: number;
    totalItems: number;
}
interface ProgressDone {
    type: 'done';
    repoName: string;
}
interface ProgressError {
    type: 'error';
    repoName: string;
    message: string;
}
export type Notifications = {
    'embeddings/progress': [ProgressValue];
};
export {};
//# sourceMappingURL=embeddings-protocol.d.ts.map