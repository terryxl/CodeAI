import type { URI } from 'vscode-uri';
import type { ActiveTextEditorSelectionRange } from '../editor';
import type { Message } from '../sourcegraph-api';
export type ContextFileSource = 'embeddings' | 'user' | 'keyword' | 'editor' | 'filename' | 'search' | 'unified' | 'selection' | 'terminal';
export type ContextFileType = 'file' | 'symbol';
export type SymbolKind = 'class' | 'function' | 'method';
interface ContextFileCommon {
    uri: URI;
    range?: ActiveTextEditorSelectionRange;
    repoName?: string;
    revision?: string;
    /**
     * For anything other than a file or symbol, the title to display (e.g., "Terminal Output").
     */
    title?: string;
    source?: ContextFileSource;
    content?: string;
}
export type ContextFile = ContextFileFile | ContextFileSymbol;
export type ContextFileFile = ContextFileCommon & {
    type: 'file';
};
export type ContextFileSymbol = ContextFileCommon & {
    type: 'symbol';
    /** The fuzzy name of the symbol (if this represents a symbol). */
    symbolName: string;
    kind: SymbolKind;
};
export interface ContextMessage extends Required<Message> {
    file?: ContextFile;
    preciseContext?: PreciseContext;
}
export interface PreciseContext {
    symbol: {
        fuzzyName?: string;
    };
    hoverText: string[];
    definitionSnippet: string;
    filePath: string;
    range?: {
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
    };
}
export interface HoverContext {
    symbolName: string;
    sourceSymbolName?: string;
    content: string[];
    uri: string;
    range?: {
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
    };
}
export declare function getContextMessageWithResponse(text: string, file: ContextFile, response?: string, source?: ContextFileSource): ContextMessage[];
export declare function createContextMessageByFile(file: ContextFile, content: string): ContextMessage[];
export {};
//# sourceMappingURL=messages.d.ts.map