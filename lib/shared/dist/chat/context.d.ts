import type { ConfigurationUseContext } from '../configuration';
import type { ActiveTextEditorSelectionRange } from '../editor';
export interface ChatContextStatus {
    mode?: ConfigurationUseContext;
    connection?: boolean;
    endpoint?: string;
    embeddingsEndpoint?: string;
    codebase?: string;
    filePath?: string;
    selectionRange?: ActiveTextEditorSelectionRange;
    supportsKeyword?: boolean;
}
//# sourceMappingURL=context.d.ts.map