/// <reference path="../../../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { getGraphDocumentSections as defaultGetDocumentSections } from '../../../../graph/lsp/sections';
import type { ContextRetriever, ContextRetrieverOptions, ContextSnippet } from '../../../types';
export declare const registerDebugListener: (listener: (value: void) => void) => () => void;
/**
 * Keeps track of document sections a user is navigating to and retrievers the last visited section
 */
export declare class SectionHistoryRetriever implements ContextRetriever {
    private window;
    private getDocumentSections;
    identifier: string;
    private disposables;
    private activeDocuments;
    private lastVisitedSections;
    private constructor();
    static instance: SectionHistoryRetriever | null;
    static createInstance(window?: Pick<typeof vscode.window, 'onDidChangeVisibleTextEditors' | 'onDidChangeTextEditorSelection' | 'visibleTextEditors'>, workspace?: Pick<typeof vscode.workspace, 'onDidChangeTextDocument'>, getDocumentSections?: typeof defaultGetDocumentSections): SectionHistoryRetriever;
    retrieve({ document, position, docContext, }: {
        document: ContextRetrieverOptions['document'];
        position: ContextRetrieverOptions['position'];
        docContext: ContextRetrieverOptions['docContext'];
    }): Promise<ContextSnippet[]>;
    isSupportedForLanguageId(): boolean;
    private getSectionAtPosition;
    /**
     * A pretty way to print the current state of all cached sections
     */
    debugPrint(selectedDocument?: vscode.TextDocument, selections?: readonly vscode.Selection[]): string;
    /**
     * Loads or reloads a document's sections and attempts to merge new sections with existing
     * sections.
     *
     * TODO(philipp-spiess): Handle the case that a document is being reloaded while it is still
     * loaded.
     */
    private loadDocument;
    /**
     * Diff vscode.window.visibleTextEditors with activeDocuments to load new documents.
     *
     * We rely on the LRU cache to evict documents that are no longer visible.
     *
     * TODO(philipp-spiess): When this method is called while the documents are still being loaded,
     * we might reload a document immediately afterwards.
     */
    private onDidChangeVisibleTextEditors;
    private getActiveDocumentAndSectionForLocation;
    private onDidChangeTextDocument;
    /**
     * When the cursor is moving into a tracked selection, we log the access to keep track of
     * frequently visited sections.
     */
    private onDidChangeTextEditorSelection;
    dispose(): void;
}
//# sourceMappingURL=section-history-retriever.d.ts.map