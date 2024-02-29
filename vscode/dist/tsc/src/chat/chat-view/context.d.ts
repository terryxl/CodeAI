import { type ConfigurationUseContext } from '@sourcegraph/cody-shared';
import type { VSCodeEditor } from '../../editor/vscode-editor';
import type { LocalEmbeddingsController } from '../../local-context/local-embeddings';
import type { SymfRunner } from '../../local-context/symf';
import type { RemoteSearch } from '../../context/remote-search';
import type { ContextItem } from '../../prompt-builder/types';
export interface GetEnhancedContextOptions {
    strategy: ConfigurationUseContext;
    editor: VSCodeEditor;
    text: string;
    providers: {
        localEmbeddings: LocalEmbeddingsController | null;
        symf: SymfRunner | null;
        remoteSearch: RemoteSearch | null;
    };
    featureFlags: {
        fusedContext: boolean;
    };
    hints: {
        maxChars: number;
    };
}
export declare function getEnhancedContext({ strategy, editor, text, providers, featureFlags, hints, }: GetEnhancedContextOptions): Promise<ContextItem[]>;
export declare function fuseContext(keywordItems: ContextItem[], embeddingsItems: ContextItem[], maxChars: number): ContextItem[];
//# sourceMappingURL=context.d.ts.map