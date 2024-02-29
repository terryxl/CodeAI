"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionHistoryRetriever = exports.registerDebugListener = void 0;
const lru_cache_1 = require("lru-cache");
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const graph_1 = require("../../../../graph/lsp/graph");
const sections_1 = require("../../../../graph/lsp/sections");
const doc_context_getters_1 = require("../../../doc-context-getters");
const utils_1 = require("../../../utils");
const utils_2 = require("../../utils");
const TEN_MINUTES = 10 * 60 * 1000;
const NUM_OF_CHANGED_LINES_FOR_SECTION_RELOAD = 3;
const MAX_TRACKED_DOCUMENTS = 10;
const MAX_LAST_VISITED_SECTIONS = 10;
const debugSubscriber = (0, utils_1.createSubscriber)();
exports.registerDebugListener = debugSubscriber.subscribe.bind(debugSubscriber);
/**
 * Keeps track of document sections a user is navigating to and retrievers the last visited section
 */
class SectionHistoryRetriever {
    window;
    getDocumentSections;
    identifier = 'section-history';
    disposables = [];
    // A map of all active documents that are being tracked. We rely on the LRU cache to evict
    // documents that are not being tracked anymore.
    activeDocuments = new lru_cache_1.LRUCache({
        max: MAX_TRACKED_DOCUMENTS,
    });
    // A list of up to ten sections that were being visited last as identifier via their location.
    lastVisitedSections = [];
    constructor(window = vscode.window, workspace = vscode.workspace, getDocumentSections = sections_1.getGraphDocumentSections) {
        this.window = window;
        this.getDocumentSections = getDocumentSections;
        this.disposables.push(window.onDidChangeVisibleTextEditors(this.onDidChangeVisibleTextEditors.bind(this)));
        this.disposables.push(workspace.onDidChangeTextDocument(this.onDidChangeTextDocument.bind(this)));
        this.disposables.push(window.onDidChangeTextEditorSelection(this.onDidChangeTextEditorSelection.bind(this)));
        void this.onDidChangeVisibleTextEditors();
    }
    static instance = null;
    static createInstance(window, workspace, getDocumentSections) {
        if (SectionHistoryRetriever.instance) {
            throw new Error('SectionObserver has already been initialized');
        }
        SectionHistoryRetriever.instance = new SectionHistoryRetriever(window, workspace, getDocumentSections);
        return SectionHistoryRetriever.instance;
    }
    async retrieve({ document, position, docContext, }) {
        const section = this.getSectionAtPosition(document, position);
        const contextRange = (0, doc_context_getters_1.getContextRange)(document, docContext);
        function overlapsContextRange(uri, range) {
            if (!contextRange || !range || uri.toString() !== document.uri.toString()) {
                return false;
            }
            return contextRange.start.line <= range.startLine && contextRange.end.line >= range.endLine;
        }
        return (await Promise.all(this.lastVisitedSections
            .map(location => this.getActiveDocumentAndSectionForLocation(location))
            .filter(cody_shared_1.isDefined)
            // Remove any sections that are not in the same language as the current document
            .filter(([sectionDocument]) => (0, utils_2.baseLanguageId)(sectionDocument.languageId) ===
            (0, utils_2.baseLanguageId)(document.languageId))
            .map(([, section]) => section)
            // Exclude the current section which should be included already as part of the
            // prefix/suffix.
            .filter(compareSection => (0, graph_1.locationKeyFn)(compareSection.location) !==
            (section ? (0, graph_1.locationKeyFn)(section.location) : null))
            // Remove sections that overlap the current prefix/suffix range to avoid
            // duplication.
            .filter(section => !overlapsContextRange(section.location.uri, {
            startLine: section.location.range.start.line,
            endLine: section.location.range.end.line,
        }))
            // Load the fresh file contents for the sections.
            .map(async (section) => {
            try {
                const uri = section.location.uri;
                const textDocument = await vscode.workspace.openTextDocument(uri);
                const content = textDocument.getText(section.location.range);
                return {
                    uri,
                    content,
                    startLine: section.location.range.start.line,
                    endLine: section.location.range.end.line,
                };
            }
            catch (error) {
                // Ignore errors opening the text file. This can happen when the file was deleted
                console.error(error);
                return undefined;
            }
        }))).filter(cody_shared_1.isDefined);
    }
    isSupportedForLanguageId() {
        return true;
    }
    getSectionAtPosition(document, position) {
        return this.activeDocuments
            .get(document.uri.toString())
            ?.sections.find(section => section.location.range.contains(position));
    }
    /**
     * A pretty way to print the current state of all cached sections
     */
    debugPrint(selectedDocument, selections) {
        const lines = [];
        // biome-ignore lint/complexity/noForEach: LRUCache#forEach has different typing than #entries, so just keeping it for now
        this.activeDocuments.forEach(document => {
            lines.push(vscode.workspace.asRelativePath(document.uri));
            for (const section of document.sections) {
                const isSelected = selectedDocument?.uri.toString() === document.uri.toString() &&
                    selections?.some(selection => section.location.range.contains(selection));
                const isLast = document.sections.at(-1) === section;
                lines.push(`  ${isLast ? '└' : '├'}${isSelected ? '*' : '─'} ${section.fuzzyName ?? 'unknown'}`);
            }
        });
        const lastSections = this.lastVisitedSections
            .map(loc => this.getActiveDocumentAndSectionForLocation(loc)?.[1])
            .filter(cody_shared_1.isDefined);
        if (lastSections.length > 0) {
            lines.push('');
            lines.push('Last visited sections:');
            for (let i = 0; i < lastSections.length; i++) {
                const section = lastSections[i];
                const isLast = i === lastSections.length - 1;
                const filePath = vscode.workspace.asRelativePath(section.location.uri);
                lines.push(`  ${isLast ? '└' : '├'} ${filePath} ${section.fuzzyName ?? 'unknown'}`);
            }
        }
        return lines.join('\n');
    }
    /**
     * Loads or reloads a document's sections and attempts to merge new sections with existing
     * sections.
     *
     * TODO(philipp-spiess): Handle the case that a document is being reloaded while it is still
     * loaded.
     */
    async loadDocument(document) {
        const uri = document.uri;
        const lastRevalidateAt = Date.now();
        const lastLines = document.lineCount;
        const sections = (await this.getDocumentSections(document)).map(section => ({
            ...section,
            lastRevalidateAt,
            lastLines: section.location.range.end.line - section.location.range.start.line,
        }));
        const existingDocument = this.activeDocuments.get(uri.toString());
        if (!existingDocument) {
            this.activeDocuments.set(uri.toString(), {
                uri,
                languageId: document.languageId,
                sections,
                lastRevalidateAt,
                lastLines,
            });
            return;
        }
        // If a document already exists, attempt to diff the sections
        const sectionsToRemove = [];
        for (const existingSection of existingDocument.sections) {
            const key = (0, graph_1.locationKeyFn)(existingSection.location);
            const newSection = sections.find(section => (0, graph_1.locationKeyFn)(section.location) === key);
            if (newSection) {
                existingSection.fuzzyName = newSection.fuzzyName;
                existingSection.location = newSection.location;
            }
            else {
                sectionsToRemove.push(existingSection);
            }
        }
        for (const sectionToRemove of sectionsToRemove) {
            const index = existingDocument.sections.indexOf(sectionToRemove);
            if (index !== -1) {
                existingDocument.sections.splice(index, 1);
            }
        }
        for (const newSection of sections) {
            const key = (0, graph_1.locationKeyFn)(newSection.location);
            const existingSection = existingDocument.sections.find(section => (0, graph_1.locationKeyFn)(section.location) === key);
            if (!existingSection) {
                existingDocument.sections.push(newSection);
            }
        }
        debugSubscriber.notify();
    }
    /**
     * Diff vscode.window.visibleTextEditors with activeDocuments to load new documents.
     *
     * We rely on the LRU cache to evict documents that are no longer visible.
     *
     * TODO(philipp-spiess): When this method is called while the documents are still being loaded,
     * we might reload a document immediately afterwards.
     */
    async onDidChangeVisibleTextEditors() {
        const promises = [];
        for (const editor of this.window.visibleTextEditors) {
            if (editor.document.uri.scheme !== 'file') {
                continue;
            }
            const uri = editor.document.uri.toString();
            if (!this.activeDocuments.has(uri)) {
                promises.push(this.loadDocument(editor.document));
            }
        }
        await Promise.all(promises);
    }
    getActiveDocumentAndSectionForLocation(location) {
        const uri = location.uri.toString();
        if (!this.activeDocuments.has(uri)) {
            return undefined;
        }
        const document = this.activeDocuments.get(uri);
        if (!document) {
            return undefined;
        }
        const locationKey = (0, graph_1.locationKeyFn)(location);
        const section = document.sections.find(section => (0, graph_1.locationKeyFn)(section.location) === locationKey);
        if (section) {
            return [document, section];
        }
        return undefined;
    }
    async onDidChangeTextDocument(event) {
        const uri = event.document.uri.toString();
        if (!this.activeDocuments.has(uri)) {
            return;
        }
        const document = this.activeDocuments.get(uri);
        // We start by checking if the document has changed significantly since sections were last
        // loaded. If so, we reload the document which will mark all sections as dirty.
        const documentChangedSignificantly = Math.abs(document.lastLines - event.document.lineCount) >=
            NUM_OF_CHANGED_LINES_FOR_SECTION_RELOAD;
        const sectionsOutdated = Date.now() - document.lastRevalidateAt > TEN_MINUTES;
        if (documentChangedSignificantly || sectionsOutdated) {
            await this.loadDocument(event.document);
            return;
        }
    }
    /**
     * When the cursor is moving into a tracked selection, we log the access to keep track of
     * frequently visited sections.
     */
    onDidChangeTextEditorSelection(event) {
        const editor = event.textEditor;
        const position = event.selections[0].active;
        const section = this.getSectionAtPosition(editor.document, position);
        if (!section) {
            return;
        }
        pushUniqueAndTruncate(this.lastVisitedSections, section.location, MAX_LAST_VISITED_SECTIONS);
        debugSubscriber.notify();
    }
    dispose() {
        SectionHistoryRetriever.instance = null;
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        debugSubscriber.notify();
    }
}
exports.SectionHistoryRetriever = SectionHistoryRetriever;
function pushUniqueAndTruncate(array, item, truncate) {
    const indexOf = array.findIndex(i => (0, graph_1.locationKeyFn)(i) === (0, graph_1.locationKeyFn)(item));
    if (indexOf > -1) {
        // Remove the item so it is put to the front again
        array.splice(indexOf, 1);
    }
    if (array.length >= truncate) {
        array.pop();
    }
    array.unshift(item);
    return array;
}
