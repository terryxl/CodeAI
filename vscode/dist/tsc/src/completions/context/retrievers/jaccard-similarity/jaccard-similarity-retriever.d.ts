import type { URI } from 'vscode-uri';
import type { ContextRetriever, ContextRetrieverOptions } from '../../../types';
import { type JaccardMatch } from './bestJaccardMatch';
/**
 * The Jaccard Similarity Retriever is a sparse, local-only, retrieval strategy that uses local
 * editor content (open tabs and file history) to find relevant code snippets based on the current
 * editor prefix.
 */
export declare class JaccardSimilarityRetriever implements ContextRetriever {
    private snippetWindowSize;
    private maxMatchesPerFile;
    constructor(snippetWindowSize?: number, maxMatchesPerFile?: number);
    identifier: string;
    private history;
    retrieve({ document, docContext, abortSignal, }: ContextRetrieverOptions): Promise<JaccardMatchWithFilename[]>;
    isSupportedForLanguageId(): boolean;
    dispose(): void;
}
interface JaccardMatchWithFilename extends JaccardMatch {
    uri: URI;
}
export {};
//# sourceMappingURL=jaccard-similarity-retriever.d.ts.map