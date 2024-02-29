import type { URI } from 'vscode-uri';
import type { Configuration } from '../configuration';
import type { IndexedKeywordContextFetcher, IRemoteSearch, LocalEmbeddingsFetcher } from '../local-context';
import { type ContextFile, type ContextMessage } from './messages';
interface ContextSearchOptions {
    numCodeResults: number;
    numTextResults: number;
}
export declare class CodebaseContext {
    private config;
    private codebase;
    readonly localEmbeddings: LocalEmbeddingsFetcher | undefined;
    private readonly remoteSearch;
    constructor(config: Pick<Configuration, 'useContext'>, codebase: string | undefined, localEmbeddings: LocalEmbeddingsFetcher | undefined, _symf: IndexedKeywordContextFetcher | undefined, remoteSearch: IRemoteSearch | undefined);
    onConfigurationChange(newConfig: typeof this.config): void;
    /**
     * Returns list of context messages for a given query, sorted in *reverse* order of importance (that is,
     * the most important context message appears *last*)
     */
    getContextMessages(workspaceFolderUri: URI, query: string, options: ContextSearchOptions): Promise<ContextMessage[]>;
    private getKeywordContextMessages;
    private getEmbeddingsContextMessages;
    static makeContextMessageWithResponse(groupedResults: {
        file: ContextFile & Required<Pick<ContextFile, 'uri'>>;
        results: string[];
    }): ContextMessage[];
}
export {};
//# sourceMappingURL=index.d.ts.map