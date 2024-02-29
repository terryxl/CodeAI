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
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const textDocument_1 = require("../../../../testutils/textDocument");
const docContextGetters = __importStar(require("../../../doc-context-getters"));
const section_history_retriever_1 = require("./section-history-retriever");
const document1Uri = (0, cody_shared_1.testFileUri)('document1.ts');
const document2Uri = (0, cody_shared_1.testFileUri)('document2.ts');
const disposable = {
    dispose: () => { },
};
(0, vitest_1.describe)('GraphSectionObserver', () => {
    let testDocuments;
    let visibleTextEditors;
    let onDidChangeVisibleTextEditors;
    let onDidChangeTextEditorSelection;
    let onDidChangeTextDocument;
    let getDocumentSections;
    let sectionObserver;
    (0, vitest_1.beforeEach)(async () => {
        testDocuments = {
            document1: {
                uri: document1Uri,
                lineCount: 20,
                sections: [
                    { fuzzyName: 'foo', location: { uri: document1Uri, range: (0, textDocument_1.range)(0, 0, 10, 0) } },
                    { fuzzyName: 'bar', location: { uri: document1Uri, range: (0, textDocument_1.range)(11, 0, 20, 0) } },
                ],
            },
            document2: {
                uri: document2Uri,
                lineCount: 20,
                sections: [
                    { fuzzyName: 'baz', location: { uri: document2Uri, range: (0, textDocument_1.range)(0, 0, 10, 0) } },
                    { fuzzyName: 'qux', location: { uri: document2Uri, range: (0, textDocument_1.range)(11, 0, 20, 0) } },
                ],
            },
        };
        const getContextRangeSpy = vitest_1.vitest.spyOn(docContextGetters, 'getContextRange');
        getContextRangeSpy.mockImplementation(() => (0, textDocument_1.range)(0, 0, 20, 0));
        visibleTextEditors = vitest_1.vitest
            .fn()
            .mockImplementation(() => [{ document: testDocuments.document1 }]);
        getDocumentSections = vitest_1.vitest
            .fn()
            .mockImplementation((document) => {
            const doc = Object.values(testDocuments).find(doc => doc.uri.toString() === document.uri.toString());
            return doc?.sections ?? [];
        });
        sectionObserver = section_history_retriever_1.SectionHistoryRetriever.createInstance({
            // Mock VS Code event handlers so we can fire them manually
            onDidChangeVisibleTextEditors: (_onDidChangeVisibleTextEditors) => {
                onDidChangeVisibleTextEditors = _onDidChangeVisibleTextEditors;
                return disposable;
            },
            onDidChangeTextEditorSelection: (_onDidChangeTextEditorSelection) => {
                onDidChangeTextEditorSelection = _onDidChangeTextEditorSelection;
                return disposable;
            },
            get visibleTextEditors() {
                return visibleTextEditors();
            },
        }, {
            onDidChangeTextDocument: (_onDidChangeTextDocument) => {
                onDidChangeTextDocument = _onDidChangeTextDocument;
                return disposable;
            },
        }, getDocumentSections);
        // The section observer loads the document asynchronously, so we wait
        // for it to finish loading.
        await nextTick();
    });
    (0, vitest_1.afterEach)(() => {
        sectionObserver.dispose();
    });
    (0, vitest_1.it)('loads visible documents when it loads', () => {
        (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
          "file:///document1.ts
            ├─ foo
            └─ bar"
        `);
    });
    (0, vitest_1.it)('loads a new document when it becomes visible', async () => {
        visibleTextEditors.mockImplementation(() => [
            { document: testDocuments.document1 },
            { document: testDocuments.document2 },
        ]);
        await onDidChangeVisibleTextEditors();
        (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
          "file:///document2.ts
            ├─ baz
            └─ qux
          file:///document1.ts
            ├─ foo
            └─ bar"
        `);
    });
    (0, vitest_1.it)('does not unload documents that are no longer visible', async () => {
        visibleTextEditors.mockImplementation(() => [{ document: testDocuments.document2 }]);
        await onDidChangeVisibleTextEditors();
        (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
          "file:///document2.ts
            ├─ baz
            └─ qux
          file:///document1.ts
            ├─ foo
            └─ bar"
        `);
    });
    (0, vitest_1.it)('reloads the sections when two new lines are added', async () => {
        testDocuments.document1.lineCount = 23;
        testDocuments.document1.sections = [
            { fuzzyName: 'foo', location: { uri: document1Uri, range: (0, textDocument_1.range)(2, 0, 12, 0) } },
            { fuzzyName: 'baz', location: { uri: document1Uri, range: (0, textDocument_1.range)(13, 0, 22, 0) } },
        ];
        await onDidChangeTextDocument({
            document: testDocuments.document1,
            contentChanges: [],
        });
        (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
          "file:///document1.ts
            ├─ foo
            └─ baz"
        `);
    });
    (0, vitest_1.it)('reloads sections when the document is changed', async () => {
        await onDidChangeTextEditorSelection({
            textEditor: { document: testDocuments.document1 },
            selections: [{ active: { line: 1, character: 0 } }],
        });
        (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
          "file:///document1.ts
            ├─ foo
            └─ bar

          Last visited sections:
            └ file:///document1.ts foo"
        `);
        testDocuments.document1.lineCount = 10;
        testDocuments.document1.sections = [
            { fuzzyName: 'baz', location: { uri: document1Uri, range: (0, textDocument_1.range)(0, 0, 10, 0) } },
        ];
        await onDidChangeTextDocument({
            document: testDocuments.document1,
            contentChanges: [],
        });
        (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
          "file:///document1.ts
            └─ baz

          Last visited sections:
            └ file:///document1.ts baz"
        `);
    });
    (0, vitest_1.describe)('getSectionHistory', () => {
        (0, vitest_1.it)('returns the last visited section', async () => {
            // Open document 2
            visibleTextEditors.mockImplementation(() => [
                { document: testDocuments.document1 },
                { document: testDocuments.document2 },
            ]);
            await onDidChangeVisibleTextEditors();
            // Preload the first section in document 2
            await onDidChangeTextEditorSelection({
                textEditor: { document: testDocuments.document2 },
                selections: [{ active: { line: 0, character: 0 } }],
            });
            // Preload the first section in document 1
            await onDidChangeTextEditorSelection({
                textEditor: { document: testDocuments.document1 },
                selections: [{ active: { line: 0, character: 0 } }],
            });
            // We opened and preloaded the first section of both documents and have visited them
            (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
              "file:///document1.ts
                ├─ foo
                └─ bar
              file:///document2.ts
                ├─ baz
                └─ qux

              Last visited sections:
                ├ file:///document1.ts foo
                └ file:///document2.ts baz"
            `);
            const context = await sectionObserver.retrieve({
                document: testDocuments.document1,
                position: {
                    line: 0,
                    character: 0,
                },
                docContext: {},
            });
            (0, vitest_1.expect)(context[0]).toEqual({
                content: 'foo\nbar\nfoo',
                uri: document2Uri,
                endLine: 10,
                startLine: 0,
            });
        });
        (0, vitest_1.it)('does not include sections that are contained in the prefix/suffix range', async () => {
            // Visit the first and second section in document 1
            await onDidChangeTextEditorSelection({
                textEditor: { document: testDocuments.document1 },
                selections: [{ active: { line: 0, character: 0 } }],
            });
            await onDidChangeTextEditorSelection({
                textEditor: { document: testDocuments.document1 },
                selections: [{ active: { line: 11, character: 0 } }],
            });
            (0, vitest_1.expect)((0, textDocument_1.withPosixPathsInString)(sectionObserver.debugPrint())).toMatchInlineSnapshot(`
              "file:///document1.ts
                ├─ foo
                └─ bar

              Last visited sections:
                ├ file:///document1.ts bar
                └ file:///document1.ts foo"
            `);
            const context = await sectionObserver.retrieve({
                document: testDocuments.document1,
                position: {
                    line: 0,
                    character: 0,
                },
                docContext: {},
            });
            (0, vitest_1.expect)(context.length).toBe(0);
        });
    });
});
function nextTick() {
    return new Promise(resolve => process.nextTick(resolve));
}
